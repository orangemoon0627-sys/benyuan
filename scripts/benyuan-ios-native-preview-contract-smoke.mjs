import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));
const script = readFileSync(`${root}/scripts/benyuan-ios-native-preview-screenshots.mjs`, "utf8");

for (const stage of ["auth", "account", "collect", "upload", "processing", "theater", "constellation", "constellation-end"]) {
  assert.match(script, new RegExp(`stage:\\s*['"]${stage}['"]`), `native preview screenshot script must include ${stage}`);
  assert.match(script, new RegExp(`benyuan-ios-preview-${stage}\\.png`), `native preview screenshot script must write ${stage} screenshot`);
}

assert.match(script, /debugPreviewDir/, "native preview screenshots must create cache-safe presentation copies");
assert.match(script, /presentationScreenshotPath/, "native preview summary must expose a unique presentation screenshot path");
assert.match(script, /stableScreenshotPath/, "native preview summary must keep the stable overwrite screenshot path");
assert.match(script, /previewRunStamp/, "native preview screenshot names must include a per-run timestamp");
assert.match(script, /copyFile\(config\.screenshotPath,\s*presentationScreenshotPath\)/, "native preview must copy stable screenshots to unique presentation paths");

assert.match(script, /for \(const config of previewConfigs\)/, "native preview screenshots must run stages sequentially");
assert.match(script, /stage:\s*"auth"[\s\S]*?waitMs:\s*3600/, "native auth preview must wait long enough to avoid capturing the launch blur transition");
assert.doesNotMatch(script, /Promise\.all/, "native preview screenshots must not run simulator launches concurrently");
assert.match(script, /terminateApp\(device\.udid,\s*bundleId\)/, "native preview screenshots must terminate the app between stages");
assert.match(script, /--benyuan-native-preview/, "native preview screenshots must launch the real SwiftUI native preview route");

assert.equal(
  packageJson.scripts["ios:shell:native-preview"],
  "node scripts/benyuan-ios-native-preview-screenshots.mjs",
  "package.json must expose a native preview screenshot command"
);

console.log("ios-native-preview-contract:ok");
