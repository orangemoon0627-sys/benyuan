#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  collectIosProjectConfig,
  collectTestFlightExportStatus,
  evaluateIosAuthReleaseReadiness,
  evaluateTestFlightExportFreshness,
} from "./benyuan-ios-testflight-preflight-lib.mjs";

const root = process.cwd();
const outputDir = path.join(root, "output");
const outputPath = path.join(outputDir, "benyuan-ios-testflight-preflight.json");
const projectYmlPath = path.join(root, "mobile", "benyuan_origin_ios_shell", "project.yml");
const entitlementsPath = path.join(root, "mobile", "benyuan_origin_ios_shell", "BenyuanOriginShell.entitlements");
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
const exportSummaryPath = path.join(outputDir, "benyuan-ios-shell-export.json");
const distributionSummaryPath = path.join(outputDir, "testflight-export", "DistributionSummary.plist");

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

function readPlistJson(filePath) {
  const script = `
import datetime
import json
import plistlib
import sys

def normalize(value):
    if isinstance(value, dict):
        return {str(k): normalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [normalize(v) for v in value]
    if isinstance(value, bytes):
        return value.hex()
    if isinstance(value, datetime.datetime):
        return value.isoformat()
    return value

with open(sys.argv[1], "rb") as handle:
    print(json.dumps(normalize(plistlib.load(handle))))
`;
  return JSON.parse(execFileSync("python3", ["-c", script, filePath], { encoding: "utf8" }));
}

