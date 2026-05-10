import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const primitives = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`, "utf8");
const collect = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift`, "utf8");
const theater = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift`, "utf8");
const constellation = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift`, "utf8");

assert.match(primitives, /struct BenyuanPressableMotionStyle/, "native UI must expose a shared press feedback style");
assert.match(primitives, /struct BenyuanSelectionPulseLayer/, "native UI must expose a selected-state pulse layer");
assert.match(primitives, /struct BenyuanMomentaryChoiceFeedback/, "native UI must expose theater choice feedback");
assert.match(primitives, /struct BenyuanAssetMutationMotion/, "native UI must expose upload asset add/remove motion");
assert.match(primitives, /sensoryFeedback|UIImpactFeedbackGenerator/, "native UI must include tactile feedback hooks for key taps");
assert.match(primitives, /accessibilityReduceMotion/, "interaction motion must respect reduce motion");

assert.match(collect, /BenyuanPressableMotionStyle/, "collect buttons must use shared press feedback");
assert.match(collect, /BenyuanSelectionPulseLayer/, "collect option buttons must show selected-state pulse");
assert.match(collect, /BenyuanAssetMutationMotion/, "upload thumbnails must animate asset additions/removals");
assert.match(collect, /animation\([^,\n]+,\s*value:\s*assets\.map/, "upload strip must animate when asset identity changes");

assert.match(theater, /BenyuanMomentaryChoiceFeedback/, "theater must show a brief feedback layer after a choice");
assert.match(theater, /selectedTheaterOptionId/, "theater feedback must be driven by real selected choice state");

assert.match(constellation, /BenyuanPressableMotionStyle/, "constellation bottom actions must use shared press feedback");
assert.match(constellation, /sensoryFeedback|UIImpactFeedbackGenerator/, "constellation actions must provide tactile feedback");

console.log("ios-interaction-motion-contract:ok");
