import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const homeMoonAssetPath = "mobile/benyuan_origin_ios_shell/Assets.xcassets/BenyuanHomeMoonEntrance.imageset/moon-entrance.png";
const backdrop = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellBackdrop.swift", "utf8");
const primitives = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift", "utf8");
const auth = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAuthView.swift", "utf8");
const account = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift", "utf8");
const collect = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift", "utf8");
const processing = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift", "utf8");
const theater = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift", "utf8");
const constellation = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift", "utf8");
const models = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeModels.swift", "utf8");
const renderer = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanConstellationImageRenderer.swift", "utf8");
const flowModel = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeFlowModel.swift", "utf8");
const rootView = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift", "utf8");
const home = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeHomeView.swift", "utf8");
const nativeArchetypes = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeArchetypeRegistry.swift", "utf8");
const localMotionOverlay = backdrop.slice(
  backdrop.indexOf("struct BenyuanLocalCelestialAssetMotionOverlay"),
  backdrop.indexOf("struct BenyuanLocalFarTideMoonMotionPath"),
);
const actionDock = constellation.slice(
  constellation.indexOf("struct BenyuanConstellationActionDock"),
  constellation.indexOf("struct BenyuanConstellationArchetypeField"),
);
const layeredCore = backdrop.slice(
  backdrop.indexOf("struct BenyuanLayeredCelestialCore"),
  backdrop.indexOf("struct BenyuanLayeredCelestialGlow"),
);

