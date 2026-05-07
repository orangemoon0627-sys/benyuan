import assert from "node:assert/strict";
import test from "node:test";

import {
  collectIosProjectConfig,
  collectTestFlightExportStatus,
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
          BenyuanShellStagingBaseURL: https://staging-benyuan.orangemoonai.cn
          BenyuanShellProductionBaseURL: https://benyuan.orangemoonai.cn
`);

  assert.deepEqual(config.shell, {
    displayName: null,
    marketingVersion: "0.2.0",
    buildNumber: "2",
    bundleId: "com.fanhao.benyuan.origin.shell",
  });
  assert.deepEqual(config.releaseConfig, {
    stagingBaseUrl: "https://staging-benyuan.orangemoonai.cn",
    productionBaseUrl: "https://benyuan.orangemoonai.cn",
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
