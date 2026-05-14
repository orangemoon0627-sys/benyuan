#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const assetsRoot = path.join(root, "mobile/benyuan_origin_ios_shell/Assets.xcassets");
const sourcesRoot = path.join(root, "output/celestial-source-backups");

const requiredAssets = [
  "BenyuanCelestialFarTideMoon",
  "BenyuanCelestialStarMapArchitect",
  "BenyuanCelestialMoonHarbor",
  "BenyuanCelestialExistentialNomad",
  "BenyuanCelestialRainWindowScribe",
  "BenyuanCelestialEventHorizonDiver",
  "BenyuanCelestialNebulaWeaver",
  "BenyuanCelestialSolarCorona",
  "BenyuanCelestialTerrestrialPlanet",
  "BenyuanCelestialDeepSpaceAnchor",
];

const layers = [
  { suffix: "Backdrop", filename: "celestial-backdrop.png" },
  { suffix: "", filename: "celestial.png" },
  { suffix: "Core", filename: "celestial-core.png" },
  { suffix: "Glow", filename: "celestial-glow.png" },
  { suffix: "Particles", filename: "celestial-particles.png" },
];

const spatialProfiles = {
  BenyuanCelestialFarTideMoon: { cx: 0.50, cy: 0.52, rx: 0.44, ry: 0.34, floor: 0.48 },
  BenyuanCelestialStarMapArchitect: { cx: 0.50, cy: 0.50, rx: 0.42, ry: 0.42, floor: 0.44 },
  BenyuanCelestialMoonHarbor: { cx: 0.52, cy: 0.50, rx: 0.44, ry: 0.36, floor: 0.48 },
  BenyuanCelestialExistentialNomad: { cx: 0.54, cy: 0.54, rx: 0.54, ry: 0.32, floor: 0.28 },
  BenyuanCelestialRainWindowScribe: { cx: 0.50, cy: 0.50, rx: 0.42, ry: 0.48, floor: 0.40 },
  BenyuanCelestialEventHorizonDiver: { cx: 0.50, cy: 0.52, rx: 0.50, ry: 0.30, floor: 0.58 },
  BenyuanCelestialNebulaWeaver: { cx: 0.50, cy: 0.50, rx: 0.50, ry: 0.42, floor: 0.30 },
  BenyuanCelestialSolarCorona: { cx: 0.50, cy: 0.50, rx: 0.42, ry: 0.42, floor: 0.56 },
  BenyuanCelestialTerrestrialPlanet: { cx: 0.54, cy: 0.52, rx: 0.38, ry: 0.38, floor: 0.58 },
  BenyuanCelestialDeepSpaceAnchor: { cx: 0.50, cy: 0.50, rx: 0.44, ry: 0.44, floor: 0.42 },
};

const featureProfiles = {
  BenyuanCelestialFarTideMoon: { proximityBlur: 5, threshold: 0.14, gain: 1.20 },
  BenyuanCelestialStarMapArchitect: { proximityBlur: 4, threshold: 0.11, gain: 1.28 },
  BenyuanCelestialMoonHarbor: { proximityBlur: 5, threshold: 0.13, gain: 1.20 },
  BenyuanCelestialExistentialNomad: { proximityBlur: 5, threshold: 0.16, gain: 1.14 },
  BenyuanCelestialRainWindowScribe: { proximityBlur: 4, threshold: 0.11, gain: 1.22 },
  BenyuanCelestialEventHorizonDiver: { proximityBlur: 5, threshold: 0.12, gain: 1.30 },
  BenyuanCelestialNebulaWeaver: { proximityBlur: 6, threshold: 0.13, gain: 1.24 },
  BenyuanCelestialSolarCorona: { proximityBlur: 4, threshold: 0.10, gain: 1.34 },
  BenyuanCelestialTerrestrialPlanet: { proximityBlur: 5, threshold: 0.15, gain: 1.18 },
  BenyuanCelestialDeepSpaceAnchor: { proximityBlur: 4, threshold: 0.11, gain: 1.30 },
};

