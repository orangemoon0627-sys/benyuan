import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  canonicalizeIosArtifactPath,
  resolveIosArtifactPath,
} from "./benyuan-ios-artifact-provenance.mjs";

import {
  evaluateIosAuthReleaseReadiness,
  collectIosProjectConfig,
  collectTestFlightExportStatus,
  evaluateIosReleaseArtifactSet,
  evaluateRequestedIosArchive,
  evaluateTestFlightExportFreshness,
  resolveTestFlightDistributionSummaryPath,
} from "./benyuan-ios-testflight-preflight-lib.mjs";

const matchingProvenance = {
  schemaVersion: 1,
  gitRevision: "0123456789abcdef",
  gitDirty: false,
  sourceHash: "source-hash",
};

function releaseArtifact(generatedAt) {
  return { generatedAt, provenance: matchingProvenance };
}

test("evaluateIosReleaseArtifactSet accepts current clean artifacts in release order", () => {
  const result = evaluateIosReleaseArtifactSet({
    now: "2026-07-10T12:00:00.000Z",
    currentProvenance: matchingProvenance,
    shellBuild: releaseArtifact("2026-07-10T08:00:00.000Z"),
    nativeSmoke: releaseArtifact("2026-07-10T08:30:00.000Z"),
    archive: releaseArtifact("2026-07-10T09:00:00.000Z"),
    exportSummary: releaseArtifact("2026-07-10T09:15:00.000Z"),
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});

test("evaluateIosReleaseArtifactSet rejects stale artifacts and source mismatches", () => {
  const old = {
    generatedAt: "2026-05-20T09:00:00.000Z",
    provenance: { ...matchingProvenance, sourceHash: "old-source" },
  };
  const result = evaluateIosReleaseArtifactSet({
    now: "2026-07-10T12:00:00.000Z",
    currentProvenance: matchingProvenance,
    shellBuild: old,
    nativeSmoke: old,
    archive: old,
    exportSummary: old,
  });

  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("shell_build_stale"));
  assert.ok(result.blockers.includes("native_smoke_source_mismatch"));
  assert.ok(result.blockers.includes("release_archive_stale"));
  assert.ok(result.blockers.includes("app_store_connect_export_source_mismatch"));
});

test("evaluateIosReleaseArtifactSet rejects dirty source and legacy artifacts without provenance", () => {
  const result = evaluateIosReleaseArtifactSet({
    now: "2026-07-10T12:00:00.000Z",
    currentProvenance: { ...matchingProvenance, gitDirty: true },
    shellBuild: { generatedAt: "2026-07-10T08:00:00.000Z" },
    nativeSmoke: { generatedAt: "2026-07-10T08:30:00.000Z" },
    archive: { generatedAt: "2026-07-10T09:00:00.000Z" },
    exportSummary: { generatedAt: "2026-07-10T09:15:00.000Z" },
  });

  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("ios_source_tree_dirty"));
  assert.ok(result.blockers.includes("shell_build_provenance_missing"));
  assert.ok(result.blockers.includes("app_store_connect_export_provenance_missing"));
});

test("TestFlight upload script runs preflight before exportArchive", () => {
  const uploadScript = readFileSync(new URL("./benyuan-ios-shell-upload.mjs", import.meta.url), "utf8");
  const preflightIndex = uploadScript.indexOf("benyuan-ios-testflight-preflight.mjs");
  const exportIndex = uploadScript.indexOf('"-exportArchive"');
  assert.ok(preflightIndex >= 0, "upload script must invoke TestFlight preflight");
  assert.ok(exportIndex > preflightIndex, "preflight must run before the upload export begins");
  assert.match(uploadScript, /BENYUAN_IOS_ARCHIVE_PATH:\s*archivePath/, "upload must pass its actual archive path into preflight");
});

