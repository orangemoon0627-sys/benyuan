#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const shellProjectDir = path.join(root, "mobile", "benyuan_origin_ios_shell");
const projectPath = path.join(shellProjectDir, "BenyuanOriginShell.xcodeproj");
const outputDir = path.join(root, "output");
const archivePath = process.env.BENYUAN_IOS_ARCHIVE_PATH ?? path.join(outputDir, "BenyuanOriginShell.xcarchive");
const outputPath = path.join(outputDir, "benyuan-ios-shell-archive.json");
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? "Release";
const scheme = "BenyuanOriginShell";
const teamId = process.env.BENYUAN_IOS_DEVELOPMENT_TEAM ?? null;
const allowUnsigned = process.env.BENYUAN_IOS_ALLOW_UNSIGNED !== "0";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function parseBuildSettings(raw) {
  const settings = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (!match) continue;
    settings[match[1]] = match[2].trim();
  }
  return settings;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  run("xcodegen", ["generate"], { cwd: shellProjectDir });

  const buildArgs = [
    "-project",
    projectPath,
    "-scheme",
    scheme,
    "-configuration",
    configuration,
    "-destination",
    "generic/platform=iOS",
  ];

  const settings = parseBuildSettings(run("xcodebuild", [...buildArgs, "-showBuildSettings"], { cwd: shellProjectDir }));
  const archiveArgs = [...buildArgs, "archive", "-archivePath", archivePath];

  if (teamId) {
    archiveArgs.push(`DEVELOPMENT_TEAM=${teamId}`, "CODE_SIGN_STYLE=Automatic");
  } else if (allowUnsigned) {
    archiveArgs.push("CODE_SIGNING_ALLOWED=NO");
  } else {
    throw new Error("ios_archive_signing_required: set BENYUAN_IOS_DEVELOPMENT_TEAM or BENYUAN_IOS_ALLOW_UNSIGNED=1");
  }

  run("xcodebuild", archiveArgs, { cwd: shellProjectDir });

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    archivePath,
    scheme,
    bundleId: settings.PRODUCT_BUNDLE_IDENTIFIER ?? null,
    marketingVersion: settings.MARKETING_VERSION ?? null,
    buildNumber: settings.CURRENT_PROJECT_VERSION ?? null,
    signing: {
      mode: teamId ? "automatic" : "unsigned",
      teamId,
    },
  };

  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
  const message = [error instanceof Error ? error.message : String(error), stdout, stderr]
    .filter(Boolean)
    .join("\n\n");
  console.error(message);
  process.exit(1);
});