const baseProfiles = {
  BenyuanCelestialFarTideMoon: { mode: "hybrid", featureGain: 1.20, darkMatter: 0.00, spatialPreserve: 0.00, proximityPreserve: 0.46, proximityBlur: 28 },
  BenyuanCelestialStarMapArchitect: { mode: "luminous", featureGain: 1.34, proximityBlur: 14 },
  BenyuanCelestialMoonHarbor: { mode: "hybrid", featureGain: 1.18, darkMatter: 0.00, spatialPreserve: 0.00, proximityPreserve: 0.46, proximityBlur: 30 },
  BenyuanCelestialExistentialNomad: { mode: "luminous", featureGain: 1.42, proximityBlur: 20 },
  BenyuanCelestialRainWindowScribe: { mode: "luminous", featureGain: 1.36, proximityBlur: 16 },
  BenyuanCelestialEventHorizonDiver: { mode: "hybrid", featureGain: 1.40, darkMatter: 0.82, spatialPreserve: 0.00, proximityPreserve: 0.48, proximityBlur: 34 },
  BenyuanCelestialNebulaWeaver: { mode: "luminous", featureGain: 1.38, proximityBlur: 22 },
  BenyuanCelestialSolarCorona: { mode: "hybrid", featureGain: 1.48, darkMatter: 0.58, spatialPreserve: 0.00, proximityPreserve: 0.42, proximityBlur: 22 },
  BenyuanCelestialTerrestrialPlanet: { mode: "hybrid", featureGain: 1.18, darkMatter: 0.74, spatialPreserve: 0.00, proximityPreserve: 0.48, proximityBlur: 38 },
  BenyuanCelestialDeepSpaceAnchor: { mode: "luminous", featureGain: 1.38, proximityBlur: 16 },
};

const darkCoreProfiles = {
  BenyuanCelestialEventHorizonDiver: { cx: 0.50, cy: 0.49, rx: 0.18, ry: 0.14, floor: 1.0 },
  BenyuanCelestialSolarCorona: { cx: 0.50, cy: 0.50, rx: 0.34, ry: 0.34, floor: 1.0 },
  BenyuanCelestialTerrestrialPlanet: { cx: 0.54, cy: 0.52, rx: 0.39, ry: 0.39, floor: 1.0 },
};

const backdropProfiles = {
  BenyuanCelestialFarTideMoon: { low: 10, high: 58, darkPreserve: 0.10, gain: 1.08 },
  BenyuanCelestialStarMapArchitect: { low: 18, high: 70, darkPreserve: 0.00, gain: 1.18 },
  BenyuanCelestialMoonHarbor: { low: 10, high: 56, darkPreserve: 0.12, gain: 1.08 },
  BenyuanCelestialExistentialNomad: { low: 16, high: 66, darkPreserve: 0.00, gain: 1.18 },
  BenyuanCelestialRainWindowScribe: { low: 14, high: 62, darkPreserve: 0.03, gain: 1.12 },
  BenyuanCelestialEventHorizonDiver: { low: 18, high: 68, darkPreserve: 0.00, gain: 1.24 },
  BenyuanCelestialNebulaWeaver: { low: 16, high: 64, darkPreserve: 0.00, gain: 1.20 },
  BenyuanCelestialSolarCorona: { low: 14, high: 58, darkPreserve: 0.05, gain: 1.22 },
  BenyuanCelestialTerrestrialPlanet: { low: 9, high: 48, darkPreserve: 0.16, gain: 1.05 },
  BenyuanCelestialDeepSpaceAnchor: { low: 16, high: 66, darkPreserve: 0.00, gain: 1.18 },
};

function contentsJson(filename) {
  return `${JSON.stringify(
    {
      images: [
        {
          filename,
          idiom: "universal",
          scale: "1x",
        },
        {
          idiom: "universal",
          scale: "2x",
        },
        {
          idiom: "universal",
          scale: "3x",
        },
      ],
      info: {
        author: "xcode",
        version: 1,
      },
    },
    null,
    2,
  )}\n`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

async function readSource(assetName) {
  const sourcePath = path.join(sourcesRoot, `${assetName}.source.png`);
  const source = sharp(sourcePath).ensureAlpha().resize(1024, 1024, { fit: "cover" });
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024, `${assetName} source width must be 1024`);
  assert.equal(info.height, 1024, `${assetName} source height must be 1024`);
  assert.equal(info.channels, 4, `${assetName} source must be converted to RGBA`);
  return { data, info };
}

