import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateIosAuthReleaseReadiness,
  collectIosProjectConfig,
  collectTestFlightExportStatus,
  evaluateTestFlightExportFreshness,
} from "./benyuan-ios-testflight-preflight-lib.mjs";

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
      stagingBaseUrl: "http://120.26.126.88",
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