test("iOS artifact paths are rooted consistently and canonicalize symlink aliases", async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "benyuan-ios-paths-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const realArchive = path.join(temporaryRoot, "real", "BenyuanOriginShell.xcarchive");
  const linkedArchive = path.join(temporaryRoot, "linked.xcarchive");
  await mkdir(realArchive, { recursive: true });
  await symlink(realArchive, linkedArchive);

  assert.equal(
    resolveIosArtifactPath(temporaryRoot, "relative/BenyuanOriginShell.xcarchive"),
    path.join(temporaryRoot, "relative", "BenyuanOriginShell.xcarchive"),
  );
  assert.equal(
    await canonicalizeIosArtifactPath(temporaryRoot, linkedArchive),
    await canonicalizeIosArtifactPath(temporaryRoot, realArchive),
  );
});

test("archive, export, upload, and preflight scripts use shared path normalization", () => {
  const archiveScript = readFileSync(new URL("./benyuan-ios-shell-archive.mjs", import.meta.url), "utf8");
  const exportScript = readFileSync(new URL("./benyuan-ios-shell-export.mjs", import.meta.url), "utf8");
  const uploadScript = readFileSync(new URL("./benyuan-ios-shell-upload.mjs", import.meta.url), "utf8");
  const preflightScript = readFileSync(new URL("./benyuan-ios-testflight-preflight.mjs", import.meta.url), "utf8");

  assert.match(archiveScript, /resolveIosArtifactPath\(/);
  assert.match(exportScript, /canonicalizeIosArtifactPath\(/);
  assert.match(uploadScript, /canonicalizeIosArtifactPath\(/);
  assert.match(preflightScript, /normalizeRecordedPath\(/);
});

test("TestFlight distribution summary follows the recorded custom export directory", () => {
  const defaultPath = "/repo/output/testflight-export/DistributionSummary.plist";
  assert.equal(
    resolveTestFlightDistributionSummaryPath(defaultPath, { exportDir: "/tmp/custom-export" }),
    "/tmp/custom-export/DistributionSummary.plist",
  );
  assert.equal(resolveTestFlightDistributionSummaryPath(defaultPath, null), defaultPath);
});

test("evaluateRequestedIosArchive binds upload to the recorded archive path and executable", () => {
  const identity = {
    archiveSha256: "archive-package-hash",
    archiveEntryCount: 12,
    archiveByteSize: 4096,
    executableSha256: "archive-binary-hash",
    executableSize: 1024,
  };
  const result = evaluateRequestedIosArchive({
    archive: {
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
      archiveIdentity: identity,
    },
    requestedArchivePath: "/tmp/BenyuanOriginShell.xcarchive",
    requestedIdentity: identity,
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});

test("evaluateRequestedIosArchive rejects a different or replaced archive", () => {
  const result = evaluateRequestedIosArchive({
    archive: {
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
      archiveIdentity: {
        archiveSha256: "recorded-package-hash",
        archiveEntryCount: 12,
        archiveByteSize: 4096,
        executableSha256: "recorded-hash",
        executableSize: 1024,
      },
    },
    requestedArchivePath: "/tmp/Old.xcarchive",
    requestedIdentity: {
      archiveSha256: "different-package-hash",
      archiveEntryCount: 10,
      archiveByteSize: 2048,
      executableSha256: "different-hash",
      executableSize: 512,
    },
  });

  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("upload_archive_path_mismatch"));
  assert.ok(result.blockers.includes("upload_archive_binary_mismatch"));
});

test("evaluateRequestedIosArchive reports a missing recorded identity without a false mismatch", () => {
  const result = evaluateRequestedIosArchive({
    archive: {
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
    },
    requestedArchivePath: "/tmp/BenyuanOriginShell.xcarchive",
    requestedIdentity: {
      archiveSha256: "current-package-hash",
      archiveEntryCount: 12,
      archiveByteSize: 4096,
      executableSha256: "current-hash",
      executableSize: 1024,
    },
  });

  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("release_archive_identity_missing"));
  assert.equal(result.blockers.includes("upload_archive_binary_mismatch"), false);
});

test("collectIosProjectConfig reads direct XcodeGen shell base URL settings", () => {
  const config = collectIosProjectConfig(`
name: BenyuanOriginShell
settings:
  base:
    PRODUCT_BUNDLE_IDENTIFIER: com.fanhao.benyuan.origin.shell
    MARKETING_VERSION: 0.2.0
    CURRENT_PROJECT_VERSION: 2
targets:
  BenyuanOriginShell:
    settings:
      configs:
        Staging:
          BenyuanShellEnvironment: staging
          BenyuanShellStagingBaseURL: https://staging-benyuan.orangemoonai.cn
          BenyuanShellProductionBaseURL: https://benyuan.orangemoonai.cn
        Release:
          BenyuanShellEnvironment: production
          BenyuanShellStagingBaseURL: http://120.26.126.88
          BenyuanShellProductionBaseURL: https://staging-benyuan.orangemoonai.cn
          BENYUAN_WECHAT_APP_ID: wx1234567890abcdef
          BENYUAN_WECHAT_UNIVERSAL_LINK: https://app.orangemoonai.cn/app/benyuan/
          BENYUAN_WECHAT_ASSOCIATED_DOMAIN: applinks:app.orangemoonai.cn
`);

  assert.deepEqual(config.shell, {
    displayName: null,
    marketingVersion: "0.2.0",
    buildNumber: "2",
    bundleId: "com.fanhao.benyuan.origin.shell",
  });
  assert.deepEqual(config.releaseConfig, {
    stagingBaseUrl: "http://120.26.126.88",
    productionBaseUrl: "https://staging-benyuan.orangemoonai.cn",
  });
  assert.deepEqual(config.authConfig, {
    wechatAppId: "wx1234567890abcdef",
    wechatUniversalLink: "https://app.orangemoonai.cn/app/benyuan/",
    wechatAssociatedDomain: "applinks:app.orangemoonai.cn",
  });
});

test("collectIosProjectConfig keeps compatibility with INFOPLIST_KEY shell URL settings", () => {
  const config = collectIosProjectConfig(`
settings:
  base:
    INFOPLIST_KEY_CFBundleDisplayName: 本源
    PRODUCT_BUNDLE_IDENTIFIER: com.fanhao.benyuan.origin.shell
    MARKETING_VERSION: 0.2.0
    CURRENT_PROJECT_VERSION: 2
targets:
  BenyuanOriginShell:
    settings:
      configs:
        Staging:
          INFOPLIST_KEY_BenyuanShellStagingBaseURL: https://staging-benyuan.orangemoonai.cn
        Release:
          INFOPLIST_KEY_BenyuanShellProductionBaseURL: https://benyuan.orangemoonai.cn
`);

  assert.deepEqual(config.shell, {
    displayName: "本源",
    marketingVersion: "0.2.0",
    buildNumber: "2",
    bundleId: "com.fanhao.benyuan.origin.shell",
  });
  assert.deepEqual(config.releaseConfig, {
    stagingBaseUrl: "https://staging-benyuan.orangemoonai.cn",
    productionBaseUrl: "https://benyuan.orangemoonai.cn",
  });
});

test("evaluateIosAuthReleaseReadiness separates core blockers from WeChat release warnings", () => {
  const readiness = evaluateIosAuthReleaseReadiness({
    releaseConfig: {
      productionBaseUrl: "https://staging-benyuan.orangemoonai.cn",
      stagingBaseUrl: "https://benyuan.orangemoonai.cn",
    },
    authConfig: {
      wechatAppId: "",
      wechatUniversalLink: "",
      wechatAssociatedDomain: "applinks:",
    },
    entitlementsText: `
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>
<key>com.apple.developer.associated-domains</key>
<array><string>$(BENYUAN_WECHAT_ASSOCIATED_DOMAIN)</string></array>
`,
    authRunbookPresent: true,
    authSmokeScriptsPresent: {
      contract: true,
      runtime: true,
      smsAliyun: true,
    },
  });

  assert.equal(readiness.readyForCoreAuth, true);
  assert.equal(readiness.readyForWechatRelease, false);
  assert.deepEqual(readiness.blockers, []);
  assert.deepEqual(readiness.warnings, [
    "wechat_app_id_missing",
    "wechat_universal_link_missing",
    "wechat_associated_domain_missing",
  ]);
});

test("evaluateIosAuthReleaseReadiness marks full auth release ready when native and runbook guards exist", () => {
  const readiness = evaluateIosAuthReleaseReadiness({
    releaseConfig: {
      productionBaseUrl: "https://staging-benyuan.orangemoonai.cn",
      stagingBaseUrl: "https://benyuan.orangemoonai.cn",
    },
    authConfig: {
      wechatAppId: "wx1234567890abcdef",
      wechatUniversalLink: "https://app.orangemoonai.cn/app/benyuan/",
      wechatAssociatedDomain: "applinks:app.orangemoonai.cn",
    },
    entitlementsText: `
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>
<key>com.apple.developer.associated-domains</key>
<array><string>$(BENYUAN_WECHAT_ASSOCIATED_DOMAIN)</string></array>
`,
    authRunbookPresent: true,
    authSmokeScriptsPresent: {
      contract: true,
      runtime: true,
      smsAliyun: true,
    },
  });

  assert.equal(readiness.readyForCoreAuth, true);
  assert.equal(readiness.readyForWechatRelease, true);
  assert.deepEqual(readiness.blockers, []);
  assert.deepEqual(readiness.warnings, []);
});

test("evaluateIosAuthReleaseReadiness blocks TestFlight builds without a real network fallback", () => {
  const readiness = evaluateIosAuthReleaseReadiness({
    releaseConfig: {
      productionBaseUrl: "https://staging-benyuan.orangemoonai.cn",
      stagingBaseUrl: "https://staging-benyuan.orangemoonai.cn",
    },
    authConfig: {
      wechatAppId: "wx1234567890abcdef",
      wechatUniversalLink: "https://app.orangemoonai.cn/app/benyuan/",
      wechatAssociatedDomain: "applinks:app.orangemoonai.cn",
    },
    entitlementsText: `
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>
<key>com.apple.developer.associated-domains</key>
<array><string>$(BENYUAN_WECHAT_ASSOCIATED_DOMAIN)</string></array>
`,
    authRunbookPresent: true,
    authSmokeScriptsPresent: {
      contract: true,
      runtime: true,
      smsAliyun: true,
    },
  });

  assert.equal(readiness.readyForCoreAuth, false);
  assert.deepEqual(readiness.blockers, ["release_network_fallback_matches_primary"]);
});

test("evaluateIosAuthReleaseReadiness blocks insecure release endpoints", () => {
  const readiness = evaluateIosAuthReleaseReadiness({
    releaseConfig: {
      productionBaseUrl: "https://staging-benyuan.orangemoonai.cn",
      stagingBaseUrl: "http://120.26.126.88",
    },
    authConfig: {
      wechatAppId: "wx1234567890abcdef",
      wechatUniversalLink: "https://app.orangemoonai.cn/app/benyuan/",
      wechatAssociatedDomain: "applinks:app.orangemoonai.cn",
    },
    entitlementsText: `
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>
<key>com.apple.developer.associated-domains</key>
<array><string>$(BENYUAN_WECHAT_ASSOCIATED_DOMAIN)</string></array>
`,
    authRunbookPresent: true,
    authSmokeScriptsPresent: {
      contract: true,
      runtime: true,
      smsAliyun: true,
    },
  });

  assert.equal(readiness.readyForCoreAuth, false);
  assert.ok(readiness.blockers.includes("release_network_fallback_not_https"));
});

test("collectTestFlightExportStatus accepts Cloud Managed Apple Distribution exports", () => {
  const status = collectTestFlightExportStatus(
    {
      "BenyuanOriginShell.ipa": [
        {
          certificate: {
            SHA1: "2948BD146774A8187BBF02719E451A9188F6C815",
            type: "Cloud Managed Apple Distribution",
          },
          entitlements: {
            "application-identifier": "CY3DD3J5CU.com.fanhao.benyuan.origin.shell",
            "beta-reports-active": true,
            "com.apple.developer.team-identifier": "CY3DD3J5CU",
            "get-task-allow": false,
          },
          profile: {
            name: "iOS Team Store Provisioning Profile: com.fanhao.benyuan.origin.shell",
            UUID: "80ddd1ca-155c-48cd-be33-eb627c14a9a2",
          },
          team: {
            id: "CY3DD3J5CU",
          },
        },
      ],
    },
    { ipaPath: "/tmp/BenyuanOriginShell.ipa", method: "app-store-connect" },
  );

  assert.deepEqual(status, {
    ipaPath: "/tmp/BenyuanOriginShell.ipa",
    method: "app-store-connect",
    certificateType: "Cloud Managed Apple Distribution",
    certificateSha1: "2948BD146774A8187BBF02719E451A9188F6C815",
    profileName: "iOS Team Store Provisioning Profile: com.fanhao.benyuan.origin.shell",
    profileUuid: "80ddd1ca-155c-48cd-be33-eb627c14a9a2",
    teamId: "CY3DD3J5CU",
    betaReportsActive: true,
    getTaskAllow: false,
    isDistributionCertificate: true,
    isAppStoreProfile: true,
    readyForAppStoreConnect: true,
  });
});

test("evaluateTestFlightExportFreshness accepts a fresh App Store Connect export for the current archive", () => {
  const readiness = evaluateTestFlightExportFreshness({
    archive: {
      generatedAt: "2026-05-11T04:28:13.586Z",
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
    },
    exportSummary: {
      generatedAt: "2026-05-11T04:30:00.000Z",
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
      method: "app-store-connect",
      ipaPath: "/tmp/testflight-export/BenyuanOriginShell.ipa",
    },
    exportDistribution: {
      readyForAppStoreConnect: true,
    },
    distributionSummaryExists: true,
    ipaExists: true,
  });

  assert.equal(readiness.readyForAppStoreConnect, true);
  assert.deepEqual(readiness.blockers, []);
});

test("evaluateTestFlightExportFreshness rejects stale exports older than the current archive", () => {
  const readiness = evaluateTestFlightExportFreshness({
    archive: {
      generatedAt: "2026-05-11T04:28:13.586Z",
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
    },
    exportSummary: {
      generatedAt: "2026-05-08T10:00:00.000Z",
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
      method: "app-store-connect",
      ipaPath: "/tmp/testflight-export/BenyuanOriginShell.ipa",
    },
    exportDistribution: {
      readyForAppStoreConnect: true,
    },
    distributionSummaryExists: true,
    ipaExists: true,
  });

  assert.equal(readiness.readyForAppStoreConnect, false);
  assert.deepEqual(readiness.blockers, ["app_store_connect_export_stale"]);
});

test("evaluateTestFlightExportFreshness rejects exports from a different archive path", () => {
  const readiness = evaluateTestFlightExportFreshness({
    archive: {
      generatedAt: "2026-05-11T04:28:13.586Z",
      archivePath: "/tmp/BenyuanOriginShell.xcarchive",
    },
    exportSummary: {
      generatedAt: "2026-05-11T04:30:00.000Z",
      archivePath: "/tmp/Other.xcarchive",
      method: "app-store-connect",
      ipaPath: "/tmp/testflight-export/BenyuanOriginShell.ipa",
    },
    exportDistribution: {
      readyForAppStoreConnect: true,
    },
    distributionSummaryExists: true,
    ipaExists: true,
  });

  assert.equal(readiness.readyForAppStoreConnect, false);
  assert.deepEqual(readiness.blockers, ["app_store_connect_export_archive_mismatch"]);
});
