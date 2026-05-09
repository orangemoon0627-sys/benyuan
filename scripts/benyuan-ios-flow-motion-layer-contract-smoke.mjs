import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const primitives = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`, "utf8");
const rootView = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift`, "utf8");
const model = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift`, "utf8");
const collect = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift`, "utf8");
const processing = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift`, "utf8");
const theater = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift`, "utf8");
const constellation = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift`, "utf8");

assert.match(primitives, /struct BenyuanFlowTransitionLayer/, "native flow must expose a shared second-layer transition field");
assert.match(primitives, /struct BenyuanQuestionStepMotion/, "native flow must expose question step motion for Part1 progression");
assert.match(primitives, /struct BenyuanProcessingPhaseCurrent/, "native flow must expose a processing current layer");
assert.match(primitives, /struct BenyuanFlowOrbitTrail/, "native flow must expose a reusable orbit trail for theater/result continuity");
assert.match(primitives, /TimelineView\(\.animation\(minimumInterval:\s*1\.0\s*\/\s*30\.0\)/, "second-layer motion must be animation-driven at 30fps where visible");
assert.match(primitives, /accessibilityReduceMotion/, "second-layer motion must respect reduce motion");

assert.match(model, /var flowMotionProgress: Double/, "native model must expose stage-level flow progress");
assert.match(model, /@Published var questionMotionDirection/, "native model must track question direction for forward/back transitions");
assert.match(model, /@Published var questionMotionToken/, "native model must expose a transition token for repeated question motion");
assert.match(model, /recordQuestionMotion\(direction:/, "native model must centralize question motion bookkeeping");

assert.match(rootView, /BenyuanFlowTransitionLayer/, "root native flow must mount the shared second-layer transition field");
assert.match(rootView, /nativeModel\.flowMotionProgress/, "root flow layer must be driven by real native stage progress");
assert.match(rootView, /\.allowsHitTesting\(false\)/, "second-layer flow field must never intercept taps");

assert.match(collect, /BenyuanQuestionStepMotion/, "collect view must apply question step motion");
assert.match(collect, /questionMotionDirection/, "collect view must use forward/back direction in transitions");
assert.match(collect, /questionMotionToken/, "collect view must animate repeated question transitions");
assert.match(collect, /BenyuanFlowOrbitTrail/, "collect upload state must keep the same orbit language while assets change");

assert.match(processing, /BenyuanProcessingPhaseCurrent/, "processing view must include the second-layer current around generation progress");
assert.match(processing, /processingProgress/, "processing current must be driven by actual processing progress");

assert.match(theater, /BenyuanFlowOrbitTrail/, "theater view must use the shared orbit trail for act continuity");
assert.match(theater, /theaterProgress/, "theater orbit trail must be driven by theater progress");

assert.match(constellation, /BenyuanFlowOrbitTrail/, "constellation result must preserve the same flow-motion layer");
assert.match(constellation, /leadingConstellationProgress/, "constellation orbit trail must be driven by real constellation dimensions");

console.log("ios-flow-motion-layer-contract:ok");
