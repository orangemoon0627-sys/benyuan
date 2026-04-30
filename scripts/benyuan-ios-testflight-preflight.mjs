#!/usr/bin/env node
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.join(root, "output");
const outputPath = path.join(outputDir, "benyuan-ios-testflight-preflight.json");
const projectYmlPath = path.join(root, "mobile", "benyuan_origin_ios_shell", "project.yml");
const appIconContentsPath = path.join(
  root,
  "mobile",
  "benyuan_origin_ios_shell",
  "Assets.xcassets",
  "AppIcon.appiconset",
  "Contents.json",
);
const shellBuildPath = path.join(outputDir, "benyuan-ios-shell-build.json");
const nativeSmokePath = path.join(outputDir, "benyuan-ios-native-smoke.json");
const archivePath = path.join(outputDir, "benyuan-ios-shell-archive.json");

function matchFirst(text, pattern) {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function collectConfigBlock(text, configName) {
  const escaped = configName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\n\\s{8}${escaped}:\\n([\\s\\S]*?)(?=\\n\\s{8}[A-Za-z]|\\n\\s{4}[A-Za-z]|$)`);
  return text.match(pattern)?.[1] ?? "";
}

function extractInfoValue(block, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return matchFirst(block, new RegExp(`${escaped}:\\s*(.+)`));
}

function isPlaceholderReleaseUrl(raw) {
  if (!raw) return true;
  try {
    const url = new URL(raw);
    const host = url.host.toLowerCase();
    return host.endsWith(".invalid") || host === "127.0.0.1" || host === "localhost";
  } catch {
    return true;
  }
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const projectYml = await readFile(projectYmlPath, "utf8");
  const iconContents = JSON.parse(await readFile(appIconContentsPath, "utf8"));
  const shellBuild = await readJsonIfPresent(shellBuildPath);
  const nativeSmoke = await readJsonIfPresent(nativeSmokePath);
  const archive = await readJsonIfPresent(archivePath);

  const displayName = matchFirst(projectYml, /INFOPLIST_KEY_CFBundleDisplayName:\s*(.+)/);
  const marketingVersion = matchFirst(projectYml, /MARKETING_VERSION:\s*(.+)/);
  const buildNumber = matchFirst(projectYml, /CURRENT_PROJECT_VERSION:\s*(.+)/);
  const bundleId = matchFirst(projectYml, /PRODUCT_BUNDLE_IDENTIFIER:\s*(.+)/);

  const stagingBlock = collectConfigBlock(projectYml, "Staging");
  const releaseBlock = collectConfigBlock(projectYml, "Release");
  const stagingUrl = extractInfoValue(stagingBlock, "INFOPLIST_KEY_BenyuanShellStagingBaseURL");
  const releaseUrl = extractInfoValue(releaseBlock, "INFOPLIST_KEY_BenyuanShellProductionBaseURL");

  const iconImages = Array.isArray(iconContents.images) ? iconContents.images : [];
  const iconFiles = iconImages.map((image) => image.filename).filter(Boolean);
  const iconMissing = [];
  for (const filename of iconFiles) {
    const iconPath = path.join(path.dirname(appIconContentsPath), filename);
    if (!(await fileExists(iconPath))) {
      iconMissing.push(filename);
    }
  }

  const blockers = [];
  if (isPlaceholderReleaseUrl(stagingUrl)) {
    blockers.push("staging_base_url_missing");
  }
  if (isPlaceholderReleaseUrl(releaseUrl)) {
    blockers.push("production_base_url_missing");
  }
  if (iconFiles.length === 0 || iconMissing.length > 0) {
    blockers.push("app_icon_incomplete");
  }
  if (!shellBuild) {
    blockers.push("shell_build_artifact_missing");
  }
  if (!nativeSmoke) {
    blockers.push("native_smoke_artifact_missing");
  }
  if (!archive) {
    blockers.push("release_archive_missing");
  } else if (archive.signing?.mode !== "automatic" || !archive.signing?.teamId) {
    blockers.push("signed_release_archive_missing");
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    shell: {
      displayName,
      marketingVersion,
      buildNumber,
      bundleId,
    },
    releaseConfig: {
      stagingBaseUrl: stagingUrl,
      productionBaseUrl: releaseUrl,
      usesPlaceholderUrls: isPlaceholderReleaseUrl(stagingUrl) || isPlaceholderReleaseUrl(releaseUrl),
    },
    assets: {
      appIconReady: iconFiles.length > 0 && iconMissing.length === 0,
      iconFiles,
      iconMissing,
    },
    verificationArtifacts: {
      shellBuild: shellBuild
        ? {
            generatedAt: shellBuild.generatedAt ?? null,
            configuration: shellBuild.configuration ?? null,
          }
        : null,
      nativeSmoke: nativeSmoke
        ? {
            generatedAt: nativeSmoke.generatedAt ?? null,
            configuration: nativeSmoke.configuration ?? null,
          }
        : null,
      archive: archive
        ? {
            generatedAt: archive.generatedAt ?? null,
            configuration: archive.configuration ?? null,
            archivePath: archive.archivePath ?? null,
            signing: archive.signing ?? null,
          }
        : null,
    },
    blockers,
    readyForTestFlightUpload: blockers.length === 0,
    nextManualSteps: [
      "在 project.yml 中填入真实 staging / production base URL",
      "设置 BENYUAN_IOS_DEVELOPMENT_TEAM 并完成一次 signed Release archive",
      "完成一轮真机回归：相机、相册、分享、外链、冷启动、后台恢复",
      "上传 TestFlight 并记录首轮内部安装验证",
    ],
  };

  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (blockers.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