function analyzePixels(data, width, height) {
  const luminance = new Uint8Array(width * height);
  let edgeR = 0;
  let edgeG = 0;
  let edgeB = 0;
  let edgeCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      luminance[index] = clamp(Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b), 0, 255);

      if (x < 48 || x >= width - 48 || y < 48 || y >= height - 48) {
        edgeR += r;
        edgeG += g;
        edgeB += b;
        edgeCount += 1;
      }
    }
  }

  return {
    luminance,
    edgeColor: {
      r: edgeR / edgeCount,
      g: edgeG / edgeCount,
      b: edgeB / edgeCount,
    },
  };
}

function buildConnectedBackgroundMask(data, width, height, edgeColor, protectionAlpha) {
  const background = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackgroundCandidate(index) {
    if (protectionAlpha && protectionAlpha[index] > 192) return false;

    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const dr = Math.abs(r - edgeColor.r);
    const dg = Math.abs(g - edgeColor.g);
    const db = Math.abs(b - edgeColor.b);
    const colorDistance = Math.hypot(dr, dg, db);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luma < 7 || (luma < 30 && colorDistance < 34);
  }

  function enqueue(index) {
    if (visited[index] || !isBackgroundCandidate(index)) return;
    visited[index] = 1;
    background[index] = 1;
    queue.push(index);
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const index = queue[head];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  return background;
}

async function buildSubjectAlpha(data, width, height, edgeColor, backgroundMask, luminance) {
  const brightSeed = new Uint8Array(width * height);
  for (let index = 0; index < brightSeed.length; index += 1) {
    const offset = index * 4;
    const dr = Math.abs(data[offset] - edgeColor.r);
    const dg = Math.abs(data[offset + 1] - edgeColor.g);
    const db = Math.abs(data[offset + 2] - edgeColor.b);
    const colorDistance = Math.hypot(dr, dg, db);
    const luma = luminance[index];
    brightSeed[index] = backgroundMask[index]
      ? 0
      : clamp(Math.round(Math.max((luma - 18) * 3.0, (colorDistance - 42) * 1.9)), 0, 255);
  }

  const subjectProximity = await blurAlpha(brightSeed, width, height, 18);
  const alpha = new Uint8Array(width * height);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  const maxRadius = Math.hypot(centerX, centerY);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const dr = Math.abs(data[offset] - edgeColor.r);
      const dg = Math.abs(data[offset + 1] - edgeColor.g);
      const db = Math.abs(data[offset + 2] - edgeColor.b);
      const colorDistance = Math.hypot(dr, dg, db);
      const luma = luminance[index];
      const centerFalloff = 1 - Math.hypot(x - centerX, y - centerY) / maxRadius;
      const proximity = subjectProximity[index] / 255;
      const enclosedDarkMatter = !backgroundMask[index] && proximity > 0.13 ? 0.56 * proximity : 0;
      const subjectScore = Math.max(colorDistance / 84, luma / 110, enclosedDarkMatter, centerFalloff * 0.04);

      alpha[index] = backgroundMask[index] ? 0 : clamp(Math.round((subjectScore - 0.08) * 255), 0, 255);
    }
  }

  return alpha;
}

function buildSpatialAlpha(width, height, profile) {
  const alpha = new Uint8Array(width * height);
  const cx = profile.cx * (width - 1);
  const cy = profile.cy * (height - 1);
  const rx = profile.rx * width;
  const ry = profile.ry * height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const distance = Math.hypot(nx, ny);
      const mask = 1 - smoothstep(0.82, 1.18, distance);
      alpha[index] = clamp(Math.round(mask * 255), 0, 255);
    }
  }

  return alpha;
}

