#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const assetsRoot = path.join(root, "mobile/benyuan_origin_ios_shell/Assets.xcassets");
const backdrop = readFileSync(path.join(root, "mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellBackdrop.swift"), "utf8");
const docs = readFileSync(path.join(root, "docs/benyuan-native-celestial-assets.md"), "utf8");
const previewSummaryPath = path.join(root, "output/benyuan-ios-native-preview-screenshots.json");
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const requiredAssets = [
  ["远潮观月者", "BenyuanCelestialFarTideMoon", "moonlit-seeker"],
  ["星图筑序者", "BenyuanCelestialStarMapArchitect", "star-map-architect"],
  ["月港栖岸者", "BenyuanCelestialMoonHarbor", "moon-harbor-keeper"],
  ["存在游牧者", "BenyuanCelestialExistentialNomad", "existential-nomad"],
  ["雨窗抒写者", "BenyuanCelestialRainWindowScribe", "rain-window-scribe"],
  ["事件视界沉潜者", "BenyuanCelestialEventHorizonDiver", "event-horizon-diver"],
  ["星云织梦者", "BenyuanCelestialNebulaWeaver", "nebula-weaver"],
  ["日冕引燃者", "BenyuanCelestialSolarCorona", "solar-corona"],
  ["类地栖居者", "BenyuanCelestialTerrestrialPlanet", "terrestrial-planet"],
  ["深空锚定者", "BenyuanCelestialDeepSpaceAnchor", "deep-space-anchor"],
];

const requiredLayerFiles = [
  ["Backdrop", "celestial-backdrop.png"],
  ["", "celestial.png"],
  ["Core", "celestial-core.png"],
  ["Glow", "celestial-glow.png"],
  ["Particles", "celestial-particles.png"],
];

function readPngMetadata(filePath, label) {
  const imageBytes = readFileSync(filePath);
  assert.ok(imageBytes.subarray(0, 8).equals(pngSignature), `installed asset must be a PNG for ${label}: ${filePath}`);
  const width = imageBytes.readUInt32BE(16);
  const height = imageBytes.readUInt32BE(20);
  const colorType = imageBytes[25];
  return { width, height, colorType };
}

assert.match(docs, /source-backed/i, "asset docs must explicitly describe the source-backed layered raster pipeline");
assert.match(docs, /celestial-backdrop\.png/, "asset docs must describe the transparent signal backdrop layer");
assert.match(docs, /禁止保留完整 V5 暗底或第二个完整主体/, "asset docs must forbid full-reference backdrop duplication");
assert.match(docs, /celestial-core\.png/, "asset docs must describe the core layer");
assert.match(docs, /celestial-glow\.png/, "asset docs must describe the glow layer");
assert.match(docs, /celestial-particles\.png/, "asset docs must describe the particles layer");
assert.match(docs, /不要把黑洞核心、深空暗面、星体阴影扣掉/, "asset docs must preserve dark celestial interiors during layer extraction");

assert.match(backdrop, /enum BenyuanCelestialAssetCatalog/, "SwiftUI must expose a local celestial asset catalog");
assert.match(backdrop, /BenyuanCelestialAssetCatalog\.isAvailable\(assetName\)/, "celestial body must prefer local raster assets when installed");
assert.match(backdrop, /BenyuanReferenceCelestialBackdrop/, "celestial body may use only a transparent signal backdrop behind the full-strength subject");
assert.match(backdrop, /BenyuanLocalCelestialAssetCore/, "celestial body must have a lightweight local asset renderer");
assert.match(backdrop, /else\s*\{[\s\S]*?BenyuanSpectralParticleField/, "missing assets must fall back to procedural SwiftUI visuals");
assert.match(backdrop, /var usesReferenceArtworkRender:\s*Bool/, "official celestial labels must use reference artwork as the high-fidelity visual base");

for (const [label, assetName, variant] of requiredAssets) {
  const sourcePath = path.join(root, "output/celestial-source-backups", `${assetName}.source.png`);
  assert.ok(existsSync(sourcePath), `missing source-backed reference PNG for ${label}: ${sourcePath}`);

  for (const [assetSuffix, filename] of requiredLayerFiles) {
    const layerAssetName = `${assetName}${assetSuffix}`;
    const imageset = path.join(assetsRoot, `${layerAssetName}.imageset`);
    const contentsPath = path.join(imageset, "Contents.json");
    const layerPath = path.join(imageset, filename);
    assert.ok(existsSync(imageset), `missing iOS imageset for ${label}: ${layerAssetName}`);
    assert.ok(existsSync(contentsPath), `missing Contents.json for ${layerAssetName}`);
    assert.ok(existsSync(layerPath), `missing layered raster asset for ${label}: ${layerPath}`);

    const contents = JSON.parse(readFileSync(contentsPath, "utf8"));
    assert.ok(
      contents.images?.some((item) => item.filename === filename && item.idiom === "universal" && item.scale === "1x"),
      `Contents.json must reference ${filename} as a 1x universal asset for ${label}`,
    );

    const { width, height, colorType } = readPngMetadata(layerPath, `${label} ${filename}`);
    assert.equal(width, 1024, `installed PNG width must be 1024 for ${label} ${filename}`);
    assert.equal(height, 1024, `installed PNG height must be 1024 for ${label} ${filename}`);
    assert.ok([4, 6].includes(colorType), `installed PNG must carry alpha transparency for ${label} ${filename}`);
  }

  assert.match(backdrop, new RegExp(`case \\.\\w+: return "${assetName}"`), `Swift mapping must include ${assetName}`);
  assert.ok(docs.includes(`| ${label} | \`${assetName}\``), `asset docs must map ${label} to ${assetName}`);
  assert.ok(docs.includes(`- \`${assetName}\``), `asset docs must include Image2 prompt addendum for ${assetName}`);
  assert.match(docs, /Avoid: generic glowing orb with simple rings/, "asset docs must forbid generic ring-orb sameness");

  if (existsSync(previewSummaryPath)) {
    const summary = JSON.parse(readFileSync(previewSummaryPath, "utf8"));
    const run = (summary.archetypeRuns ?? []).find((item) => item.variant === variant);
    assert.ok(run, `latest native preview summary must include archetypeRuns entry for ${variant}`);
    for (const key of ["screenshotPath", "stableScreenshotPath", "presentationScreenshotPath"]) {
      assert.ok(existsSync(run[key]), `native preview ${variant} missing ${key}: ${run[key]}`);
    }
    assert.equal(run.showsShellError, false, `native preview ${variant} must not show shell error`);
  }
}

console.log("ios-celestial-assets-contract:ok");
