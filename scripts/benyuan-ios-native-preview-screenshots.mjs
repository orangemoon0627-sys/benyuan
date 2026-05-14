#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

import {
  chooseSimulatorDevice,
  extractInstalledSimulatorSdkVersion,
} from "./benyuan-ios-native-smoke-lib.mjs";

const root = process.cwd();
const shellProjectDir = path.join(root, "mobile", "benyuan_origin_ios_shell");
const projectPath = path.join(shellProjectDir, "BenyuanOriginShell.xcodeproj");
const scheme = "BenyuanOriginShell";
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? "Debug";
const desiredDeviceName = process.env.BENYUAN_SIM_DEVICE ?? "iPhone 17";
const baseUrl = process.env.BENYUAN_BASE_URL ?? "http://127.0.0.1:3015";
const outputDir = path.join(root, "output");
const debugPreviewDir = path.join(outputDir, "debug-previews");
const tempDir = path.join(os.tmpdir(), "benyuan-ios-native-preview");
const jsonPath = path.join(outputDir, "benyuan-ios-native-preview-screenshots.json");
const showsPreviewWatermark = process.env.BENYUAN_IOS_NATIVE_PREVIEW_WATERMARK === "1";
const suppressesTransientChrome = process.env.BENYUAN_IOS_NATIVE_PREVIEW_CLEAN_CHROME !== "0";
const previewRunStamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d{3}Z$/, "Z");
const previewGitRevision = (() => {
  try {
    const revision = run("git", ["rev-parse", "--short", "HEAD"], { cwd: root }) || "nogit";
    const status = run("git", ["status", "--short"], { cwd: root });
    return status ? `${revision}-dirty` : revision;
  } catch {
    return "nogit";
  }
})();

