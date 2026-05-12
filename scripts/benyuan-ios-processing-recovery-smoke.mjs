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
  buildLaunchArgs,
  safeNativeE2EEvents,
  shouldTreatAppLogsAsNativeError,
} from "./benyuan-ios-native-staging-e2e-lib.mjs";
import {
  assertProcessingRecoverySummary,
  extractJobId,
  latestEventMessage,
} from "./benyuan-ios-processing-recovery-smoke-lib.mjs";

const root = process.cwd();
const shellProjectDir = path.join(root, "mobile", "benyuan_origin_ios_shell");
const projectPath = path.join(shellProjectDir, "BenyuanOriginShell.xcodeproj");
const scheme = "BenyuanOriginShell";
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? "Debug";
const desiredDeviceName = process.env.BENYUAN_SIM_DEVICE ?? "iPhone 17";
const baseUrl = (process.env.BENYUAN_BASE_URL ?? "http://120.26.126.88").replace(/\/$/, "");
const fixtureName = process.env.BENYUAN_IOS_E2E_FIXTURE ?? "native-smoke-fixture.png";
const outputDir = path.join(root, "output");
const tempDir = path.join(os.tmpdir(), "benyuan-ios-processing-recovery-smoke");
const jsonPath = path.join(outputDir, "benyuan-ios-processing-recovery-smoke.json");
const screenshotPath = path.join(outputDir, "benyuan-ios-processing-recovery-smoke.png");
const autorunStdoutPath = path.join(tempDir, "autorun.stdout.log");
const autorunStderrPath = path.join(tempDir, "autorun.stderr.log");
const recoveryStdoutPath = path.join(tempDir, "recovery.stdout.log");
const recoveryStderrPath = path.join(tempDir, "recovery.stderr.log");
const outputAutorunStdoutPath = path.join(outputDir, "benyuan-ios-processing-recovery-autorun.stdout.log");
const outputAutorunStderrPath = path.join(outputDir, "benyuan-ios-processing-recovery-autorun.stderr.log");
const outputRecoveryStdoutPath = path.join(outputDir, "benyuan-ios-processing-recovery-relaunch.stdout.log");
const outputRecoveryStderrPath = path.join(outputDir, "benyuan-ios-processing-recovery-relaunch.stderr.log");
const maxJobStartWaitMs = Number(process.env.BENYUAN_IOS_RECOVERY_JOB_START_TIMEOUT_MS ?? 180000);
const maxRecoveryWaitMs = Number(process.env.BENYUAN_IOS_RECOVERY_TIMEOUT_MS ?? 360000);
const pollMs = 1000;

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
    throw new Error("ios_processing_recovery_build_settings_incomplete");
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

