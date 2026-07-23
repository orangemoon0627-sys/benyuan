import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { lstat, readdir, readFile, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";

const IOS_SOURCE_ROOT = path.join("mobile", "benyuan_origin_ios_shell");
const IGNORED_PATH_PARTS = new Set(["xcuserdata", ".DS_Store"]);

export function resolveIosArtifactPath(root, artifactPath) {
  return path.resolve(root, artifactPath);
}

export async function canonicalizeIosArtifactPath(root, artifactPath) {
  return realpath(resolveIosArtifactPath(root, artifactPath));
}

function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function shouldIgnore(relativePath) {
  return relativePath.split(path.sep).some((part) => IGNORED_PATH_PARTS.has(part) || part.endsWith(".xcuserstate"));
}

async function listSourceFiles(root, relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

export async function collectIosArtifactProvenance(root) {
  const sourceFiles = (await listSourceFiles(root, IOS_SOURCE_ROOT)).sort();
  const hash = createHash("sha256");
  let latestModifiedAtMs = 0;

  for (const relativePath of sourceFiles) {
    const absolutePath = path.join(root, relativePath);
    const [contents, metadata] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
    hash.update(relativePath);
    hash.update("\0");
    hash.update(contents);
    hash.update("\0");
    latestModifiedAtMs = Math.max(latestModifiedAtMs, metadata.mtimeMs);
  }

  const gitStatus = runGit(root, ["status", "--porcelain", "--untracked-files=all", "--", IOS_SOURCE_ROOT]);
  return {
    schemaVersion: 1,
    gitRevision: runGit(root, ["rev-parse", "HEAD"]) || null,
    gitDirty: gitStatus.length > 0,
    sourceHash: hash.digest("hex"),
    sourceFileCount: sourceFiles.length,
    sourceModifiedAt: latestModifiedAtMs > 0 ? new Date(latestModifiedAtMs).toISOString() : null,
  };
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function listArchiveEntries(root, relativeDirectory = "") {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = (await readdir(absoluteDirectory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listArchiveEntries(root, relativePath)));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      files.push({ relativePath, symbolicLink: entry.isSymbolicLink() });
    }
  }

  return files;
}

async function hashArchive(root) {
  const entries = await listArchiveEntries(root);
  const hash = createHash("sha256");
  let byteSize = 0;

  for (const entry of entries) {
    hash.update(entry.relativePath);
    hash.update("\0");
    if (entry.symbolicLink) {
      hash.update("symlink\0");
      hash.update(await readlink(path.join(root, entry.relativePath)));
    } else {
      hash.update("file\0");
      const absolutePath = path.join(root, entry.relativePath);
      const metadata = await lstat(absolutePath);
      byteSize += metadata.size;
      for await (const chunk of createReadStream(absolutePath)) {
        hash.update(chunk);
      }
    }
    hash.update("\0");
  }

  return {
    archiveSha256: hash.digest("hex"),
    archiveEntryCount: entries.length,
    archiveByteSize: byteSize,
  };
}

export async function collectIosArchiveIdentity(archivePath) {
  const canonicalArchivePath = await realpath(path.resolve(archivePath));
  const applicationsPath = path.join(canonicalArchivePath, "Products", "Applications");
  const appNames = (await readdir(applicationsPath)).filter((name) => name.endsWith(".app")).sort();
  if (appNames.length !== 1) {
    throw new Error(`ios_archive_application_count_invalid:${appNames.length}`);
  }

  const appName = appNames[0];
  const executableName = path.basename(appName, ".app");
  const executablePath = path.join(applicationsPath, appName, executableName);
  const metadata = await stat(executablePath);
  if (!metadata.isFile()) {
    throw new Error("ios_archive_executable_missing");
  }

  const archiveIdentity = await hashArchive(canonicalArchivePath);
  return {
    schemaVersion: 1,
    archivePath: canonicalArchivePath,
    ...archiveIdentity,
    applicationPath: path.relative(canonicalArchivePath, path.join(applicationsPath, appName)),
    executablePath: path.relative(canonicalArchivePath, executablePath),
    executableSize: metadata.size,
    executableSha256: await hashFile(executablePath),
  };
}