function compositeLayer(data, alpha, tint, options = {}) {
  const output = Buffer.alloc(data.length);
  for (let index = 0; index < alpha.length; index += 1) {
    const offset = index * 4;
    const a = alpha[index];
    const alphaRatio = Math.max(a / 255, 0.001);
    const alphaCompensation = options.unpremultiply ? Math.min(2.8, 1 / alphaRatio) : 1;
    let r = tint ? data[offset] * tint.r * alphaCompensation : data[offset] * alphaCompensation;
    let g = tint ? data[offset + 1] * tint.g * alphaCompensation : data[offset + 1] * alphaCompensation;
    let b = tint ? data[offset + 2] * tint.b * alphaCompensation : data[offset + 2] * alphaCompensation;

    if (options.subjectClarity) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      const clarity = smoothstep(28, 172, luma) * (a / 255);
      const contrast = 1 + 0.24 * clarity;
      const pivot = 38;
      r = (r - pivot) * contrast + pivot;
      g = (g - pivot) * contrast + pivot;
      b = (b - pivot) * contrast + pivot;

      const warmMetal = smoothstep(6, 56, (r + g) * 0.5 - b) * smoothstep(36, 176, luma) * (a / 255);
      const silverMetal = (1 - smoothstep(20, 84, spread)) * smoothstep(72, 214, luma) * (a / 255);
      r += warmMetal * 22 + silverMetal * 10;
      g += warmMetal * 15 + silverMetal * 10;
      b += silverMetal * 14 - warmMetal * 4;
    }

    output[offset] = clamp(Math.round(r), 0, 255);
    output[offset + 1] = clamp(Math.round(g), 0, 255);
    output[offset + 2] = clamp(Math.round(b), 0, 255);
    output[offset + 3] = a;
  }
  return output;
}

async function buildScreenBackdrop(data, backgroundMask, luminance, info, assetName, subjectExclusionAlpha) {
  const profile = featureProfiles[assetName];
  const subjectExclusion = await blurAlpha(subjectExclusionAlpha, info.width, info.height, 4.5);
  const featureSeed = new Uint8Array(info.width * info.height);
  for (let index = 0; index < featureSeed.length; index += 1) {
    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const channelSpread = Math.max(r, g, b) - Math.min(r, g, b);
    const luma = luminance[index];
    featureSeed[index] = clamp(Math.round(Math.max((luma - 22) * 3.2, (channelSpread - 8) * 3.8, 0)), 0, 255);
  }
  const featureProximity = await blurAlpha(featureSeed, info.width, info.height, profile.proximityBlur + 8);
  const output = Buffer.from(data);
  for (let index = 0; index < backgroundMask.length; index += 1) {
    const offset = index * 4;
    const luma = luminance[index];
    const feature = featureSeed[index] / 255;
    const proximity = featureProximity[index] / 255;
    const subject = Math.max(subjectExclusionAlpha[index] / 255, subjectExclusion[index] / 255);
    const subjectCutout = smoothstep(0.035, 0.22, subject);
    const keepSignal = Math.max(feature, proximity * 0.42);
    const alpha = luma > 118
      ? Math.max(keepSignal, 0.72)
      : keepSignal;
    output[offset] = data[offset];
    output[offset + 1] = data[offset + 1];
    output[offset + 2] = data[offset + 2];
    output[offset + 3] = clamp(Math.round(alpha * (1 - subjectCutout) * 255), 0, 255);
  }
  return output;
}

async function buildReferenceFeatureAlpha(data, info, edgeColor, backgroundMask, luminance, subjectAlpha, assetName) {
  const profile = featureProfiles[assetName];
  const featureSeed = new Uint8Array(info.width * info.height);

  for (let index = 0; index < featureSeed.length; index += 1) {
    if (backgroundMask[index]) {
      featureSeed[index] = 0;
      continue;
    }

    const offset = index * 4;
    const dr = Math.abs(data[offset] - edgeColor.r);
    const dg = Math.abs(data[offset + 1] - edgeColor.g);
    const db = Math.abs(data[offset + 2] - edgeColor.b);
    const colorDistance = Math.hypot(dr, dg, db);
    const channelSpread = Math.max(data[offset], data[offset + 1], data[offset + 2]) - Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const luma = luminance[index];
    const brightDetail = Math.max((luma - 22) * 4.2, (colorDistance - 46) * 1.9, (channelSpread - 10) * 4.8, 0);
    featureSeed[index] = clamp(Math.round(brightDetail), 0, 255);
  }

  const featureProximity = await blurAlpha(featureSeed, info.width, info.height, profile.proximityBlur);
  const alpha = new Uint8Array(info.width * info.height);

  for (let index = 0; index < alpha.length; index += 1) {
    if (backgroundMask[index]) {
      alpha[index] = 0;
      continue;
    }

    const feature = featureSeed[index] / 255;
    const proximity = featureProximity[index] / 255;
    const subject = subjectAlpha[index] / 255;
    const signal = Math.max(feature, proximity * 0.42, feature * subject * 1.10);
    alpha[index] = clamp(Math.round(((signal - profile.threshold) / (1 - profile.threshold)) * 255 * profile.gain), 0, 255);
  }

  return await blurAlpha(alpha, info.width, info.height, 0.45);
}

