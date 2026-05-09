import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const backdrop = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellBackdrop.swift", "utf8");
const primitives = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift", "utf8");
const auth = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAuthView.swift", "utf8");
const collect = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift", "utf8");
const processing = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift", "utf8");
const theater = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift", "utf8");
const constellation = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift", "utf8");

assert.match(backdrop, /struct BenyuanDeepCelestialBody/, "iOS shell must expose a shared deep celestial body component");
assert.match(backdrop, /TimelineView\(\.animation/, "deep celestial body must be animation-driven");
assert.match(backdrop, /BenyuanAccretionRing/, "deep celestial body must include a richer accretion ring");
assert.match(backdrop, /BenyuanSpectralParticleField/, "deep celestial body must include subtle spectral particles");
assert.match(backdrop, /struct BenyuanEventHorizon/, "deep celestial body must include a dedicated event horizon core");
assert.match(backdrop, /struct BenyuanGravitationalLens/, "deep celestial body must include a gravitational lensing layer");
assert.match(backdrop, /struct BenyuanOrbitalDustBand/, "deep celestial body must include orbital dust bands for real depth");
assert.match(backdrop, /struct BenyuanLivingDistantMoon/, "shell backdrop must use an animated distant moon instead of a static circle");
assert.match(backdrop, /RadialGradient/, "deep celestial body must use radial shading for depth");
assert.match(backdrop, /AngularGradient/, "deep celestial body must use angular shading for dimensional texture");
assert.match(backdrop, /BlendMode\.screen/, "deep celestial light must use screen blending for luminous depth");

assert.match(primitives, /struct BenyuanRevealedStack/, "native flow must expose a staged reveal stack for entrance motion");
assert.match(primitives, /struct BenyuanQuestionSignalField/, "native flow must expose a question signal field for Part 1 motion");
assert.match(primitives, /struct BenyuanStageLens/, "native flow must expose a theater stage lens for scene motion");
assert.match(primitives, /TimelineView\(\.animation/, "native motion primitives must be animation-driven");

assert.match(auth, /BenyuanRevealedStack/, "native auth view must use staged entrance motion");
assert.match(auth, /BenyuanDeepCelestialBody/, "native auth view must use the shared dynamic moon field");
assert.match(auth, /\.foregroundStyle\(BenyuanColor\.bgVoid\)/, "native Apple login label must use dark text on its light capsule");
assert.match(auth, /\.opacity\(0\.001\)/, "native Apple system button overlay must be visually hidden enough to avoid duplicate white text");

assert.match(collect, /BenyuanQuestionSignalField/, "native collect view must include per-question signal motion");
assert.match(collect, /BenyuanRevealedStack/, "native collect view must stagger question and option reveal");
assert.match(collect, /\.id\(model\.activeQuestionIndex\)/, "native collect view must reset reveal motion on question changes");
assert.match(collect, /uploadHeader/, "native upload question must use a compact upload-specific header");
assert.match(collect, /uploadThumbnailStrip/, "native upload question must expose thumbnails as a first-screen manageable strip");
assert.match(collect, /collectBottomSafeSpace/, "native collect scroll content must reserve explicit bottom navigation clearance");

assert.match(processing, /BenyuanDeepCelestialBody/, "native processing view must use the shared dynamic celestial body");
assert.doesNotMatch(processing, /BenyuanBlackMoonMark\(size:\s*168/, "native processing view should not use the old flat moon mark as its hero visual");
assert.match(processing, /processingProgress/, "native processing view must keep the real progress signal");

assert.match(theater, /BenyuanStageLens/, "native theater view must include stage lens motion");
assert.match(theater, /BenyuanRevealedStack/, "native theater view must reveal acts and choices cinematically");
assert.match(theater, /\.transition\(/, "native theater view must animate act transitions");

assert.match(constellation, /BenyuanDeepCelestialBody/, "native constellation view must use the shared dynamic celestial body");
assert.doesNotMatch(constellation, /BenyuanBlackMoonMark\(size:\s*156/, "native constellation archetype should not use the old flat moon mark");
assert.match(constellation, /BenyuanDimensionOrbitMap/, "native constellation view must include a dynamic dimension orbit map");
assert.match(constellation, /TimelineView\(\.animation/, "native constellation orbit map must be animation-driven");
assert.match(constellation, /sevenDimensions/, "native constellation orbit map must be driven by real dimension scores");
assert.match(constellation, /safeAreaInset\(edge:\s*\.bottom\)/, "native constellation final actions must reserve bottom safe-area space instead of covering the orbit map");
assert.match(constellation, /constellationBottomDockHeight/, "native constellation scroll content must reserve explicit bottom dock clearance");
assert.match(constellation, /constellationFirstViewportReserve/, "native constellation first viewport must keep orbit content clear of the final dock");
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