assert.match(backdrop, /struct BenyuanDeepCelestialBody/, "iOS shell must expose a shared deep celestial body component");
assert.match(backdrop, /enum Mode[\s\S]*?case accretionBlackHole[\s\S]*?case theaterNebula[\s\S]*?case constellationMoon[\s\S]*?case solarCorona[\s\S]*?case terrestrialPlanet[\s\S]*?case deepSpace[\s\S]*?case farTideMoon[\s\S]*?case starMapArchitect[\s\S]*?case moonHarbor[\s\S]*?case existentialNomad[\s\S]*?case rainWindowScribe[\s\S]*?case eventHorizonDiver[\s\S]*?case nebulaWeaver[\s\S]*?case deepSpaceAnchor/, "deep celestial body must define official 10 archetype visual modes plus shared legacy modes");
assert.match(backdrop, /BenyuanMotionTimeline/, "deep celestial body must be animation-driven through the shared motion runtime");
assert.match(backdrop, /BenyuanAccretionRing/, "deep celestial body must include a richer accretion ring");
assert.match(backdrop, /BenyuanNebulaVeil/, "deep celestial body must include a reusable nebula veil for theater scenes");
assert.match(backdrop, /struct BenyuanNebulaCore/, "deep celestial body must include a dedicated nebula core for theater scenes");
assert.match(backdrop, /BenyuanLunarCore/, "deep celestial body must include a reusable lunar core for constellation scenes");
assert.match(backdrop, /struct BenyuanSolarCoronaCore/, "deep celestial body must include a solar-corona core for hot archetypes");
assert.match(backdrop, /struct BenyuanSolarFlareField/, "deep celestial body must include solar flare rays so 日冕引燃者 is not just an orb with rings");
assert.match(backdrop, /struct BenyuanTerrestrialCore/, "deep celestial body must include a terrestrial core for grounded archetypes");
assert.match(backdrop, /struct BenyuanTerrestrialAtmosphere/, "deep celestial body must include terrestrial atmosphere and settlement lights for 类地栖居者");
assert.match(backdrop, /struct BenyuanDeepSpaceAnchorCore/, "deep celestial body must include a deep-space anchor core for quiet boundary archetypes");
assert.match(backdrop, /struct BenyuanFarTideMoonCore/, "deep celestial body must include a far-tide moon core for 远潮观月者");
assert.match(backdrop, /struct BenyuanStarMapArchitectCore/, "deep celestial body must include a geometric star-map core for 星图筑序者");
assert.match(backdrop, /struct BenyuanMoonHarborCore/, "deep celestial body must include a harbor shoreline core for 月港栖岸者");
assert.match(backdrop, /struct BenyuanExistentialNomadCore/, "deep celestial body must include a moving horizon core for 存在游牧者");
assert.match(backdrop, /struct BenyuanRainWindowScribeCore/, "deep celestial body must include a rain-window core for 雨窗抒写者");
assert.match(backdrop, /struct BenyuanOpenNebulaBloom/, "deep celestial body must include an open nebula bloom so 星云织梦者 is not a solid planet");
assert.match(backdrop, /struct BenyuanNebulaThreadField/, "deep celestial body must include woven nebula threads for 星云织梦者");
assert.match(backdrop, /BenyuanSpectralParticleField/, "deep celestial body must include subtle spectral particles");
assert.match(backdrop, /struct BenyuanEventHorizon/, "deep celestial body must include a dedicated event horizon core");
assert.match(backdrop, /struct BenyuanGravitationalLens/, "deep celestial body must include a gravitational lensing layer");
assert.match(backdrop, /struct BenyuanOrbitalDustBand/, "deep celestial body must include orbital dust bands for real depth");
assert.match(backdrop, /if mode == \.theaterNebula \{[\s\S]*?BenyuanNebulaCore/, "theater nebula mode must render its own soft nebula core");
assert.doesNotMatch(
  backdrop,
  /if mode == \.constellationMoon \{[\s\S]*?\} else \{[\s\S]*?BenyuanEventHorizon/,
  "theater nebula mode must not fall through to the black-hole event horizon"
);
assert.match(backdrop, /struct BenyuanLivingDistantMoon/, "shell backdrop must use an animated distant moon instead of a static circle");
assert.match(backdrop, /RadialGradient/, "deep celestial body must use radial shading for depth");
assert.match(backdrop, /AngularGradient/, "deep celestial body must use angular shading for dimensional texture");
assert.match(backdrop, /BlendMode\.screen/, "deep celestial light must use screen blending for luminous depth");

assert.match(primitives, /struct BenyuanRevealedStack/, "native flow must expose a staged reveal stack for entrance motion");
assert.match(primitives, /struct BenyuanQuestionSignalField/, "native flow must expose a question signal field for Part 1 motion");
assert.match(primitives, /struct BenyuanClueOrbitField/, "native collect flow must expose a dedicated clue-orbit celestial field");
assert.match(primitives, /struct BenyuanUploadCelestialPortal/, "native upload flow must expose a dedicated deep-field portal instead of a clipped mini module card");
assert.match(primitives, /struct BenyuanStageLens/, "native flow must expose a theater stage lens for scene motion");
assert.match(primitives, /BenyuanMotionTimeline/, "native motion primitives must be animation-driven through the shared motion runtime");
assert.match(primitives, /struct BenyuanTheaterAtmosphereLayer[\s\S]*?preferredFramesPerSecond:\s*16/, "native theater must expose a lower-frequency merged atmosphere layer");
assert.match(flowModel, /case home/, "native flow must include an app home stage before starting collection");
assert.match(rootView, /case \.home:[\s\S]*?BenyuanNativeHomeView/, "native root must route the home stage to a real SwiftUI home view");
assert.match(home, /struct BenyuanHomeOriginPortal/, "native home must own a distinct source-portal hero instead of reusing result archetype bodies");
assert.match(home, /BenyuanMotionTimeline\(preferredFramesPerSecond:\s*18\)/, "native home source portal must be animation-driven without forcing a heavy 30fps hero");
assert.match(home, /BenyuanHomeSourceFilaments/, "native home source portal must use independent filament language");
assert.match(home, /BenyuanHomeCalibrationLattice/, "native home source portal must use calibration geometry rather than a result-planet shape");
assert.match(home, /struct BenyuanHomeMoonEntrance/, "native home source portal must use a moon-first entrance artwork layer");
assert.match(home, /Image\("BenyuanHomeMoonEntrance"\)/, "native home moon entrance must render the dedicated local asset instead of a code-only seed");
assert.match(home, /BenyuanHomeLunarGlint/, "native home moon entrance must keep native lunar motion over the raster artwork");
assert.ok(existsSync(homeMoonAssetPath), "native home moon entrance asset must exist as a dedicated local imageset");
assert.doesNotMatch(home, /BenyuanDeepCelestialBody[\s\S]*?mode:\s*\.(?:accretionBlackHole|farTideMoon|starMapArchitect|moonHarbor|existentialNomad|rainWindowScribe|eventHorizonDiver|nebulaWeaver|solarCorona|terrestrialPlanet|deepSpaceAnchor)/, "native home must not visually duplicate the fixed result archetype celestial bodies");
assert.match(home, /identityGatePanel/, "native home must expose the compact Apple, WeChat, and visitor preview choices");
assert.match(flowModel, /@Published var hasCompletedInitialHomeBoot = false/, "native flow must track first home boot before animating away from the landing screen");
assert.match(rootView, /shouldAnimateStageTransition \? \.easeInOut\(duration:\s*BenyuanMotion\.base\) : nil/, "native root must not animate a stale stage over the first home frame");
assert.match(flowModel, /var canExploreFromHome:[\s\S]*?authSession\.provider != \.anonymous/, "native home must not let an anonymous guest session bypass the formal login gate");
assert.match(home, /用 Apple 登录/, "native home must include an Apple login entry");
assert.match(home, /BenyuanAppleAuthCoordinator/, "native home Apple login must use the explicit Apple authorization coordinator");
assert.match(home, /startAppleLogin/, "native home Apple login must have a real tappable SwiftUI button action");
assert.doesNotMatch(home, /SignInWithAppleButton[\s\S]*?\.opacity\(0\.001\)/, "native home Apple login must not rely on a nearly transparent system button that can miss taps on device");
assert.match(home, /微信登录/, "native home must include a WeChat login entry");
assert.match(home, /访客预览/, "native home must include a visitor preview entry");
assert.doesNotMatch(home, /手机号码登录/, "native home should not show phone login on the first landing surface");
assert.doesNotMatch(home, /先选择身份|登录后再开始探索|选择身份后探索|不急着给自己下结论|REQUIRED|soon/, "native home should stay visual and avoid explanatory login labels");

assert.match(auth, /BenyuanRevealedStack/, "native auth view must use staged entrance motion");
assert.match(auth, /BenyuanDeepCelestialBody/, "native auth view must use the shared dynamic moon field");
assert.match(auth, /\.foregroundStyle\(BenyuanColor\.bgVoid\)/, "native Apple login label must use dark text on its light capsule");
assert.match(auth, /BenyuanAppleAuthCoordinator/, "native Apple login must use an explicit authorization coordinator instead of a transparent system-button overlay");
assert.match(auth, /startAppleLogin/, "native Apple login must have a real SwiftUI button action that opens Apple authorization");
assert.doesNotMatch(auth, /\.opacity\(0\.001\)/, "native Apple login must not rely on a nearly transparent system button that can miss taps on device");
assert.doesNotMatch(auth, /先以访客进入|可先以访客进入/, "native auth view must not expose guest exploration before login");

assert.match(collect, /BenyuanQuestionSignalField/, "native collect view must include per-question signal motion");
assert.match(collect, /BenyuanQuestionSignalBridge/, "native collect view must place the gold signal bridge between the celestial capsule and the options");
assert.match(collect, /BenyuanRevealedStack/, "native collect view must stagger question and option reveal");
assert.match(collect, /\.id\(model\.activeQuestionIndex\)/, "native collect view must reset reveal motion on question changes");
assert.match(primitives, /struct BenyuanNovaSelectionBurst[\s\S]*?GeometryReader/, "native option nova burst must be geometry-aware so the yellow particle effect anchors to the actual selection dot");
assert.match(primitives, /private let selectionDotDiameter:\s*CGFloat = 18/, "native option nova burst must know the real trailing selection dot diameter");
assert.match(primitives, /x:\s*proxy\.size\.width - optionHorizontalPadding - selectionDotDiameter \* 0\.5/, "native option nova burst must emit from the right selection dot center instead of an estimated trailing padding");
assert.match(primitives, /let gravity = eased \* eased \* \(44 \+ CGFloat\(index % 5\) \* 8\)/, "native option nova burst must have a visible game-like falling particle drift");
assert.match(primitives, /Image\(systemName:\s*"sparkle"\)/, "native option nova burst must include star-fragment sparkles, not only capsule streaks");
assert.match(collect, /uploadHeader/, "native upload question must use a compact upload-specific header");
assert.match(collect, /BenyuanUploadCelestialPortal/, "native upload question must use the dedicated deep-field upload portal");
assert.match(collect, /uploadThumbnailStrip/, "native upload question must expose thumbnails as a first-screen manageable strip");
assert.match(collect, /collectBottomSafeSpace/, "native collect scroll content must reserve explicit bottom navigation clearance");
assert.match(collect, /ScrollView\(showsIndicators:\s*false\)[\s\S]*?\.safeAreaInset\(edge:\s*\.bottom,\s*spacing:\s*0\)[\s\S]*?bottomBar/, "native collect bottom navigation must be a safe-area inset so upload thumbnails are never hidden behind the fixed dock");
assert.doesNotMatch(collect, /\n\s*}\s*else\s*\{[\s\S]*?\n\s*}\n\s*\n\s*bottomBar\n\s*}/, "native collect bottom navigation must not be a sibling overlay that can cover scroll content");