async function buildV5ReferenceAlpha(data, info, edgeColor, backgroundMask, luminance, subjectAlpha, spatialAlpha, assetName) {
  const profile = baseProfiles[assetName];
  const darkCoreAlpha = darkCoreProfiles[assetName]
    ? buildSpatialAlpha(info.width, info.height, darkCoreProfiles[assetName])
    : null;
  const featureAlpha = await buildReferenceFeatureAlpha(
    data,
    info,
    edgeColor,
    backgroundMask,
    luminance,
    subjectAlpha,
    assetName,
  );
  const haloAlpha = await blurAlpha(featureAlpha, info.width, info.height, profile.proximityBlur ?? 18);

  if (profile.mode === "luminous") {
    const alpha = new Uint8Array(info.width * info.height);
    for (let index = 0; index < alpha.length; index += 1) {
      if (backgroundMask[index]) {
        alpha[index] = 0;
        continue;
      }

      const feature = featureAlpha[index] * profile.featureGain;
      const halo = haloAlpha[index] * 0.46;
      const subject = subjectAlpha[index] * 0.72;
      const spatial = spatialAlpha[index] * Math.max(haloAlpha[index] / 255, featureAlpha[index] / 255, 0.08) * 0.36;
      alpha[index] = clamp(Math.round(Math.max(feature, halo, subject, spatial)), 0, 255);
    }
    return await blurAlpha(alpha, info.width, info.height, 0.35);
  }

  const alpha = new Uint8Array(info.width * info.height);
  for (let index = 0; index < alpha.length; index += 1) {
    if (backgroundMask[index]) {
      alpha[index] = 0;
      continue;
    }

    const feature = clamp(featureAlpha[index] * profile.featureGain, 0, 255);
    const subject = subjectAlpha[index] / 255;
    const spatial = spatialAlpha[index] / 255;
    const darkCore = darkCoreAlpha ? darkCoreAlpha[index] / 255 : 0;
    const halo = haloAlpha[index] / 255;
    const featureEnvelope = smoothstep(0.06, 0.46, halo);
    const darkCoreEnvelope = smoothstep(0.70, 0.96, darkCore) * smoothstep(0.12, 0.36, subject + halo * 0.82 + darkCore * 0.20);
    const protectedInterior = Math.max(
      darkCoreEnvelope * 0.92,
      subject * profile.proximityPreserve,
      spatial * profile.spatialPreserve * featureEnvelope,
      halo * profile.proximityPreserve,
    );
    const darkMatter = protectedInterior * 255 * profile.darkMatter;
    alpha[index] = clamp(Math.round(Math.max(feature, darkMatter)), 0, 255);
  }

  return await blurAlpha(alpha, info.width, info.height, 0.3);
}

async function blurAlpha(alpha, width, height, sigma) {
  const { data, info } = await sharp(Buffer.from(alpha), {
    raw: { width, height, channels: 1 },
  })
    .blur(sigma)
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels === 1) {
    return new Uint8Array(data);
  }

  const output = new Uint8Array(width * height);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = data[index * info.channels];
  }
  return output;
}