const previewConfigs = [
  { stage: "home", screenshotPath: path.join(outputDir, "benyuan-ios-preview-home.png"), waitMs: 7200, minMeanLuma: 10 },
  { stage: "auth", screenshotPath: path.join(outputDir, "benyuan-ios-preview-auth.png"), waitMs: 7200, minMeanLuma: 10 },
  { stage: "account", screenshotPath: path.join(outputDir, "benyuan-ios-preview-account.png"), waitMs: 3000 },
  { stage: "account-feedback", screenshotPath: path.join(outputDir, "benyuan-ios-preview-account-feedback.png"), waitMs: 3000 },
  { stage: "collect", screenshotPath: path.join(outputDir, "benyuan-ios-preview-collect.png"), waitMs: 3000 },
  { stage: "upload", screenshotPath: path.join(outputDir, "benyuan-ios-preview-upload.png"), waitMs: 3000 },
  { stage: "processing", screenshotPath: path.join(outputDir, "benyuan-ios-preview-processing.png"), waitMs: 2800 },
  { stage: "theater", screenshotPath: path.join(outputDir, "benyuan-ios-preview-theater.png"), waitMs: 3000 },
  { stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-constellation.png"), waitMs: 3200 },
  { stage: "constellation-end", screenshotPath: path.join(outputDir, "benyuan-ios-preview-constellation-end.png"), waitMs: 4600 },
];

const archetypePreviewConfigs = [
  { variant: "moonlit-seeker", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-moonlit-seeker.png"), waitMs: 3200 },
  { variant: "star-map-architect", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-star-map-architect.png"), waitMs: 3200 },
  { variant: "moon-harbor-keeper", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-moon-harbor-keeper.png"), waitMs: 3200 },
  { variant: "existential-nomad", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-existential-nomad.png"), waitMs: 3200 },
  { variant: "rain-window-scribe", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-rain-window-scribe.png"), waitMs: 3200 },
  { variant: "event-horizon-diver", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-event-horizon-diver.png"), waitMs: 3200 },
  { variant: "nebula-weaver", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-nebula-weaver.png"), waitMs: 3200 },
  { variant: "solar-corona", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-solar-corona.png"), waitMs: 3200 },
  { variant: "terrestrial-planet", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-terrestrial-planet.png"), waitMs: 3200 },
  { variant: "deep-space-anchor", stage: "constellation", screenshotPath: path.join(outputDir, "benyuan-ios-preview-archetype-deep-space-anchor.png"), waitMs: 3200 },
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function imageMeanLuma(filePath) {
  const { data, info } = await sharp(filePath)
    .removeAlpha()
    .resize(96, 192, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let total = 0;
  const pixelCount = info.width * info.height;
  for (let index = 0; index < data.length; index += info.channels) {
    total += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
  }
  return total / Math.max(pixelCount, 1);
}

function parseBuildSettings(raw) {
  const settings = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (!match) continue;
    settings[match[1]] = match[2].trim();
  }
  return settings;
}

function collectSimulatorEnvironment() {
  const sdkVersion = extractInstalledSimulatorSdkVersion(run("xcodebuild", ["-showsdks"]));
  const deviceList = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "-j"]));
  const device = chooseSimulatorDevice({
    desiredDeviceName,
    installedSimulatorSdkVersion: sdkVersion,
    devicesByRuntime: deviceList.devices,
  });

  if (!device) {
    const runtimes = Object.keys(deviceList.devices ?? {}).join(", ");
    throw new Error(`ios_simulator_unavailable: simulator sdk=${sdkVersion ?? "unknown"} runtimes=[${runtimes}]`);
  }

  return { sdkVersion, device };
}

function collectDestinations() {
  try {
    return run("xcodebuild", ["-project", projectPath, "-scheme", scheme, "-showdestinations"], { cwd: shellProjectDir });
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
    const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
    return [stdout, stderr].filter(Boolean).join("\n");
  }
}

function buildSimulatorApp(device) {
  const buildArgs = [
    "-project",
    projectPath,
    "-scheme",
    scheme,
    "-configuration",
    configuration,
    "-destination",
    `id=${device.udid}`,
  ];
  const settings = parseBuildSettings(run("xcodebuild", [...buildArgs, "-showBuildSettings"], { cwd: shellProjectDir }));
  run("xcodebuild", [...buildArgs, "CODE_SIGNING_ALLOWED=NO", "build"], { cwd: shellProjectDir });

  if (!settings.TARGET_BUILD_DIR || !settings.FULL_PRODUCT_NAME || !settings.PRODUCT_BUNDLE_IDENTIFIER) {
    throw new Error("ios_preview_build_settings_incomplete");
  }

  return {
    appPath: path.join(settings.TARGET_BUILD_DIR, settings.FULL_PRODUCT_NAME),
    bundleId: settings.PRODUCT_BUNDLE_IDENTIFIER,
  };
}

function terminateApp(udid, bundleId) {
  try {
    run("xcrun", ["simctl", "terminate", udid, bundleId]);
  } catch {}
}

async function capturePreview(device, bundleId, config) {
  terminateApp(device.udid, bundleId);
  const launchedAt = new Date().toISOString();
  const launchArgs = [
    "simctl",
    "launch",
    device.udid,
    bundleId,
    "--args",
    "--benyuan-base-url",
    baseUrl,
    "--benyuan-native-preview",
    config.stage,
    "--benyuan-native-preview-stamp",
    previewRunStamp,
    "--benyuan-native-preview-revision",
    previewGitRevision,
  ];
  if (!showsPreviewWatermark) {
    launchArgs.push("--benyuan-native-preview-no-watermark");
  }
  if (suppressesTransientChrome) {
    launchArgs.push("--benyuan-native-preview-clean");
  }
  if (config.variant) {
    launchArgs.push("--benyuan-native-preview-archetype", config.variant);
  }
  const launchOutput = run("xcrun", launchArgs);

  await sleep(config.waitMs);
  const stableBaseName = path.basename(config.screenshotPath, path.extname(config.screenshotPath));
  const tempScreenshotPath = path.join(
    tempDir,
    `${stableBaseName}-${config.variant ?? "stage"}-${previewRunStamp}.png`
  );
  run("xcrun", ["simctl", "io", device.udid, "screenshot", tempScreenshotPath]);
  const meanLuma = await imageMeanLuma(tempScreenshotPath);
  if (config.minMeanLuma != null && meanLuma < config.minMeanLuma) {
    throw new Error(`ios_native_preview_underexposed:${config.stage}:mean_luma=${meanLuma.toFixed(2)}`);
  }
  await copyFile(tempScreenshotPath, config.screenshotPath);
  const presentationScreenshotPath = path.join(
    debugPreviewDir,
    `benyuan-ios-preview-${config.variant ? `${config.stage}-${config.variant}` : config.stage}-${previewRunStamp}.png`
  );
  await copyFile(config.screenshotPath, presentationScreenshotPath);
  const screenshot = await readFile(config.screenshotPath);
  const screenshotText = screenshot.toString("latin1");
  const showsShellError =
    screenshotText.includes("The resource could not be loaded") ||
    screenshotText.includes("App Transport Security") ||
    screenshotText.includes("NSURLError") ||
    screenshotText.includes("DEBUG SHELL");

  terminateApp(device.udid, bundleId);

  return {
    stage: config.stage,
    variant: config.variant,
    launchedAt,
    screenshotPath: config.screenshotPath,
    stableScreenshotPath: config.screenshotPath,
    presentationScreenshotPath,
    launchOutput,
    meanLuma: Number(meanLuma.toFixed(2)),
    showsShellError,
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(debugPreviewDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  run("xcodegen", ["generate"], { cwd: shellProjectDir });

  const { sdkVersion, device } = collectSimulatorEnvironment();
  try {
    run("xcrun", ["simctl", "boot", device.udid]);
  } catch {}
  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);

  const { appPath, bundleId } = buildSimulatorApp(device);
  terminateApp(device.udid, bundleId);
  try {
    run("xcrun", ["simctl", "uninstall", device.udid, bundleId]);
  } catch {}
  run("xcrun", ["simctl", "install", device.udid, appPath]);

  const runs = [];
  for (const config of previewConfigs) {
    runs.push(await capturePreview(device, bundleId, config));
  }
  const archetypeRuns = [];
  for (const config of archetypePreviewConfigs) {
    archetypeRuns.push(await capturePreview(device, bundleId, config));
  }
  terminateApp(device.udid, bundleId);

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    sdkVersion,
    device: { name: device.name, udid: device.udid },
    bundleId,
    baseUrl,
    appPath,
    previewRunStamp,
    previewGitRevision,
    showsPreviewWatermark,
    suppressesTransientChrome,
    runs,
    archetypeRuns,
  };

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if ([...runs, ...archetypeRuns].some((runResult) => runResult.showsShellError)) {
    throw new Error("ios_native_preview_shell_error_page");
  }
}

main().catch((error) => {
  const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
  const message = [
    error instanceof Error ? error.message : String(error),
    stdout,
    stderr,
    collectDestinations(),
  ]
    .filter(Boolean)
    .join("\n\n");
  console.error(message);
  process.exit(1);
});
