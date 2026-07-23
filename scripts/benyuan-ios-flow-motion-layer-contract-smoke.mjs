import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const motionRuntime = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanMotionRuntime.swift`, "utf8");
const primitives = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`, "utf8");
const rootView = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift`, "utf8");
const model = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift`, "utf8");
const collect = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift`, "utf8");
const processing = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift`, "utf8");
const theater = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift`, "utf8");
const actions = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterActions.swift`, "utf8");
const constellation = readFileSync(`${root}/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift`, "utf8");

assert.match(primitives, /struct BenyuanFlowTransitionLayer/, "native flow must expose a shared second-layer transition field");
assert.match(primitives, /struct BenyuanQuestionStepMotion/, "native flow must expose question step motion for Part1 progression");
assert.doesNotMatch(primitives, /struct BenyuanProcessingPhaseCurrent/, "native flow must not retain the removed atom-like processing current");
assert.match(primitives, /struct BenyuanFlowOrbitTrail/, "native flow must expose a reusable orbit trail for theater/result continuity");
assert.match(motionRuntime, /benyuanMotionPhase/, "native motion runtime must publish one inherited phase for nested vector layers");
assert.match(motionRuntime, /if let inheritedPhase[\s\S]*?content\(inheritedPhase\)/, "nested vector layers must reuse their parent timeline");
assert.match(motionRuntime, /else if !motionActive \|\| reduceMotion[\s\S]*?content\(0\)/, "inactive and reduce-motion states must render a static frame without a timer");
assert.doesNotMatch(primitives, /TimelineView/, "native design primitives must use the shared motion runtime instead of starting independent timelines");
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
assert.match(collect, /@Environment\(\\\.accessibilityReduceMotion\)[\s\S]*?if accessibilityReduceMotion[\s\S]*?scrollProxy\.scrollTo/, "collect question changes must scroll without animation when Reduce Motion is enabled");
assert.match(collect, /\.animation\(accessibilityReduceMotion \? nil : \.easeOut\(duration:\s*0\.24\), value:\s*assets\.map\(\\\.assetId\)\)/, "upload layout changes must disable implicit animation when Reduce Motion is enabled");
assert.match(primitives, /BenyuanStarTransitModifier/, "native question transitions must use a logical star-transit layer instead of a hard cut");
assert.match(primitives, /struct BenyuanQuestionStepMotion[\s\S]*?BenyuanStarTransitModifier/, "question step motion must include star transit through the view during page changes");
assert.match(primitives, /@State private var settleTask:[\s\S]*?settleTask\?\.cancel\(\)[\s\S]*?guard !Task\.isCancelled/, "rapid question changes must cancel the previous transit cleanup task");
assert.match(primitives, /private func settle\(\)[\s\S]*?if accessibilityReduceMotion[\s\S]*?isSettled = true[\s\S]*?isTransitActive = false[\s\S]*?return/, "question changes must settle immediately without opacity or scale animation under Reduce Motion");
assert.match(primitives, /struct BenyuanNovaSelectionBurst[\s\S]*?duration = accessibilityReduceMotion \? 0\.01 : 0\.86/, "option selection burst should linger long enough to feel like falling game particles");
assert.match(primitives, /try\? await Task\.sleep\(nanoseconds:\s*UInt64\(accessibilityReduceMotion \? 40_000_000 : 920_000_000\)\)/, "option selection burst lifetime should cover the full falling-star animation");
assert.match(primitives, /struct BenyuanClueOrbitField/, "collect flow must have a reusable clue-orbit field identity");
assert.match(primitives, /struct BenyuanRevealedStack[\s\S]*?accessibilityReduceMotion[\s\S]*?if accessibilityReduceMotion/, "staged reveals must render statically when Reduce Motion is enabled");
assert.match(primitives, /struct BenyuanQuestionSignalField[\s\S]*?BenyuanCompactAccretionField/, "question signal field must use the compact realistic accretion field instead of a line-orbit ornament");
assert.match(primitives, /struct BenyuanCompactAccretionField[\s\S]*?BenyuanAccretionParticleField[\s\S]*?Image\("BenyuanProcessingBlackHole"\)/, "compact question black hole must combine real artwork with inward particle motion");
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

assert.doesNotMatch(processing, /BenyuanProcessingPhaseCurrent/, "processing view must not stack an atom-like current over the black-hole artwork");
assert.match(processing, /private func processingArtwork\(size:\s*CGFloat\)[\s\S]*?BenyuanDeepCelestialBody/, "processing artwork must keep the animated black-hole body as its single visual system");
assert.doesNotMatch(processing, /BenyuanFlowOrbitTrail/, "processing view must not add a second large orbit system around the black-hole body");
assert.match(processing, /processingProgress/, "processing artwork must be driven by actual processing progress");
assert.match(processing, /generationPhaseRail/, "processing view must expose a visible cloud-stage rail during long generation waits");
assert.match(processing, /\.frame\(width:\s*geometry\.size\.width,\s*height:\s*geometry\.size\.height\)/, "processing root must constrain oversized celestial artwork to the real screen center");
for (const phase of ["接收线索", "多模态读取", "剧场折射", "星图显影"]) {
  assert.match(processing, new RegExp(phase), `processing cloud-stage rail must include ${phase}`);
}
assert.doesNotMatch(processing, /processingPhaseHint|可以切出 App|云端生成已接管|答案 \/ 图片|影像情绪|连续剧情|精神报告/, "processing view must avoid explanatory helper copy and duplicate stage subtitles");
assert.match(processing, /phaseState\(_ phase:\s*GenerationPhase\)/, "processing phase rail must derive active/done states from displayed progress");

