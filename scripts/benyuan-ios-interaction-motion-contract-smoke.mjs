import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const primitives = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`, "utf8");
const collect = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift`, "utf8");
const collectActions = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectActions.swift`, "utf8");
const flowModel = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift`, "utf8");
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
assert.match(primitives, /private let selectionDotDiameter:\s*CGFloat = 18/, "collect nova burst must be calibrated to the right-side selection dot");
assert.match(primitives, /let gravity = eased \* eased \* \(44 \+ CGFloat\(index % 5\) \* 8\)/, "collect nova burst must use a gravity-style falling arc");
assert.match(primitives, /Image\(systemName:\s*"sparkle"\)/, "collect nova burst must include star-fragment sparkle particles");
assert.match(collect, /BenyuanAssetMutationMotion/, "upload thumbnails must animate asset additions/removals");
assert.match(collect, /animation\([^,\n]+,\s*value:\s*assets\.map/, "upload strip must animate when asset identity changes");
assert.match(flowModel, /@Published var collectValidationPulse = 0/, "collect flow must expose validation pulse state for mis-taps");
assert.match(flowModel, /var currentQuestionIsAnswered: Bool/, "collect flow must expose current-question completion state");
assert.match(collectActions, /guard isAnswered\(question\) else \{[\s\S]*?pulseCollectValidation\(collectRequirementHint\(for:\s*question\)\)/, "collect next navigation must not silently skip an incomplete current question");
assert.match(collectActions, /func continueCollectOrSubmit\(\) async[\s\S]*?guard isAnswered\(question\) else/, "collect primary CTA must validate the current question before advancing");
assert.match(collectActions, /func collectRequirementHint\(for question:\s*BenyuanQuestion\) -> String/, "collect flow must provide question-specific completion hints");
assert.match(collect, /collectCompletionHint\(question\)/, "collect view must render a visible completion or requirement hint after the question body");
assert.match(collect, /struct BenyuanCollectValidationPulse/, "collect view must expose a momentary validation pulse for incomplete taps");
assert.match(collect, /primaryCollectTitle/, "collect primary CTA title must be derived from current completion state");
for (const title of ["完成当前线索", "继续收集", "进入剧场生成"]) {
  assert.match(collect, new RegExp(title), `collect primary CTA title must include ${title}`);
}
assert.match(collect, /Task \{ await model\.continueCollectOrSubmit\(\) \}/, "collect primary CTA must use centralized validated continuation logic");

assert.match(theater, /BenyuanMomentaryChoiceFeedback/, "theater must show a brief feedback layer after a choice");
assert.match(theater, /selectedTheaterOptionId/, "theater feedback must be driven by real selected choice state");

assert.match(constellation, /BenyuanPressableMotionStyle/, "constellation bottom actions must use shared press feedback");
assert.match(constellation, /sensoryFeedback|UIImpactFeedbackGenerator/, "constellation actions must provide tactile feedback");

console.log("ios-interaction-motion-contract:ok");