async function writePngFromRaw(buffer, info, targetPath) {
  await sharp(buffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(targetPath);
}

async function writeLayer(assetName, suffix, filename, buffer, info) {
  const imageset = path.join(assetsRoot, `${assetName}${suffix}.imageset`);
  await mkdir(imageset, { recursive: true });
  await writePngFromRaw(buffer, info, path.join(imageset, filename));
  await writeFile(path.join(imageset, "Contents.json"), contentsJson(filename));
}

async function buildAsset(assetName) {
  const { data, info } = await readSource(assetName);
  const { luminance, edgeColor } = analyzePixels(data, info.width, info.height);
  const spatialAlpha = buildSpatialAlpha(info.width, info.height, spatialProfiles[assetName]);
  const backgroundMask = buildConnectedBackgroundMask(data, info.width, info.height, edgeColor, spatialAlpha);
  const subjectAlpha = await buildSubjectAlpha(data, info.width, info.height, edgeColor, backgroundMask, luminance);
  const coreSeed = new Uint8Array(info.width * info.height);
  for (let index = 0; index < coreSeed.length; index += 1) {
    const spatial = spatialAlpha[index] / 255;
    const subject = subjectAlpha[index] / 255;
    const floor = spatialProfiles[assetName].floor * spatial;
    coreSeed[index] = clamp(Math.round(Math.max(subject, floor) * 255), 0, 255);
  }
  const coreAlpha = await blurAlpha(coreSeed, info.width, info.height, 0.8);
  const baseAlpha = await buildV5ReferenceAlpha(data, info, edgeColor, backgroundMask, luminance, subjectAlpha, spatialAlpha, assetName);
  const baseSubjectCut = await blurAlpha(baseAlpha, info.width, info.height, 3.2);
  const baseSubjectHalo = await blurAlpha(baseAlpha, info.width, info.height, 16);
  const glowSeed = new Uint8Array(info.width * info.height);
  const particleSeed = new Uint8Array(info.width * info.height);

  for (let index = 0; index < luminance.length; index += 1) {
    const offset = index * 4;
    const luma = luminance[index];
    const channelSpread = Math.max(data[offset], data[offset + 1], data[offset + 2]) - Math.min(data[offset], data[offset + 1], data[offset + 2]);
    const baseSubject = Math.max(baseAlpha[index] / 255, baseSubjectCut[index] / 255);
    const subjectCutout = smoothstep(0.035, 0.22, baseSubject);
    const outsideSubject = 1 - subjectCutout;
    const outerHalo = Math.max(0, baseSubjectHalo[index] / 255 - baseAlpha[index] / 255);
    const spatial = spatialAlpha[index] / 255;
    const glowSignal = Math.max(
      (luma - 44) * 1.5 * outsideSubject,
      (channelSpread - 18) * 2.4 * outsideSubject,
      outerHalo * 128,
    );
    const particleSignal = Math.max(
      (luma - 136) * 3.0 * outsideSubject,
      (channelSpread - 48) * 2.2 * outsideSubject,
    ) * Math.max(0.26, spatial);
    glowSeed[index] = backgroundMask[index] ? 0 : clamp(Math.round(glowSignal), 0, 210);
    particleSeed[index] = backgroundMask[index] ? 0 : clamp(Math.round(particleSignal), 0, 255);
  }

  const glowAlpha = await blurAlpha(glowSeed, info.width, info.height, 5.5);
  const particleAlpha = await blurAlpha(particleSeed, info.width, info.height, 0.72);

  const base = compositeLayer(data, baseAlpha, null, { unpremultiply: true, subjectClarity: true });

  const core = compositeLayer(data, coreAlpha);
  const glow = compositeLayer(data, glowAlpha, { r: 1.16, g: 1.14, b: 1.18 });
  const particles = compositeLayer(data, particleAlpha, { r: 1.28, g: 1.22, b: 1.08 });

  await writeLayer(assetName, "Backdrop", "celestial-backdrop.png", await buildScreenBackdrop(data, backgroundMask, luminance, info, assetName, baseAlpha), info);
  await writeLayer(assetName, "", "celestial.png", base, info);
  await writeLayer(assetName, "Core", "celestial-core.png", core, info);
  await writeLayer(assetName, "Glow", "celestial-glow.png", glow, info);
  await writeLayer(assetName, "Particles", "celestial-particles.png", particles, info);
}

for (const assetName of requiredAssets) {
  await buildAsset(assetName);
}

console.log(`benyuan-ios-celestial-layer-assets:ok ${requiredAssets.length} assets x ${layers.length} layers`);