async function readProvisioningProfile(profilePath) {
  try {
    const profilePlist = execFileSync("security", ["cms", "-D", "-i", profilePath], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const decodedPath = path.join(outputDir, "benyuan-ios-embedded-profile.plist");
    await writeFile(decodedPath, profilePlist);
    return readPlistJson(decodedPath);
  } catch {
    return null;
  }
}

async function collectArchiveDistributionStatus(archive) {
  const archiveDir = archive?.archivePath;
  if (!archiveDir) return null;

  const archiveInfoPath = path.join(archiveDir, "Info.plist");
  if (!(await fileExists(archiveInfoPath))) return null;

  try {
    const archiveInfo = readPlistJson(archiveInfoPath);
    const appPath = archiveInfo?.ApplicationProperties?.ApplicationPath ?? "Applications/BenyuanOriginShell.app";
    const appBundlePath = path.join(archiveDir, "Products", appPath);
    const embeddedProfilePath = path.join(appBundlePath, "embedded.mobileprovision");
    const embeddedProfile = (await fileExists(embeddedProfilePath)) ? await readProvisioningProfile(embeddedProfilePath) : null;
    const signingIdentity = archiveInfo?.ApplicationProperties?.SigningIdentity ?? null;
    const entitlements = embeddedProfile?.Entitlements ?? {};
    const provisionedDevices = embeddedProfile?.ProvisionedDevices;
    const isDistributionIdentity = typeof signingIdentity === "string" && /Apple Distribution|iPhone Distribution/.test(signingIdentity);
    const isAppStoreProfile = entitlements["beta-reports-active"] === true && !Array.isArray(provisionedDevices);

    return {
      signingIdentity,
      profileName: embeddedProfile?.Name ?? null,
      profileTeam: embeddedProfile?.TeamIdentifier?.[0] ?? null,
      betaReportsActive: entitlements["beta-reports-active"] === true,
      provisionedDeviceCount: Array.isArray(provisionedDevices) ? provisionedDevices.length : 0,
      isDistributionIdentity,
      isAppStoreProfile,
      readyForAppStoreConnect: isDistributionIdentity && isAppStoreProfile,
    };
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const projectYml = await readFile(projectYmlPath, "utf8");
  const entitlementsText = await readFile(entitlementsPath, "utf8");
  const iconContents = JSON.parse(await readFile(appIconContentsPath, "utf8"));
  const shellBuild = await readJsonIfPresent(shellBuildPath);
  const nativeSmoke = await readJsonIfPresent(nativeSmokePath);
  const archive = await readJsonIfPresent(archivePath);
  const archiveDistribution = await collectArchiveDistributionStatus(archive);
  const exportSummary = await readJsonIfPresent(exportSummaryPath);
  const distributionSummaryExists = await fileExists(distributionSummaryPath);
  const exportDistribution = distributionSummaryExists
    ? collectTestFlightExportStatus(readPlistJson(distributionSummaryPath), exportSummary)
    : null;
  const ipaExists = exportSummary?.ipaPath ? await fileExists(exportSummary.ipaPath) : false;
  const exportFreshness = evaluateTestFlightExportFreshness({
    archive,
    exportSummary,
    exportDistribution,
    distributionSummaryExists,
    ipaExists,
  });
  const projectConfig = collectIosProjectConfig(projectYml);
  const { displayName, marketingVersion, buildNumber, bundleId } = projectConfig.shell;
  const { stagingBaseUrl: stagingUrl, productionBaseUrl: releaseUrl } = projectConfig.releaseConfig;
  const authRelease = evaluateIosAuthReleaseReadiness({
    authConfig: projectConfig.authConfig,
    entitlementsText,
    authRunbookPresent: await fileExists(path.join(root, "docs", "benyuan-auth-wechat-sms-runbook-2026-05-08.md")),
    authSmokeScriptsPresent: {
      contract: await fileExists(path.join(root, "scripts", "benyuan-auth-contract-smoke.mjs")),
      runtime: await fileExists(path.join(root, "scripts", "benyuan-auth-runtime-smoke.mjs")),
      smsAliyun: await fileExists(path.join(root, "scripts", "benyuan-auth-sms-aliyun-smoke.mjs")),
    },
  });

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
  blockers.push(...authRelease.blockers);
  const hasFreshReadyExport = exportFreshness.readyForAppStoreConnect === true;
  if (!archive) {
    blockers.push("release_archive_missing");
  } else if (archive.signing?.mode !== "automatic" || !archive.signing?.teamId) {
    blockers.push("signed_release_archive_missing");
  } else if (!archiveDistribution?.readyForAppStoreConnect && !hasFreshReadyExport) {
    blockers.push("app_store_distribution_archive_missing");
  }
  if (archive && !archiveDistribution?.readyForAppStoreConnect) {
    blockers.push(...exportFreshness.blockers);
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
    authRelease: {
      wechatAppId: projectConfig.authConfig.wechatAppId ? "configured" : "missing",
      wechatUniversalLink: projectConfig.authConfig.wechatUniversalLink ?? null,
      wechatAssociatedDomain: projectConfig.authConfig.wechatAssociatedDomain ?? null,
      readyForCoreAuth: authRelease.readyForCoreAuth,
      readyForWechatRelease: authRelease.readyForWechatRelease,
      blockers: authRelease.blockers,
      warnings: authRelease.warnings,
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
            distribution: archiveDistribution,
          }
        : null,
      export: exportSummary
        ? {
            generatedAt: exportSummary.generatedAt ?? null,
            exportDir: exportSummary.exportDir ?? null,
            ipaPath: exportSummary.ipaPath ?? null,
            method: exportSummary.method ?? null,
            archivePath: exportSummary.archivePath ?? null,
            ipaExists,
            distributionSummaryExists,
            distribution: exportDistribution,
            freshness: exportFreshness,
          }
        : {
            ipaExists,
            distributionSummaryExists,
            distribution: exportDistribution,
            freshness: exportFreshness,
          },
    },
    blockers,
    warnings: authRelease.warnings,
    readyForTestFlightUpload: blockers.length === 0,
    nextManualSteps: [
      "在 Apple Developer / App Store Connect 中确认当前账号属于可发布 App 的 provider",
      "为 com.fanhao.benyuan.origin.shell 准备 Apple Distribution 证书与 App Store Connect provisioning profile",
      "用 BENYUAN_IOS_EXPORT_METHOD=app-store-connect npm run ios:shell:export 生成 TestFlight 可上传包",
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