assert.match(processing, /BenyuanDeepCelestialBody/, "native processing view must use the shared dynamic celestial body");
assert.match(processing, /mode:\s*\.accretionBlackHole/, "native processing view must use the accretion black-hole body");
assert.match(processing, /BenyuanFlowOrbitTrail/, "native processing view must add a restrained orbit trail so the state page does not feel static");
assert.match(processing, /processingCardCornerRadius/, "native processing card must use an explicit corner token for screenshot-stable layout");
assert.doesNotMatch(processing, /BenyuanBlackMoonMark\(size:\s*168/, "native processing view should not use the old flat moon mark as its hero visual");
assert.match(processing, /processingProgress/, "native processing view must keep the real progress signal");

assert.match(account, /BenyuanFlowOrbitTrail/, "native account history surface must share the deep-field orbit language");
assert.match(account, /accountCardCornerRadius/, "native account cards must use an explicit corner token for stable visual rhythm");
assert.match(account, /accountBottomActionDock/, "native account actions should be a compact bottom dock instead of four stacked full-width rows");
assert.doesNotMatch(account, /Text\(title\)[\s\S]*?\.font\(\.system\(size:\s*21,\s*weight:\s*\.black\)\)/, "native account provider cards must not drift back to oversized black typography");

assert.match(theater, /BenyuanTheaterAtmosphereLayer/, "native theater view must use the merged low-frequency atmosphere layer");
assert.doesNotMatch(theater, /BenyuanStageLens/, "native theater view must not stack the old stage lens over the theater scene");
assert.doesNotMatch(theater, /BenyuanNebulaTheaterField/, "native theater view must not stack the old nebula field over the theater scene");
assert.match(theater, /act1ReadingPage\(availableHeight:/, "native theater act1 hero body must use the full-screen reading surface");
assert.match(theater, /BenyuanTheaterAtmosphereLayer\(progress:\s*theaterProgress\)/, "native theater act1 must keep the dedicated nebula atmosphere layer behind the reading surface");
assert.match(theater, /benyuanSanitizedVisibleText/, "native theater visible text must sanitize raw slugs and OCR noise");
assert.match(theater, /BenyuanRevealedStack/, "native theater view must reveal acts and choices cinematically");
assert.match(theater, /\.transition\(/, "native theater view must animate act transitions");
assert.doesNotMatch(theater, /ACT I|ACT II|ACT III|EPILOGUE/, "native theater should not show act or branch marker capsules in the user-facing scene");
assert.match(theater, /act1ReadingPage\(availableHeight:/, "native theater act1 must use a full-screen scrollable reading page");
assert.match(theater, /BenyuanNativePrimaryButton\(title:\s*"进入这一幕"[\s\S]*?model\.enterAct2\(\)/, "native theater act1 fixed bottom action must remain unchanged");
assert.match(theater, /private func theaterLensCardHeight\(_ title:\s*String\)/, "native theater narrative lens should size from text instead of reserving a large empty portal");
assert.match(theater, /\.frame\(height:\s*cardHeight,\s*alignment:\s*\.topLeading\)/, "native theater narrative lens must keep the text vertically tight in the capsule");
assert.doesNotMatch(theater, /Text\(stage\.label\)|TheaterStage\(|theaterStageRail|theaterStageChip|model\.revisitTheaterPhase\(stage\.phase\)/, "native theater must not show the removed top stage capsule rail");
for (const label of ["入场", "分岔", "追问", "星图", "镜面"]) {
  assert.doesNotMatch(theater, new RegExp(`TheaterStage\\(label:\\s*"${label}"`), `native theater top stage rail must not expose ${label}`);
}
assert.doesNotMatch(theater, /BenyuanWarpApproachField|theaterEpiloguePortal|BenyuanConstellationWarpTunnel|ForEach\(0..<68/, "native theater must not retain the removed epilogue/warp transition page");
assert.match(theater, /choice\.options\.prefix\(4\)/, "native theater must keep the visible theater test to four options");
assert.match(theater, /BenyuanNativeOptionButton[\s\S]*?pressScale:\s*1/, "native theater option buttons must avoid press scaling so the card stack does not jump");
assert.match(primitives, /animation\(pressScale == 1 \? nil : \.easeOut\(duration:\s*0\.18\), value:\s*active\)/, "native option buttons must disable active-state layout animation when theater asks for fixed press scale");
assert.match(primitives, /HStack\(alignment:\s*\.center,\s*spacing:\s*BenyuanSpacing\.x4\)/, "native option capsules must center their icon, text, and selection ring vertically");
assert.match(primitives, /\.frame\(maxWidth:\s*\.infinity,\s*minHeight:\s*34,\s*alignment:\s*\.leading\)/, "native option capsule text should keep horizontal reading alignment while the HStack centers it vertically");
assert.match(primitives, /\.padding\(\.vertical,\s*8\)/, "native option capsules should keep tighter vertical padding instead of leaving excess top padding");

assert.match(constellation, /BenyuanDeepCelestialBody/, "native constellation view must use the shared dynamic celestial body");
assert.match(models, /let personalizedName:\s*String\?/, "native constellation DTO must decode personalized_name separately from the canonical archetype name");
assert.match(models, /let personalizedSubtitle:\s*String\?/, "native constellation DTO must decode personalized_subtitle separately from the canonical archetype name");
assert.match(models, /var displayName:\s*String/, "native constellation DTO must expose a display name that can prefer the personal label");
assert.match(models, /var displaySubtitle:\s*String/, "native constellation DTO must expose a display subtitle that can prefer the personal label");
assert.match(models, /canonicalizedForNativeDisplay/, "native constellation DTO must expose a final canonicalization pass for stale server or history labels");
assert.match(nativeArchetypes, /月背寻光者/, "native archetype registry must recognize the retired moon-back seeker label from older builds");
assert.match(nativeArchetypes, /事件视界沉潜者/, "native archetype registry must keep the official event-horizon label");
assert.match(nativeArchetypes, /The Far-Tide Moon Watcher/, "native archetype registry must not leave 远潮观月者 with the old Moonlit Seeker subtitle");
assert.match(nativeArchetypes, /sanitizedPersonalizedName/, "native archetype registry must sanitize stale personalized names before display");
assert.match(nativeArchetypes, /containsOfficialOrRetiredLabel/, "native archetype registry must reject retired or official labels as personalized display names");
assert.match(constellation, /Text\(data\.archetype\.name\)[\s\S]*?\.font\(\.system\(size:\s*42,\s*weight:\s*\.semibold\)\)/, "native constellation hero must use the fixed canonical 10-label archetype as the main title");
assert.match(constellation, /Text\(data\.archetype\.englishName\)/, "native constellation hero must keep the English archetype name as a secondary label");
assert.match(constellation, /Text\("\\\(data\.archetype\.displayName\)：\\\(data\.archetype\.displaySubtitle\)"\)/, "native constellation hero must move personalized naming into the explanatory annotation below the fixed label");
assert.doesNotMatch(constellation, /Text\(data\.archetype\.displayName\)[\s\S]*?\.font\(\.system\(size:\s*4[0-9],/, "native constellation hero must not let personalized labels replace the official archetype heading");
assert.match(renderer, /drawWrapped\(constellation\.archetype\.name/, "native constellation share image must render the canonical archetype label as the title");
assert.match(renderer, /archetype\.displayName[\s\S]*?archetype\.displaySubtitle/, "native constellation share image may include personalized naming only as supporting annotation");
assert.match(constellation, /celestialMode\(for:\s*data\.archetype\)/, "native constellation hero must choose celestial mode from the archetype");
assert.match(constellation, /private func celestialMode\(for archetype:\s*PsycheArchetype\)/, "native constellation must expose archetype-to-celestial mapping");
for (const [label, mode] of [
  ["远潮观月者", ".farTideMoon"],
  ["星图筑序者", ".starMapArchitect"],
  ["月港栖岸者", ".moonHarbor"],
  ["存在游牧者", ".existentialNomad"],
  ["雨窗抒写者", ".rainWindowScribe"],
  ["事件视界沉潜者", ".eventHorizonDiver"],
  ["星云织梦者", ".nebulaWeaver"],
  ["日冕引燃者", ".solarCorona"],
  ["类地栖居者", ".terrestrialPlanet"],
  ["深空锚定者", ".deepSpaceAnchor"],
]) {
  assert.match(
    constellation,
    new RegExp(`case "${label}":[\\s\\S]*?return \\${mode}`),
    `native constellation must hard-map official label ${label} to ${mode}`
  );
}
for (const mode of [
  ".farTideMoon",
  ".starMapArchitect",
  ".moonHarbor",
  ".existentialNomad",
  ".rainWindowScribe",
  ".eventHorizonDiver",
  ".nebulaWeaver",
  ".solarCorona",
  ".terrestrialPlanet",
  ".deepSpaceAnchor",
]) {
  assert.match(constellation, new RegExp(mode.replace(".", "\\.")), `native constellation must be able to map to ${mode}`);
}
assert.doesNotMatch(constellation, /\.gasGiant/, "native constellation must not map official results to removed gas-giant mode");
assert.doesNotMatch(constellation, /BenyuanBlackMoonMark\(size:\s*156/, "native constellation archetype should not use the old flat moon mark");
assert.match(constellation, /BenyuanConstellationSubjectIsolationField/, "native constellation hero must isolate the subject from global moon shadows so celestial assets do not read as ghosted doubles");
assert.match(constellation, /\.contrast\(mode\.referenceArtworkSubjectContrast\)/, "native constellation hero must sharpen reference artwork contrast without duplicating the image layer");
assert.match(constellation, /\.saturation\(mode\.referenceArtworkSubjectSaturation\)/, "native constellation hero must slightly clarify gold and silver image signal without a second subject overlay");
assert.match(constellation, /BenyuanDimensionOrbitMap/, "native constellation view must include a dynamic dimension orbit map");
assert.match(constellation, /BenyuanMotionTimeline/, "native constellation orbit map must be animation-driven through the shared motion runtime");
assert.match(constellation, /sevenDimensions/, "native constellation orbit map must be driven by real dimension scores");
assert.match(constellation, /\.frame\(height:\s*392\)/, "native constellation seven-dimension orbit must be large enough to read as the primary graphic system");
assert.match(constellation, /BenyuanDimensionResonanceGraph/, "native constellation seven-dimension values must be rendered graphically instead of as percent data cards");
assert.doesNotMatch(constellation, /Text\("\\\(dimension\.score\)%"\)/, "native constellation seven-dimension section must not fall back to raw percent cards");
assert.match(constellation, /private func dimensionInsightCard/, "native constellation must expand the selected dimension into a richer personal reading");
assert.match(constellation, /private func dimensionInsight\(/, "native constellation must derive a structured personal reading from the selected dimension");
for (const insightLabel of ["核心结论", "潜在防御", "盲点", "可用方向"]) {
  assert.match(constellation, new RegExp(insightLabel), `native constellation dimension reading must include ${insightLabel}`);
}
assert.match(constellation, /safeAreaInset\(edge:\s*\.bottom,\s*spacing:\s*0\)/, "native constellation final actions must sit flush to the screen bottom without a safe-area inset gap");
assert.match(constellation, /bottomDockHeight:\s*116/, "native constellation scroll content must keep the previous compact dock clearance");
assert.match(constellation, /firstViewportReserve:\s*96/, "native constellation first viewport must hint at the seven-dimension section without colliding with the fixed action dock");
assert.match(constellation, /topMaskHeight:\s*52/, "native constellation scroll content must reserve a stable top viewport buffer below the progress rail");
assert.match(constellation, /safeAreaInset\(edge:\s*\.top,\s*spacing:\s*0\)/, "native constellation scroll content must use a top inset so scrolled sections do not collide with the progress rail");
assert.match(constellation, /constellationTopScrollMask/, "native constellation top inset should use a deep-field fade instead of a hard blank gap");
assert.match(constellation, /frame\(height:\s*layoutBudget\.topMaskHeight\)/, "native constellation top inset must use the measured top reserve token");
assert.match(constellation, /bottomContentReserve:\s*300/, "native constellation ending must keep enough scroll reserve so final text is not hidden behind the dock");
assert.match(constellation, /bottomDockHeight \+ bottomContentReserve \+ safeAreaBottom/, "native constellation bottom padding must include actual device safe-area inset");
assert.match(constellation, /finalDock\(bottomEdgeOffset:\s*geometry\.safeAreaInsets\.bottom\)[\s\S]*?\.frame\(height:\s*layoutBudget\.bottomDockHeight \+ geometry\.safeAreaInsets\.bottom\)/, "native constellation final dock must receive the actual bottom safe-area inset for background alignment");
assert.match(constellation, /BenyuanConstellationActionDock[\s\S]*?\.frame\(maxWidth:\s*\.infinity,\s*maxHeight:\s*\.infinity,\s*alignment:\s*\.bottom\)/, "native constellation action dock content must pin to the bottom of its measured inset frame");
assert.match(constellation, /\.padding\(\.bottom,\s*0\)/, "native constellation dock keeps the button group height stable while the lower background aligns to the screen bottom");
assert.doesNotMatch(constellation, /HStack\(spacing:\s*BenyuanSpacing\.x3\)[\s\S]{0,600}?\.offset\(y:\s*bottomEdgeOffset\)/, "native constellation action buttons must not move when aligning the dock background");
assert.match(actionDock, /let backgroundHeight = 110 \+ bottomEdgeOffset/, "native constellation dock background must include the bottom safe-area inset in one measured layer");
assert.match(actionDock, /Gradient\(stops:[\s\S]*?BenyuanColor\.bgVoid\.opacity\(0\)[\s\S]*?BenyuanColor\.bgVoid\.opacity\(0\.78\)[\s\S]*?BenyuanColor\.bgVoid[\s\S]*?BenyuanColor\.bgVoid[\s\S]*?\.frame\(height:\s*backgroundHeight\)[\s\S]*?\.offset\(y:\s*bottomEdgeOffset\)/, "native constellation dock background must be a single seamless gradient-to-black layer offset as a unit");
assert.doesNotMatch(actionDock, /Rectangle\(\)[\s\S]{0,260}?\.fill\(BenyuanColor\.textPrimary\.opacity\(0\.035\)\)[\s\S]{0,120}?\.frame\(height:\s*1\)/, "native constellation dock background must not reintroduce a horizontal hairline seam");
assert.doesNotMatch(actionDock, /HStack\(spacing:\s*BenyuanSpacing\.x3\)[\s\S]{0,700}?\.background\(/, "native constellation action dock must not split the lower black block into a separate HStack background");
assert.match(constellation, /constellationEndAnchor/, "native constellation must expose an end anchor for bottom-of-report screenshot checks");
assert.match(constellation, /prefersConstellationEndPreview/, "native constellation preview must be able to scroll to the report ending");
assert.doesNotMatch(
  constellation,
  /Color\.clear[\s\S]*?\.id\(constellationEndAnchor\)/,
  "native constellation end preview must anchor to visible closing content, not a zero-height spacer that can crop section text"
);
assert.match(constellation, /BenyuanConstellationDeepFieldMask/, "native constellation hero must include a deeper first-viewport field mask");
assert.match(constellation, /BenyuanRevealedStack/, "native constellation result sections must reveal cinematically instead of landing as a static document");
assert.match(constellation, /BenyuanConstellationActionDock/, "native constellation final actions must use a dedicated animated action dock");
assert.match(backdrop, /var usesReferenceArtworkRender:\s*Bool/, "official archetype celestial bodies must use high-fidelity reference artwork as their visual base");
assert.match(
  backdrop,
  /if mode\.usesReferenceArtworkRender,[\s\S]*?BenyuanCelestialAssetCatalog\.isAvailable\(assetName\)[\s\S]*?let layerSet = BenyuanCelestialAssetCatalog\.layerSet\(for:\s*assetName\)[\s\S]*?BenyuanLayeredCelestialAssetRenderer[\s\S]*?BenyuanLocalCelestialAssetMotionOverlay/,
  "official archetype celestial bodies must combine the v5 reference artwork base with native motion paths"
);
assert.match(backdrop, /struct BenyuanLocalCelestialAssetAtmosphere/, "reference raster celestial assets may still have a blended fallback atmosphere");
assert.match(backdrop, /struct BenyuanLayeredCelestialAssetRenderer/, "official reference artwork must have a layered asset renderer");
assert.match(backdrop, /layeredSuffixes = \(backdrop:\s*"Backdrop",\s*core:\s*"Core",\s*glow:\s*"Glow",\s*particles:\s*"Particles"\)/, "layered asset contract must use stable Backdrop/Core/Glow/Particles suffixes");
assert.match(backdrop, /static func layerSet\(for assetName:\s*String\)[\s\S]*?backdropName:[\s\S]*?coreName:[\s\S]*?glowName:[\s\S]*?particlesName:/, "layered asset catalog must resolve optional backdrop/core/glow/particles layers");
assert.match(backdrop, /struct BenyuanReferenceCelestialBackdrop[\s\S]*?\.blendMode\(\.screen\)/, "signal backdrop must enter through transparent screen blending instead of a hard black rectangle");
assert.match(backdrop, /BenyuanReferenceCelestialBackdrop\(layers:\s*layerSet,\s*size:\s*size,\s*phase:\s*phase,\s*pulse:\s*pulse,\s*mode:\s*mode\)[\s\S]*?BenyuanLayeredCelestialAssetRenderer/, "signal backdrop must sit behind the transparent active subject layer");
assert.match(
  backdrop,
  /struct BenyuanLayeredCelestialAssetRenderer[\s\S]*?BenyuanReferenceCelestialArtwork\(assetName:\s*layers\.baseName/,
  "reference artwork renderer must keep the v5 base celestial.png as the primary visual subject"
);
assert.doesNotMatch(
  backdrop,
  /if layers\.hasLayeredArtwork \{[\s\S]*?BenyuanLayeredCelestialParticles[\s\S]*?BenyuanLayeredCelestialGlow[\s\S]*?BenyuanLayeredCelestialCore/,
  "official renderer must not let extracted Core/Glow/Particles replace the v5 reference artwork subject"
);
assert.doesNotMatch(layeredCore, /\.blendMode\(\.screen\)/, "layered core must not screen-blend the primary artwork into a washed-out plate");
assert.doesNotMatch(layeredCore, /\.blur\(radius:\s*size \*/, "layered core must not apply a large size-scaled blur to the primary artwork");
assert.match(backdrop, /struct BenyuanLocalCelestialAssetCore[\s\S]*?\.blur\(radius:\s*2\.4\)[\s\S]*?RadialGradient/, "single-image fallback may keep only a tiny glow blur plus radial edge mask");
assert.doesNotMatch(backdrop, /\.blur\(radius:\s*size \* 0\.045\)/, "reference artwork fallback must no longer wash the main layer with a large blur");
assert.match(backdrop, /struct BenyuanLocalCelestialAssetMotionOverlay/, "official native celestial bodies must keep dedicated animated motion paths");
for (const [mode, motionPath] of [
  [".farTideMoon", "BenyuanLocalFarTideMoonMotionPath"],
  [".starMapArchitect", "BenyuanLocalStarMapArchitectMotionPath"],
  [".moonHarbor", "BenyuanLocalMoonHarborMotionPath"],
  [".existentialNomad", "BenyuanLocalExistentialNomadMotionPath"],
  [".rainWindowScribe", "BenyuanLocalRainWindowScribeMotionPath"],
  [".eventHorizonDiver", "BenyuanLocalEventHorizonDiverMotionPath"],
  [".nebulaWeaver", "BenyuanLocalNebulaWeaverMotionPath"],
  [".solarCorona", "BenyuanLocalSolarCoronaMotionPath"],
  [".terrestrialPlanet", "BenyuanLocalTerrestrialPlanetMotionPath"],
  [".deepSpaceAnchor", "BenyuanLocalDeepSpaceAnchorMotionPath"],
]) {
  assert.match(backdrop, new RegExp(`case \\${mode}:[\\s\\S]*?return true`), `official mode ${mode} must use transparent reference artwork rendering`);
  assert.match(backdrop, new RegExp(`case \\${mode}:[\\s\\S]*?${motionPath}`), `official mode ${mode} must dispatch to its own native motion path`);
  assert.match(backdrop, new RegExp(`struct ${motionPath}`), `official mode ${mode} must define ${motionPath}`);
}
assert.match(backdrop, /struct BenyuanLocalFallbackMotionPath/, "celestial bodies may keep a fallback path for non-official modes only");
assert.doesNotMatch(
  localMotionOverlay,
  /ForEach\(0..<12,/,
  "official native celestial motion must not collapse back to one generic 12-particle orbit overlay"
);
assert.match(backdrop, /Image\(assetName\)[\s\S]*?\.mask\([\s\S]*?RadialGradient/, "non-official raster fallback must use a radial edge mask when present");
assert.match(backdrop, /Image\(assetName\)[\s\S]*?\.blendMode\(\.screen\)/, "non-official raster fallback must use screen blending to avoid a hard black rectangle");
assert.match(backdrop, /BenyuanReferenceCelestialArtwork\(assetName:\s*layers\.baseName,\s*size:\s*size,\s*phase:\s*phase,\s*progress:\s*progress,\s*pulse:\s*pulse,\s*mode:\s*mode\)/, "official reference artwork base must receive mode and phase for subtle native motion");
const primaryArtworkChain = backdrop.match(/Image\(assetName\)[\s\S]*?\.opacity\(mode\.referenceArtworkOpacity\)[\s\S]*?\.shadow\(/)?.[0] ?? "";
assert.ok(primaryArtworkChain.length > 0, "official reference artwork must have a primary subject image chain");
assert.doesNotMatch(primaryArtworkChain, /\.blendMode\(\.screen\)/, "official reference artwork subject must render as a full-strength transparent PNG, not screen-blend away dark celestial cores");
const referenceArtworkBody = backdrop.slice(
  backdrop.indexOf("struct BenyuanReferenceCelestialArtwork"),
  backdrop.indexOf("struct BenyuanLayeredCelestialCore"),
);
assert.equal(
  (referenceArtworkBody.match(/Image\(assetName\)/g) ?? []).length,
  1,
  "official reference artwork must draw the full subject exactly once to avoid large/small duplicate celestial ghosts",
);
assert.match(
  referenceArtworkBody,
  /if mode\.referenceArtworkUsesGlowLayer,[\s\S]*?let glowAssetName = BenyuanCelestialAssetCatalog\.layerSet\(for:\s*assetName\)\.glowName[\s\S]*?Image\(glowAssetName\)/,
  "official reference artwork glow must use the transparent Glow layer instead of redrawing the full subject",
);
assert.match(
  backdrop,
  /var referenceArtworkUsesGlowLayer:[\s\S]*?case \.farTideMoon, \.moonHarbor, \.terrestrialPlanet:[\s\S]*?return false/,
  "moon and terrestrial archetypes must disable full-shape glow layers because they read as duplicate body ghosts",
);
assert.match(
  backdrop,
  /var referenceArtworkUsesProceduralAtmosphereGlow:[\s\S]*?case \.farTideMoon, \.moonHarbor, \.terrestrialPlanet:[\s\S]*?return false/,
  "moon and terrestrial archetypes must disable procedural body-sized atmosphere glows because the reference artwork already contains the body",
);
assert.match(backdrop, /var referenceArtworkSubjectContrast:[\s\S]*?case \.farTideMoon, \.moonHarbor, \.terrestrialPlanet:[\s\S]*?return 1\.18/, "moon and terrestrial archetypes must sharpen the primary layer instead of adding duplicate glow copies");
assert.match(backdrop, /var referenceArtworkOpacity:[\s\S]*?return 1\.0/, "official reference artwork opacity must preserve the center celestial body at full strength");
assert.match(constellation, /BenyuanConstellationActionDock[\s\S]*?BenyuanMotionTimeline\(preferredFramesPerSecond:\s*24\)/, "native constellation final dock must have subtle real-time motion without forcing a full 30fps background loop");
assert.match(constellation, /struct BenyuanConstellationDeepFieldMask[\s\S]*?BenyuanMotionTimeline\(preferredFramesPerSecond:\s*16\)/, "native constellation deep field should run at a lower steady-state frame rate for smoother scrolling");
assert.match(constellation, /struct BenyuanDimensionOrbitMap[\s\S]*?BenyuanMotionTimeline\(preferredFramesPerSecond:\s*18\)/, "native constellation orbit map should keep motion readable without over-refreshing the graph");
assert.match(actionDock, /Gradient\(stops:[\s\S]*?\.init\(color:\s*BenyuanColor\.bgVoid,\s*location:\s*1\)/, "native constellation final dock must end in an opaque deep-field mask so orbit labels do not bleed through action buttons");

console.log("ios-celestial-ui-contract:ok");
