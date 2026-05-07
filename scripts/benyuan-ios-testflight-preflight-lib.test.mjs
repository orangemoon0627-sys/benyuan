import assert from "node:assert/strict";
import test from "node:test";

import { collectIosProjectConfig } from "./benyuan-ios-testflight-preflight-lib.mjs";

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
