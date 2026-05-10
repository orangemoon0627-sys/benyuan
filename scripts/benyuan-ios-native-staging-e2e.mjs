#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {
  chooseSimulatorDevice,
  extractInstalledSimulatorSdkVersion,
} from "./benyuan-ios-native-smoke-lib.mjs";
import {
  assertAllRequiredRuntimeStagesLive,
  buildLaunchArgs,
  safeNativeE2EEvents,
  safeNativeSessionSummary,
  shouldTreatAppLogsAsNativeError,
} from "./benyuan-ios-native-staging-e2e-lib.mjs";

const root = process.cwd();
const shellProjectDir = path.join(root, "mobile", "benyuan_origin_ios_shell");
const projectPath = path.join(shellProjectDir, "BenyuanOriginShell.xcodeproj");
const scheme = "BenyuanOriginShell";
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? "Debug";
const desiredDeviceName = process.env.BENYUAN_SIM_DEVICE ?? "iPhone 17";
const baseUrl = (process.env.BENYUAN_BASE_URL ?? "http://120.26.126.88").replace(/\/$/, "");
const fixtureName = process.env.BENYUAN_IOS_E2E_FIXTURE ?? "native-smoke-fixture.png";
const outputDir = path.join(root, "output");
const tempDir = path.join(os.tmpdir(), "benyuan-ios-native-staging-e2e");
const screenshotPath = path.join(outputDir, "benyuan-ios-native-staging-e2e-constellation.png");
const jsonPath = path.join(outputDir, "benyuan-ios-native-staging-e2e.json");
const stdoutPath = path.join(tempDir, "benyuan-ios-native-staging-e2e.stdout.log");
const stderrPath = path.join(tempDir, "benyuan-ios-native-staging-e2e.stderr.log");
const outputStdoutPath = path.join(outputDir, "benyuan-ios-native-staging-e2e.stdout.log");
const outputStderrPath = path.join(outputDir, "benyuan-ios-native-staging-e2e.stderr.log");
const maxWaitMs = Number(process.env.BENYUAN_IOS_E2E_TIMEOUT_MS ?? 240000);
const pollMs = 5000;
const knownCrossAppBundleIds = [
  "com.tradewiseai.tradewiseAi",
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
    throw new Error("ios_staging_e2e_build_settings_incomplete");
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

function terminateKnownCrossApps(udid) {
  for (const crossAppBundleId of knownCrossAppBundleIds) {
    terminateApp(udid, crossAppBundleId);
  }
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function tailText(value, maxLength = 12000) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return text.slice(text.length - maxLength);
}

function parseFileURLPath(rawPath) {
  if (!rawPath) return null;
  try {
    return decodeURIComponent(new URL(rawPath).pathname);
  } catch {
    return rawPath.replace(/^file:\/\//, "").replace(/\/$/, "");
  }
}

function simulatorAppInfo(udid, bundleId) {
  try {
    return run("xcrun", ["simctl", "appinfo", udid, bundleId]);
  } catch {
    return "";
  }
}

function dataContainerPathFromAppInfo(appInfo) {
  const match = String(appInfo ?? "").match(/DataContainer = "([^"]+)"/);
  if (!match) return null;
  return parseFileURLPath(match[1])?.replace(/\/$/, "") ?? null;
}

function nativeSessionFromPreferences(preferencesPath) {
  try {
    const raw = run("plutil", ["-extract", "benyuan-native-session", "raw", "-o", "-", preferencesPath]);
    const json = Buffer.from(raw.replace(/\s+/g, ""), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function nativeE2EEventsFromPreferences(preferencesPath) {
  try {
    const raw = run("plutil", ["-extract", "benyuan-native-e2e-events", "raw", "-o", "-", preferencesPath]);
    const json = Buffer.from(raw.replace(/\s+/g, ""), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function collectNativeSessionSummary(udid, bundleId) {
  const appInfo = simulatorAppInfo(udid, bundleId);
  const dataContainerPath = dataContainerPathFromAppInfo(appInfo);
  if (!dataContainerPath) {
    return { appInfo, dataContainerPath: null, session: null };
  }
  const preferencesPath = path.join(dataContainerPath, "Library", "Preferences", `${bundleId}.plist`);
  return {
    appInfo,
    dataContainerPath,
    preferencesPath,
    session: safeNativeSessionSummary(nativeSessionFromPreferences(preferencesPath)),
    e2eEvents: safeNativeE2EEvents(nativeE2EEventsFromPreferences(preferencesPath)),
  };
}

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed (${response.status}): ${JSON.stringify(payload).slice(0, 240)}`);
  }
  return payload;
}

function latestConstellationTiming(runtimePayload, startedAtMs) {
  const latest = runtimePayload?.agentTiming?.stages?.constellation?.latest;
  if (!latest?.recorded_at || !latest?.part1_id || !latest?.part2_id) return null;
  const recordedAt = Date.parse(latest.recorded_at);
  if (!Number.isFinite(recordedAt) || recordedAt < startedAtMs) return null;
  return latest;
}

async function waitForConstellation(startedAtMs) {
  const deadline = Date.now() + maxWaitMs;
  let lastRuntime = null;
  while (Date.now() < deadline) {
    lastRuntime = await fetchJson("/api/agent/runtime");
    const latest = latestConstellationTiming(lastRuntime, startedAtMs);
    if (latest?.runtime_mode === "live") {
      return { latest, runtimePayload: lastRuntime };
    }
    if (latest?.runtime_mode === "fallback") {
      throw new Error(`ios_staging_e2e_fallback:${latest.error ?? "unknown"}`);
    }
    await sleep(pollMs);
  }
  throw new Error(`ios_staging_e2e_timeout:${JSON.stringify(lastRuntime?.agentTiming?.stages?.constellation?.latest ?? null)}`);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  run("xcodegen", ["generate"], { cwd: shellProjectDir });

  const runtimeBefore = await fetchJson("/api/agent/runtime");
  if (runtimeBefore.providerRequestMode !== "live" || !runtimeBefore.liveProviderEnabled) {
    throw new Error(`staging_runtime_not_live:${JSON.stringify(runtimeBefore)}`);
  }

  const { sdkVersion, device } = collectSimulatorEnvironment();
  try {
    run("xcrun", ["simctl", "boot", device.udid]);
  } catch {}
  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);

  const { appPath, bundleId } = buildSimulatorApp(device);
  terminateApp(device.udid, bundleId);
  terminateKnownCrossApps(device.udid);
  try {
    run("xcrun", ["simctl", "uninstall", device.udid, bundleId]);
  } catch {}
  run("xcrun", ["simctl", "install", device.udid, appPath]);

  const launchedAtMs = Date.now();
  const launchedAt = new Date(launchedAtMs).toISOString();
  await writeFile(stdoutPath, "");
  await writeFile(stderrPath, "");
  terminateKnownCrossApps(device.udid);
  const launchOutput = run("xcrun", buildLaunchArgs({
    udid: device.udid,
    bundleId,
    baseUrl,
    stdoutPath,
    stderrPath,
    fixtureName,
  }));

  let latest = null;
  let runtimePayload = null;
  let e2eError = null;
  try {
    const result = await waitForConstellation(launchedAtMs);
    latest = result.latest;
    runtimePayload = result.runtimePayload;
    await sleep(3500);
  } catch (error) {
    e2eError = error;
    try {
      runtimePayload = await fetchJson("/api/agent/runtime");
    } catch {}
  }

  const tempScreenshotPath = path.join(tempDir, path.basename(screenshotPath));
  run("xcrun", ["simctl", "io", device.udid, "screenshot", tempScreenshotPath]);
  await copyFile(tempScreenshotPath, screenshotPath);
  const screenshot = await readFile(screenshotPath);
  const screenshotText = screenshot.toString("latin1");
  const showsShellError =
    screenshotText.includes("The resource could not be loaded") ||
    screenshotText.includes("App Transport Security") ||
    screenshotText.includes("NSURLError") ||
    screenshotText.includes("DEBUG SHELL");
  const appStdout = tailText(await readTextIfExists(stdoutPath));
  const appStderr = tailText(await readTextIfExists(stderrPath));
  try {
    await copyFile(stdoutPath, outputStdoutPath);
  } catch {}
  try {
    await copyFile(stderrPath, outputStderrPath);
  } catch {}
  const appLogs = [appStdout, appStderr].filter(Boolean).join("\n");
  const showsNativeError = shouldTreatAppLogsAsNativeError(appLogs);
  const nativeSession = collectNativeSessionSummary(device.udid, bundleId);
  const latestRuntime = {
    multimodal: runtimePayload?.agentTiming?.stages?.multimodal?.latest,
    theater: runtimePayload?.agentTiming?.stages?.theater?.latest,
    constellation: runtimePayload?.agentTiming?.stages?.constellation?.latest,
  };

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    sdkVersion,
    device: { name: device.name, udid: device.udid },
    baseUrl,
    bundleId,
    appPath,
    fixtureName,
    launchedAt,
    launchOutput,
    screenshotPath,
    stdoutPath: outputStdoutPath,
    stderrPath: outputStderrPath,
    simulatorStdoutPath: stdoutPath,
    simulatorStderrPath: stderrPath,
    showsShellError,
    showsNativeError,
    appStdout,
    appStderr,
    nativeSession,
    latestConstellation: latest,
    latestRuntime,
    error: e2eError instanceof Error ? e2eError.message : (e2eError ? String(e2eError) : null),
  };

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (e2eError) {
    throw e2eError;
  }
  if (showsShellError) {
    throw new Error("ios_staging_e2e_shell_error_page");
  }
  if (showsNativeError) {
    throw new Error("ios_staging_e2e_native_error_page");
  }
  assertAllRequiredRuntimeStagesLive(latestRuntime);
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
