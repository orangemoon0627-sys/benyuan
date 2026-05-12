import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const backdrop = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellBackdrop.swift", "utf8");
const primitives = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift", "utf8");
const auth = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAuthView.swift", "utf8");
const account = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift", "utf8");
const collect = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift", "utf8");
const processing = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift", "utf8");
const theater = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift", "utf8");
const constellation = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift", "utf8");

assert.match(backdrop, /struct BenyuanDeepCelestialBody/, "iOS shell must expose a shared deep celestial body component");
assert.match(backdrop, /enum Mode[\s\S]*?case accretionBlackHole[\s\S]*?case theaterNebula[\s\S]*?case constellationMoon/, "deep celestial body must define distinct black-hole, theater-nebula, and constellation-moon modes");
assert.match(backdrop, /TimelineView\(\.animation/, "deep celestial body must be animation-driven");
assert.match(backdrop, /BenyuanAccretionRing/, "deep celestial body must include a richer accretion ring");
assert.match(backdrop, /BenyuanNebulaVeil/, "deep celestial body must include a reusable nebula veil for theater scenes");
assert.match(backdrop, /struct BenyuanNebulaCore/, "deep celestial body must include a dedicated nebula core for theater scenes");
assert.match(backdrop, /BenyuanLunarCore/, "deep celestial body must include a reusable lunar core for constellation scenes");
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
assert.match(primitives, /TimelineView\(\.animation/, "native motion primitives must be animation-driven");

assert.match(auth, /BenyuanRevealedStack/, "native auth view must use staged entrance motion");
assert.match(auth, /BenyuanDeepCelestialBody/, "native auth view must use the shared dynamic moon field");
assert.match(auth, /\.foregroundStyle\(BenyuanColor\.bgVoid\)/, "native Apple login label must use dark text on its light capsule");
assert.match(auth, /\.opacity\(0\.001\)/, "native Apple system button overlay must be visually hidden enough to avoid duplicate white text");

assert.match(collect, /BenyuanQuestionSignalField/, "native collect view must include per-question signal motion");
assert.match(collect, /BenyuanRevealedStack/, "native collect view must stagger question and option reveal");
assert.match(collect, /\.id\(model\.activeQuestionIndex\)/, "native collect view must reset reveal motion on question changes");
assert.match(primitives, /struct BenyuanNovaSelectionBurst[\s\S]*?GeometryReader/, "native option nova burst must be geometry-aware so the yellow particle effect anchors to the actual selection dot");
assert.match(primitives, /let emitter = CGPoint\(x:\s*proxy\.size\.width - trailingInset,\s*y:\s*proxy\.size\.height \* 0\.5\)/, "native option nova burst must emit from the right selection dot center instead of a fixed trailing padding");
assert.match(primitives, /let fall = eased \* \(28 \+ CGFloat\(index % 4\) \* 7\)/, "native option nova burst must have a visible game-like falling particle drift");
assert.match(collect, /uploadHeader/, "native upload question must use a compact upload-specific header");
assert.match(collect, /BenyuanUploadCelestialPortal/, "native upload question must use the dedicated deep-field upload portal");
assert.match(collect, /uploadThumbnailStrip/, "native upload question must expose thumbnails as a first-screen manageable strip");
assert.match(collect, /collectBottomSafeSpace/, "native collect scroll content must reserve explicit bottom navigation clearance");

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

assert.match(theater, /BenyuanStageLens/, "native theater view must include stage lens motion");
assert.match(theater, /BenyuanNebulaTheaterField/, "native theater view must include a dedicated nebula field");
assert.match(theater, /mode:\s*\.theaterNebula/, "native theater hero body must use the theater nebula mode");
assert.match(theater, /BenyuanRevealedStack/, "native theater view must reveal acts and choices cinematically");
assert.match(theater, /\.transition\(/, "native theater view must animate act transitions");

assert.match(constellation, /BenyuanDeepCelestialBody/, "native constellation view must use the shared dynamic celestial body");
assert.match(constellation, /mode:\s*\.constellationMoon/, "native constellation view must use the constellation moon body");
assert.doesNotMatch(constellation, /BenyuanBlackMoonMark\(size:\s*156/, "native constellation archetype should not use the old flat moon mark");
assert.match(constellation, /BenyuanDimensionOrbitMap/, "native constellation view must include a dynamic dimension orbit map");
assert.match(constellation, /TimelineView\(\.animation/, "native constellation orbit map must be animation-driven");
assert.match(constellation, /sevenDimensions/, "native constellation orbit map must be driven by real dimension scores");
assert.match(constellation, /\.frame\(height:\s*336\)/, "native constellation seven-dimension orbit must be large enough to read as the primary graphic system");
assert.match(constellation, /BenyuanDimensionResonanceGraph/, "native constellation seven-dimension values must be rendered graphically instead of as percent data cards");
assert.doesNotMatch(constellation, /Text\("\\\(dimension\.score\)%"\)/, "native constellation seven-dimension section must not fall back to raw percent cards");
assert.match(constellation, /private func dimensionReadingText/, "native constellation must expand the selected dimension into a richer personal reading");
assert.match(constellation, /safeAreaInset\(edge:\s*\.bottom\)/, "native constellation final actions must reserve bottom safe-area space instead of covering the orbit map");
assert.match(constellation, /bottomDockHeight:\s*116/, "native constellation scroll content must reserve explicit bottom dock clearance");
assert.match(constellation, /firstViewportReserve:\s*96/, "native constellation first viewport must avoid the old oversized blank gap before the seven-dimension orbit");
assert.match(constellation, /topMaskHeight:\s*52/, "native constellation scroll content must reserve a stable top viewport buffer below the progress rail");
assert.match(constellation, /safeAreaInset\(edge:\s*\.top,\s*spacing:\s*0\)/, "native constellation scroll content must use a top inset so scrolled sections do not collide with the progress rail");
assert.match(constellation, /constellationTopScrollMask/, "native constellation top inset should use a deep-field fade instead of a hard blank gap");
assert.match(constellation, /frame\(height:\s*layoutBudget\.topMaskHeight\)/, "native constellation top inset must use the measured top reserve token");
assert.match(constellation, /bottomContentReserve:\s*292/, "native constellation ending must keep enough scroll reserve so final text is not hidden behind the dock");
assert.match(constellation, /bottomDockHeight \+ bottomContentReserve \+ safeAreaBottom/, "native constellation bottom padding must include actual device safe-area inset");
assert.match(constellation, /finalDock[\s\S]*?\.frame\(height:\s*layoutBudget\.bottomDockHeight \+ geometry\.safeAreaInsets\.bottom\)/, "native constellation final dock must have stable measured height for screenshot parity");
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
assert.match(constellation, /TimelineView\(\.animation\(minimumInterval:\s*1\.0\s*\/\s*30\.0\)/, "native constellation final dock must have subtle real-time motion");
assert.match(constellation, /\.fill\(BenyuanColor\.bgVoid\)/, "native constellation final dock must use an opaque deep-field mask so orbit labels do not bleed through action buttons");

console.log("ios-celestial-ui-contract:ok");
