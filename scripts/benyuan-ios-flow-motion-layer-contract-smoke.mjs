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
assert.match(primitives, /BenyuanStarTransitModifier/, "native question transitions must use a logical star-transit layer instead of a hard cut");
assert.match(primitives, /struct BenyuanQuestionStepMotion[\s\S]*?BenyuanStarTransitModifier/, "question step motion must include star transit through the view during page changes");
assert.match(primitives, /struct BenyuanNovaSelectionBurst[\s\S]*?duration = accessibilityReduceMotion \? 0\.01 : 0\.86/, "option selection burst should linger long enough to feel like falling game particles");
assert.match(primitives, /try\? await Task\.sleep\(nanoseconds:\s*UInt64\(accessibilityReduceMotion \? 40_000_000 : 920_000_000\)\)/, "option selection burst lifetime should cover the full falling-star animation");
assert.match(primitives, /struct BenyuanClueOrbitField/, "collect flow must have a reusable clue-orbit field identity");
assert.match(primitives, /struct BenyuanQuestionSignalField[\s\S]*?BenyuanClueOrbitField/, "question signal field must use the clue-orbit identity instead of a generic module ornament");
assert.match(collect, /BenyuanUploadCelestialPortal/, "collect upload state must use a dedicated celestial portal while assets change");
assert.match(primitives, /struct BenyuanUploadCelestialPortal[\s\S]*?BenyuanClueOrbitField/, "upload portal must use the clue-orbit identity inside its art panel");
assert.match(primitives, /struct BenyuanUploadCelestialPortal[\s\S]*?ForEach\(0\.\.<3[\s\S]*?Ellipse\(\)[\s\S]*?ForEach\(0\.\.<11/, "upload portal must keep closed orbit and particle language while assets change");
assert.doesNotMatch(primitives, /position\(x:\s*width \* 0\.34,\s*y:\s*height \* 0\.72\)/, "upload portal progress rail must not sit behind the upload title text");
assert.doesNotMatch(primitives, /struct BenyuanUploadCelestialPortal[\s\S]*?Capsule\(\)[\s\S]*?\.frame\(width:\s*max/, "upload portal must not use a horizontal progress capsule that can read as a title underline");
assert.match(collect, /VStack\(alignment:\s*\.leading,\s*spacing:\s*BenyuanSpacing\.x2\)[\s\S]*?BenyuanUploadCelestialPortal[\s\S]*?\.frame\(height:\s*132\)[\s\S]*?BenyuanUploadStatusPanel/, "upload portal art and copy must be compact sibling panels, not nested overlays");
assert.match(collect, /struct BenyuanUploadArtPanel[\s\S]*?BenyuanUploadCelestialPortal[\s\S]*?Image\(systemName:\s*canAddMore \? "chevron\.right" : "checkmark"\)/, "upload art panel must keep its own visual action affordance without containing copy");
assert.match(collect, /struct BenyuanUploadStatusPanel/, "upload copy must live in a separate status panel");
assert.doesNotMatch(collect, /LinearGradient\([\s\S]*?BenyuanUploadCelestialPortal[\s\S]*?VStack\(alignment:\s*\.leading,\s*spacing:\s*6\)/, "upload copy must not be overlaid inside the celestial art panel");
assert.match(primitives, /let center = CGPoint\(x:\s*width \* 0\.50,\s*y:\s*height \* 0\.50\)/, "standalone upload portal art must center the celestial body inside its own panel");
assert.match(primitives, /let bodySize = min\(width,\s*height\) \* 0\.42/, "standalone upload portal art should be large enough in its own panel");
assert.doesNotMatch(primitives, /struct BenyuanUploadCelestialPortal[\s\S]*?Circle\(\)\s*[\r\n\s]*\.trim/, "upload portal must not use trimmed circular arcs; orbit rings must be complete closed paths");
assert.match(primitives, /BenyuanUploadCompleteProgressOrbit/, "upload portal must render progress as a complete closed orbit ring");

assert.match(processing, /BenyuanProcessingPhaseCurrent/, "processing view must include the second-layer current around generation progress");
assert.match(processing, /processingProgress/, "processing current must be driven by actual processing progress");
assert.match(processing, /generationPhaseRail/, "processing view must expose a visible cloud-stage rail during long generation waits");
for (const phase of ["接收线索", "多模态读取", "剧场折射", "星图显影"]) {
  assert.match(processing, new RegExp(phase), `processing cloud-stage rail must include ${phase}`);
}
assert.match(processing, /processingPhaseHint/, "processing view must derive a human-readable waiting hint from current progress");
assert.match(processing, /phaseState\(_ phase:\s*GenerationPhase\)/, "processing phase rail must derive active/done states from displayed progress");

assert.match(theater, /BenyuanFlowOrbitTrail/, "theater view must use the shared orbit trail for act continuity");
assert.match(theater, /theaterProgress/, "theater orbit trail must be driven by theater progress");
assert.match(theater, /theaterStageRail/, "theater view must expose a visible act rail for continuous story progress");
assert.match(theater, /theaterLensCard/, "theater scenes must render inside a single-shot lens card instead of loose disconnected text");
assert.match(theater, /BenyuanTheaterScenePortal/, "theater scene lens must use a dedicated celestial portal");
assert.match(theater, /theaterEchoPanel/, "theater scene must keep response/theme copy in a separate echo panel");
for (const label of ["入场", "分岔", "镜面", "星图"]) {
  assert.match(theater, new RegExp(label), `theater act rail must include ${label}`);
}
assert.match(theater, /selectedTheaterResponse/, "act2 selection should surface the selected option response as immediate story feedback");
assert.match(theater, /selectedMirrorResponse/, "act3 selection should surface immediate mirror feedback");

assert.match(constellation, /BenyuanFlowOrbitTrail/, "constellation result must preserve the same flow-motion layer");
assert.match(constellation, /leadingConstellationProgress/, "constellation orbit trail must be driven by real constellation dimensions");
assert.match(constellation, /\.frame\(height:\s*392\)/, "constellation seven-dimensional orbit map should be visually large enough to read as a graph");
assert.match(constellation, /firstViewportReserve:\s*96/, "constellation first viewport should hint at the seven-dimensional orbit without letting it collide with the bottom dock");

console.log("ios-flow-motion-layer-contract:ok");
