import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(`${root}/package.json`, "utf8"));
const script = readFileSync(`${root}/scripts/benyuan-ios-native-preview-screenshots.mjs`, "utf8");
const shellConfig = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift`, "utf8");
const rootView = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift`, "utf8");
const fixtures = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativePreviewFixtures.swift`, "utf8");
const flowModel = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift`, "utf8");

for (const stage of ["auth", "account", "collect", "upload", "processing", "theater", "constellation", "constellation-end"]) {
  assert.match(script, new RegExp(`stage:\\s*['"]${stage}['"]`), `native preview screenshot script must include ${stage}`);
  assert.match(script, new RegExp(`benyuan-ios-preview-${stage}\\.png`), `native preview screenshot script must write ${stage} screenshot`);
}

assert.match(script, /debugPreviewDir/, "native preview screenshots must create cache-safe presentation copies");
assert.match(script, /presentationScreenshotPath/, "native preview summary must expose a unique presentation screenshot path");
assert.match(script, /stableScreenshotPath/, "native preview summary must keep the stable overwrite screenshot path");
assert.match(script, /previewRunStamp/, "native preview screenshot names must include a per-run timestamp");
assert.match(script, /copyFile\(config\.screenshotPath,\s*presentationScreenshotPath\)/, "native preview must copy stable screenshots to unique presentation paths");
assert.match(script, /git",\s*\["rev-parse",\s*"--short",\s*"HEAD"\]/, "native preview screenshots must derive a git short revision for screenshot provenance");
assert.match(script, /git",\s*\["status",\s*"--short"\]/, "native preview screenshots must mark dirty worktrees in the visible revision");
assert.match(script, /\$\{revision\}-dirty/, "native preview screenshots must make uncommitted preview provenance explicit");
assert.match(script, /--benyuan-native-preview-stamp/, "native preview screenshots must pass a visible run stamp into the app");
assert.match(script, /--benyuan-native-preview-revision/, "native preview screenshots must pass a visible git revision into the app");
assert.match(script, /BENYUAN_IOS_NATIVE_PREVIEW_WATERMARK/, "native preview screenshots must allow opt-in visible watermark provenance");
assert.match(script, /BENYUAN_IOS_NATIVE_PREVIEW_CLEAN_CHROME/, "native preview screenshots must allow presentation screenshots to suppress transient chrome");
assert.match(script, /--benyuan-native-preview-no-watermark/, "native preview screenshots must default to clean presentation captures without the debug watermark");
assert.match(script, /--benyuan-native-preview-clean/, "native preview screenshots must suppress transient toast chrome during presentation captures");
assert.match(script, /previewRunStamp,\s*\n\s*previewGitRevision,/, "native preview summary must include provenance stamp and git revision");
assert.match(script, /showsPreviewWatermark,\s*\n\s*suppressesTransientChrome,/, "native preview summary must record capture chrome flags");
assert.match(script, /archetypePreviewConfigs/, "native preview screenshots must include a dedicated archetype matrix");
for (const variant of [
  "moonlit-seeker",
  "star-map-architect",
  "moon-harbor-keeper",
  "existential-nomad",
  "rain-window-scribe",
  "event-horizon-diver",
  "nebula-weaver",
  "solar-corona",
  "terrestrial-planet",
  "deep-space-anchor",
]) {
  assert.match(script, new RegExp(`variant:\\s*['"]${variant}['"]`), `native preview screenshots must include ${variant} archetype variant`);
  assert.match(script, new RegExp(`benyuan-ios-preview-archetype-${variant}\\.png`), `native preview screenshots must write ${variant} archetype screenshot`);
}
assert.doesNotMatch(script, /gas-giant/, "native preview screenshots must not include the removed gas-giant variant");
assert.match(script, /--benyuan-native-preview-archetype/, "native preview screenshots must pass archetype variants into the app");
assert.match(script, /archetypeRuns/, "native preview summary must include archetype preview runs");

assert.match(script, /for \(const config of previewConfigs\)/, "native preview screenshots must run stages sequentially");
assert.match(script, /stage:\s*"home"[\s\S]*?waitMs:\s*7200[\s\S]*?minMeanLuma:\s*10/, "native home preview must wait for first-screen reveal and reject black-frame captures");
assert.match(script, /stage:\s*"auth"[\s\S]*?waitMs:\s*7200[\s\S]*?minMeanLuma:\s*10/, "native auth preview must wait for first-screen reveal and reject black-frame captures");
assert.match(script, /import sharp from "sharp"/, "native preview screenshots must inspect screenshot pixels before accepting presentation captures");
assert.match(script, /async function imageMeanLuma/, "native preview screenshots must expose a luma helper for black-frame detection");
assert.match(script, /ios_native_preview_underexposed/, "native preview screenshots must fail loudly if a first-screen capture is underexposed");
assert.doesNotMatch(script, /Promise\.all/, "native preview screenshots must not run simulator launches concurrently");
assert.match(script, /terminateApp\(device\.udid,\s*bundleId\)/, "native preview screenshots must terminate the app between stages");
assert.match(script, /--benyuan-native-preview/, "native preview screenshots must launch the real SwiftUI native preview route");

assert.match(shellConfig, /static var nativePreviewStamp:\s*String\?/, "shell config must expose native preview stamp only for debug previews");
assert.match(shellConfig, /static var nativePreviewRevision:\s*String\?/, "shell config must expose native preview git revision only for debug previews");
assert.match(shellConfig, /static var nativePreviewArchetypeVariant:\s*String\?/, "shell config must expose native preview archetype variants only for debug previews");
assert.match(shellConfig, /static var nativePreviewShowsWatermark:\s*Bool/, "shell config must expose an opt-in native preview watermark flag");
assert.match(shellConfig, /static var nativePreviewSuppressesTransientChrome:\s*Bool/, "shell config must expose a clean presentation chrome flag");
assert.match(rootView, /nativePreviewShowsWatermark/, "native root must only render preview watermark when explicitly allowed");
assert.match(rootView, /nativePreviewWatermark\(stage:/, "native root must still support a preview watermark when launched through native preview");
assert.match(rootView, /Text\("NATIVE PREVIEW"\)/, "native preview watermark must be visibly identifiable in screenshots");
assert.match(rootView, /BenyuanShellConfig\.nativePreviewRevision/, "native preview watermark must include git revision");
assert.match(rootView, /BenyuanShellConfig\.nativePreviewStamp/, "native preview watermark must include run stamp");
assert.match(rootView, /BenyuanShellConfig\.nativePreviewArchetypeVariant/, "native preview watermark must include the archetype variant when present");
assert.match(rootView, /nativePreviewSuppressesTransientChrome/, "native root must hide transient toast chrome for clean presentation captures");
assert.match(fixtures, /static func previewConstellation\(archetypeVariant:\s*String\?\)/, "native preview fixtures must be able to render constellation variants");
assert.match(fixtures, /static func previewArchetype\(variant:\s*String\?\)/, "native preview fixtures must define archetype-specific fixtures");
for (const expected of [
  "远潮观月者",
  "星图筑序者",
  "月港栖岸者",
  "存在游牧者",
  "雨窗抒写者",
  "事件视界沉潜者",
  "星云织梦者",
  "日冕引燃者",
  "类地栖居者",
  "深空锚定者",
]) {
  assert.match(fixtures, new RegExp(expected), `native preview fixtures must include ${expected}`);
}
for (const removed of ["事件视界潜行者", "日冕燃心者", "气态巨行星", "深月观测者"]) {
  assert.doesNotMatch(fixtures, new RegExp(removed), `native preview fixtures must not include removed temporary label ${removed}`);
}
assert.match(flowModel, /previewConstellation\(archetypeVariant:\s*BenyuanShellConfig\.nativePreviewArchetypeVariant\)/, "native preview flow must apply the requested archetype variant only in debug preview");

assert.equal(
  packageJson.scripts["ios:shell:native-preview"],
  "node scripts/benyuan-ios-native-preview-screenshots.mjs",
  "package.json must expose a native preview screenshot command"
);

console.log("ios-native-preview-contract:ok");
