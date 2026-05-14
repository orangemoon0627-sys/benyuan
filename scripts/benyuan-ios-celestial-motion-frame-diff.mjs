#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
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
const variant = process.env.BENYUAN_CELESTIAL_MOTION_VARIANT ?? "event-horizon-diver";
const frameCount = Number(process.env.BENYUAN_CELESTIAL_MOTION_FRAMES ?? 4);
const frameIntervalMs = Number(process.env.BENYUAN_CELESTIAL_MOTION_INTERVAL_MS ?? 1100);
const outputDir = path.join(root, "output", "motion-check");
const tempDir = path.join(os.tmpdir(), "benyuan-ios-celestial-motion");
const outputPath = path.join(outputDir, `benyuan-ios-celestial-motion-${variant}.json`);

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
    throw new Error("ios_celestial_motion_build_settings_incomplete");
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

async function captureFrames(device, bundleId) {
  terminateApp(device.udid, bundleId);
  const launchOutput = run("xcrun", [
    "simctl",
    "launch",
    device.udid,
    bundleId,
    "--args",
    "--benyuan-base-url",
    baseUrl,
    "--benyuan-native-preview",
    "constellation",
    "--benyuan-native-preview-archetype",
    variant,
    "--benyuan-native-preview-stamp",
    "motion-frame-diff",
    "--benyuan-native-preview-revision",
    "local",
  ]);

  await sleep(2400);

  const frames = [];
  for (let index = 0; index < frameCount; index += 1) {
    const filename = `benyuan-ios-celestial-motion-${variant}-${index + 1}.png`;
    const tempPath = path.join(tempDir, filename);
    const stablePath = path.join(outputDir, filename);
    run("xcrun", ["simctl", "io", device.udid, "screenshot", tempPath]);
    await copyFile(tempPath, stablePath);
    frames.push(stablePath);
    await sleep(frameIntervalMs);
  }

  terminateApp(device.udid, bundleId);
  return { launchOutput, frames };
}

async function compareFrames(frames) {
  const metadata = await sharp(frames[0]).metadata();
  const crop = {
    left: Math.floor(metadata.width * 0.05),
    top: Math.floor(metadata.height * 0.14),
    width: Math.floor(metadata.width * 0.90),
    height: Math.floor(metadata.height * 0.50),
  };
  const raws = [];
  for (const frame of frames) {
    raws.push(await sharp(frame).extract(crop).greyscale().raw().toBuffer());
  }

  const diffs = [];
  for (let index = 1; index < raws.length; index += 1) {
    let sum = 0;
    let max = 0;
    let changed = 0;
    const base = raws[0];
    const current = raws[index];
    for (let byteIndex = 0; byteIndex < base.length; byteIndex += 1) {
      const delta = Math.abs(base[byteIndex] - current[byteIndex]);
      sum += delta;
      if (delta > max) max = delta;
      if (delta > 5) changed += 1;
    }
    diffs.push({
      frame: index + 1,
      meanDelta: Number((sum / base.length).toFixed(3)),
      maxDelta: max,
      changedPixels: changed,
    });
  }

  return {
    crop,
    diffs,
    passed: diffs.some((diff) => diff.meanDelta >= 0.18 && diff.changedPixels >= 1200),
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  run("xcodegen", ["generate"], { cwd: shellProjectDir });

  const { sdkVersion, device } = collectSimulatorEnvironment();
  try {
    run("xcrun", ["simctl", "boot", device.udid]);
  } catch {}
  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);

  const { appPath, bundleId } = buildSimulatorApp(device);
  try {
    run("xcrun", ["simctl", "uninstall", device.udid, bundleId]);
  } catch {}
  run("xcrun", ["simctl", "install", device.udid, appPath]);

  const captured = await captureFrames(device, bundleId);
  const comparison = await compareFrames(captured.frames);
  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    sdkVersion,
    device: { name: device.name, udid: device.udid },
    bundleId,
    appPath,
    baseUrl,
    variant,
    frameCount,
    frameIntervalMs,
    launchOutput: captured.launchOutput,
    frames: captured.frames,
    ...comparison,
  };

  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.passed) {
    throw new Error(`ios_celestial_motion_frame_diff_failed: ${variant}`);
  }
}

main().catch((error) => {
  const stdout = typeof error?.stdout === "string" ? error.stdout.trim() : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
  console.error([error instanceof Error ? error.message : String(error), stdout, stderr].filter(Boolean).join("\n\n"));
  process.exit(1);
});