assert.match(theater, /BenyuanTheaterAtmosphereLayer/, "theater view must use the dedicated cinematic atmosphere for act continuity");
assert.doesNotMatch(theater, /BenyuanFlowOrbitTrail/, "theater view must not stack a line-art orbit system over the cinematic atmosphere");
assert.match(theater, /theaterProgress/, "theater orbit trail must be driven by theater progress");
assert.doesNotMatch(theater, /theaterStageRail|theaterStageChip|Text\(stage\.label\)|TheaterStage\(/, "native theater should not show or keep the removed top stage capsule rail");
assert.match(theater, /act1ReadingPage/, "theater act1 must render as a full-screen scrollable reading page");
assert.match(theater, /act1ReadingScroll/, "theater act1 text must scroll independently above the fixed enter button");
assert.match(theater, /readingParagraphs\(text\)/, "theater act1 must support paragraph-separated long copy inside the scroll view");
assert.match(theater, /theaterLensCard/, "theater later scenes must render inside a single-shot lens card instead of loose disconnected text");
assert.match(theater, /BenyuanTheaterScenePortal/, "theater scene lens must use a dedicated celestial portal");
assert.match(theater, /theaterEchoPanel/, "theater scene must keep response/theme copy in a separate echo panel");
for (const removed of ["入场", "测试", "追问", "星图"]) {
  assert.doesNotMatch(theater, new RegExp(`TheaterStage\\(label:\\s*"${removed}"`), `theater top stage rail must not expose ${removed} stage`);
}
assert.doesNotMatch(theater, /TheaterStage\(label:\s*"镜面"/, "theater act rail must not expose the old 镜面 stage label");
assert.match(theater, /currentTheaterResponse/, "act2 selection should restore the selected option response when revisiting a round");
assert.doesNotMatch(theater, /selectedMirrorResponse/, "native theater should not keep the removed Act3 follow-up state");
assert.doesNotMatch(theater, /BenyuanNearFieldWarpBurst|BenyuanConstellationWarpTunnel|BenyuanWarpApproachField/, "native theater should skip removed Act3 and epilogue warp pages");
assert.doesNotMatch(actions, /func chooseAct3|theaterPhase = \.epilogue|markPhaseDuration\("act3"\)/, "native theater actions should not retain a user-visible Act3 or epilogue route");
assert.match(model, /var requiredTheaterChoiceCount:\s*Int[\s\S]*?min\(4,\s*theater\?\.theaterScript\.act2\.choices\.count \?\? 0\)/, "native theater must require four visible Act2 rounds when available");
assert.match(actions, /func nextTheaterChoice\(\)[\s\S]*?theaterChoiceIndex \+= 1/, "native theater should only advance through an explicit next action");
assert.match(actions, /func previousTheaterChoice\(\)[\s\S]*?theaterChoiceIndex -= 1/, "native theater should allow revisiting the previous round");
assert.match(actions, /choiceLogs\[theaterChoiceIndex\] = record/, "reselecting a theater option must replace the current round instead of duplicating it");
assert.match(theater, /choice\.options\.prefix\(4\)/, "native theater must render exactly four visible theater options");
assert.match(theater, /BenyuanNativePrimaryButton\([\s\S]*?进入生成星图[\s\S]*?model\.enterConstellationGenerationFromTheater\(\)/, "act2 final choice should reveal an explicit constellation generation button");
assert.match(actions, /func enterConstellationGenerationFromTheater\(\) async/, "native theater actions must expose a separate explicit constellation entry");
const chooseAct2Body = actions.match(/func chooseAct2\(_ option: TheaterChoiceOption\) \{[\s\S]*?\n    \}/)?.[0] ?? "";
assert.ok(chooseAct2Body, "native theater actions must keep chooseAct2");
assert.doesNotMatch(chooseAct2Body, /finishTheaterAndGenerateConstellation\(\)|enterConstellationGenerationFromTheater\(\)/, "act2 option tap must not automatically start constellation generation");
assert.doesNotMatch(chooseAct2Body, /theaterChoiceIndex \+= 1|theaterChoiceIndex = choiceLogs\.count/, "act2 option tap must not automatically advance the theater");

assert.match(constellation, /BenyuanFlowOrbitTrail/, "constellation result must preserve the same flow-motion layer");
assert.match(constellation, /leadingConstellationProgress/, "constellation orbit trail must be driven by real constellation dimensions");
assert.match(constellation, /\.frame\(height:\s*392\)/, "constellation seven-dimensional orbit map should be visually large enough to read as a graph");
assert.match(constellation, /firstViewportReserve:\s*96/, "constellation first viewport should hint at the seven-dimensional orbit without letting it collide with the bottom dock");
assert.match(constellation, /struct BenyuanDimensionResonanceGraph[\s\S]*?@Environment\(\\\.accessibilityReduceMotion\)[\s\S]*?\.animation\(accessibilityReduceMotion \? nil : \.easeOut/, "seven-dimensional node selection must disable implicit animation under Reduce Motion");

console.log("ios-flow-motion-layer-contract:ok");