function plistJSONData(preferencesPath, key, fallbackValue) {
  try {
    const raw = run("plutil", ["-extract", key, "raw", "-o", "-", preferencesPath]);
    const json = Buffer.from(raw.replace(/\s+/g, ""), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return fallbackValue;
  }
}

function compactNativeSession(session) {
  if (!session || typeof session !== "object") return null;
  return {
    part1Id: session.part1_id ?? null,
    theaterScriptId: session.theater_script_id ?? null,
    part2Id: session.part2_id ?? null,
    constellationId: session.constellation_id ?? null,
    activeGenerationJobId: session.active_generation_job_id ?? null,
    answerCount: session.answers && typeof session.answers === "object" ? Object.keys(session.answers).length : 0,
    uploadQuestionCount: session.uploaded_assets && typeof session.uploaded_assets === "object"
      ? Object.keys(session.uploaded_assets).length
      : 0,
  };
}

function collectNativeDiagnostics(udid, bundleId) {
  const appInfo = simulatorAppInfo(udid, bundleId);
  const dataContainerPath = dataContainerPathFromAppInfo(appInfo);
  if (!dataContainerPath) {
    return { appInfo, dataContainerPath: null, preferencesPath: null, session: null, e2eEvents: [] };
  }
  const preferencesPath = path.join(dataContainerPath, "Library", "Preferences", `${bundleId}.plist`);
  return {
    appInfo,
    dataContainerPath,
    preferencesPath,
    session: compactNativeSession(plistJSONData(preferencesPath, "benyuan-native-session", null)),
    e2eEvents: safeNativeE2EEvents(plistJSONData(preferencesPath, "benyuan-native-e2e-events", [])),
  };
}

function parseConstellationJobFromDiagnostics({ stdout, diagnostics }) {
  const stdoutMatch = String(stdout ?? "").match(/BENYUAN_E2E native_job_started kind=constellation job_id=([a-zA-Z0-9_-]+)/);
  if (stdoutMatch) return stdoutMatch[1];
  const message = latestEventMessage(diagnostics?.e2eEvents, /native_job_started kind=constellation/);
  return extractJobId(message);
}

async function waitForConstellationJobStart(udid, bundleId) {
  const deadline = Date.now() + maxJobStartWaitMs;
  let last = null;
  while (Date.now() < deadline) {
    const stdout = await readTextIfExists(autorunStdoutPath);
    const stderr = await readTextIfExists(autorunStderrPath);
    const diagnostics = collectNativeDiagnostics(udid, bundleId);
    const logs = [stdout, stderr].filter(Boolean).join("\n");
    if (shouldTreatAppLogsAsNativeError(logs)) {
      throw new Error(`ios_processing_recovery_autorun_native_error:${tailText(logs)}`);
    }
    const jobId = parseConstellationJobFromDiagnostics({ stdout, diagnostics });
    if (jobId && diagnostics.session?.activeGenerationJobId === jobId) {
      return { jobId, diagnostics, stdout: tailText(stdout), stderr: tailText(stderr) };
    }
    last = { jobId, diagnostics, stdout: tailText(stdout), stderr: tailText(stderr) };
    await sleep(pollMs);
  }
  throw new Error(`ios_processing_recovery_constellation_job_start_timeout:${JSON.stringify(last)}`);
}

async function waitForRecoveredConstellation(udid, bundleId) {
  const deadline = Date.now() + maxRecoveryWaitMs;
  let last = null;
  while (Date.now() < deadline) {
    const stdout = await readTextIfExists(recoveryStdoutPath);
    const stderr = await readTextIfExists(recoveryStderrPath);
    const diagnostics = collectNativeDiagnostics(udid, bundleId);
    const logs = [stdout, stderr].filter(Boolean).join("\n");
    if (shouldTreatAppLogsAsNativeError(logs)) {
      throw new Error(`ios_processing_recovery_relaunch_native_error:${tailText(logs)}`);
    }
    if (diagnostics.session?.constellationId && !diagnostics.session?.activeGenerationJobId) {
      return { diagnostics, stdout: tailText(stdout), stderr: tailText(stderr) };
    }
    last = { diagnostics, stdout: tailText(stdout), stderr: tailText(stderr) };
    await sleep(pollMs);
  }
  throw new Error(`ios_processing_recovery_relaunch_timeout:${JSON.stringify(last)}`);
}

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed (${response.status}): ${JSON.stringify(payload).slice(0, 240)}`);
  }
  return payload;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  await writeFile(autorunStdoutPath, "");
  await writeFile(autorunStderrPath, "");
  await writeFile(recoveryStdoutPath, "");
  await writeFile(recoveryStderrPath, "");

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
  try {
    run("xcrun", ["simctl", "uninstall", device.udid, bundleId]);
  } catch {}
  run("xcrun", ["simctl", "install", device.udid, appPath]);

  const autorunLaunchOutput = run("xcrun", buildLaunchArgs({
    udid: device.udid,
    bundleId,
    baseUrl,
    stdoutPath: autorunStdoutPath,
    stderrPath: autorunStderrPath,
    fixtureName,
  }));
  const started = await waitForConstellationJobStart(device.udid, bundleId);

  terminateApp(device.udid, bundleId);
  await sleep(1200);
  const beforeTerminate = collectNativeDiagnostics(device.udid, bundleId);

  const recoveryLaunchOutput = run("xcrun", [
    "simctl",
    "launch",
    `--stdout=${recoveryStdoutPath}`,
    `--stderr=${recoveryStderrPath}`,
    "--terminate-running-process",
    device.udid,
    bundleId,
    "--benyuan-base-url",
    baseUrl,
    "--benyuan-native-e2e-diagnostics",
  ]);
  const recovered = await waitForRecoveredConstellation(device.udid, bundleId);
  await sleep(1800);
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

  const autorunStdout = tailText(await readTextIfExists(autorunStdoutPath));
  const autorunStderr = tailText(await readTextIfExists(autorunStderrPath));
  const recoveryStdout = tailText(await readTextIfExists(recoveryStdoutPath));
  const recoveryStderr = tailText(await readTextIfExists(recoveryStderrPath));
  try {
    await copyFile(autorunStdoutPath, outputAutorunStdoutPath);
    await copyFile(autorunStderrPath, outputAutorunStderrPath);
    await copyFile(recoveryStdoutPath, outputRecoveryStdoutPath);
    await copyFile(recoveryStderrPath, outputRecoveryStderrPath);
  } catch {}

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    sdkVersion,
    device: { name: device.name, udid: device.udid },
    baseUrl,
    bundleId,
    appPath,
    fixtureName,
    autorunLaunchOutput,
    recoveryLaunchOutput,
    startedJobId: started.jobId,
    beforeTerminate,
    afterRelaunch: recovered.diagnostics,
    screenshotPath,
    stdoutPaths: {
      autorun: outputAutorunStdoutPath,
      autorunStderr: outputAutorunStderrPath,
      recovery: outputRecoveryStdoutPath,
      recoveryStderr: outputRecoveryStderrPath,
    },
    appStdout: [autorunStdout, recoveryStdout].filter(Boolean).join("\n"),
    appStderr: [autorunStderr, recoveryStderr].filter(Boolean).join("\n"),
    showsShellError,
    showsNativeError: shouldTreatAppLogsAsNativeError([autorunStdout, autorunStderr, recoveryStdout, recoveryStderr].join("\n")),
  };

  const recoveryResult = assertProcessingRecoverySummary(summary);
  summary.recoveryResult = recoveryResult;

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
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
