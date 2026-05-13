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
  assertAllRequiredRuntimeStagesBelongToSession,
  assertAllRequiredRuntimeStagesLive,
  assertNativeConstellationPersisted,
  buildLaunchArgs,
  safeNativeE2EEvents,
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
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const samplesRootDir = path.join(outputDir, "staging-progress-samples");
const samplesRunDir = path.join(samplesRootDir, runId);
const tempDir = path.join(os.tmpdir(), "benyuan-ios-native-staging-progress");
const stdoutPath = path.join(tempDir, "benyuan-ios-native-staging-progress.stdout.log");
const stderrPath = path.join(tempDir, "benyuan-ios-native-staging-progress.stderr.log");
const outputStdoutPath = path.join(outputDir, "benyuan-ios-native-staging-progress.stdout.log");
const outputStderrPath = path.join(outputDir, "benyuan-ios-native-staging-progress.stderr.log");
const jsonPath = path.join(outputDir, "benyuan-ios-native-staging-progress-samples.json");
const markdownPath = path.join(outputDir, "benyuan-ios-native-staging-progress-report.md");
const maxWaitMs = Number(process.env.BENYUAN_IOS_E2E_TIMEOUT_MS ?? 240000);
const sampleIntervalMs = Number(process.env.BENYUAN_IOS_PROGRESS_SAMPLE_MS ?? 5000);
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
    throw new Error("ios_staging_progress_build_settings_incomplete");
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
  const auth = session.auth_session;
  return {
    authSession: auth && typeof auth === "object" ? {
      sessionId: auth.session_id ?? null,
      userId: auth.user_id ?? null,
      provider: auth.provider ?? null,
      hasToken: typeof auth.token === "string" && auth.token.length > 0,
    } : null,
    part1Id: session.part1_id ?? null,
    theaterScriptId: session.theater_script_id ?? null,
    part2Id: session.part2_id ?? null,
    constellationId: session.constellation_id ?? null,
    activeGenerationJobId: session.active_generation_job_id ?? null,
    answerCount: countObjectKeys(session.answers),
    uploadQuestionCount: countObjectKeys(session.uploaded_assets),
  };
}

function authTokenFromNativeSession(session) {
  const token = session?.auth_session?.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function redactSensitiveText(value) {
  return String(value ?? "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/authorization["'\s:=]+[A-Za-z0-9._~+/=-]+/gi, "authorization: [REDACTED]")
    .replace(/bya_[A-Za-z0-9._~+/=-]+/g, "bya_[REDACTED]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[REDACTED]");
}

function sanitizeDiagnostics(diagnostics) {
  if (!diagnostics) return diagnostics;
  const { authToken: _authToken, ...safeDiagnostics } = diagnostics;
  return {
    ...safeDiagnostics,
    appInfo: redactSensitiveText(diagnostics.appInfo),
    dataContainerPath: diagnostics.dataContainerPath,
    preferencesPath: diagnostics.preferencesPath,
    session: diagnostics.session,
    e2eEvents: diagnostics.e2eEvents,
  };
}

function collectNativeDiagnostics(udid, bundleId) {
  const appInfo = simulatorAppInfo(udid, bundleId);
  const dataContainerPath = dataContainerPathFromAppInfo(appInfo);
  if (!dataContainerPath) {
    return { appInfo, dataContainerPath: null, preferencesPath: null, session: null, authToken: null, e2eEvents: [] };
  }
  const preferencesPath = path.join(dataContainerPath, "Library", "Preferences", `${bundleId}.plist`);
  const rawSession = plistJSONData(preferencesPath, "benyuan-native-session", null);
  return {
    appInfo,
    dataContainerPath,
    preferencesPath,
    session: compactNativeSession(rawSession),
    authToken: authTokenFromNativeSession(rawSession),
    e2eEvents: safeNativeE2EEvents(plistJSONData(preferencesPath, "benyuan-native-e2e-events", [])),
  };
}

function countObjectKeys(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.keys(value).length;
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: options.authToken ? { authorization: `Bearer ${options.authToken}` } : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(redactSensitiveText(`GET ${pathname} failed (${response.status}): ${JSON.stringify(payload).slice(0, 240)}`));
  }
  return payload;
}

async function fetchJsonEvidence(pathname, options = {}) {
  try {
    return { ok: true, payload: await fetchJson(pathname, options) };
  } catch (error) {
    return { ok: false, error: redactSensitiveText(error instanceof Error ? error.message : String(error)) };
  }
}

function latestEventMessage(events, pattern) {
  const list = Array.isArray(events) ? events : [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const message = String(list[index]?.message ?? "");
    if (pattern.test(message)) return message;
  }
  return "";
}

function extractJobId(message) {
  const match = String(message ?? "").match(/job_id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function nativeJobIdsFromEvents(events) {
  const result = {
    theaterJobId: null,
    constellationJobId: null,
    latestJobId: null,
    latestKind: null,
  };

  for (const event of Array.isArray(events) ? events : []) {
    const message = String(event?.message ?? "");
    const match = message.match(/native_job_started kind=([a-zA-Z0-9_-]+) job_id=([a-zA-Z0-9_-]+)/);
    if (!match) continue;
    const kind = match[1];
    const jobId = match[2];
    if (kind === "theater") result.theaterJobId = jobId;
    if (kind === "constellation") result.constellationJobId = jobId;
    result.latestJobId = jobId;
    result.latestKind = kind;
  }

  result.theaterJobId ??= extractJobId(latestEventMessage(events, /native_job_started kind=theater/));
  result.constellationJobId ??= extractJobId(latestEventMessage(events, /native_job_started kind=constellation/));
  result.latestJobId ??= result.constellationJobId ?? result.theaterJobId;
  result.latestKind ??= result.constellationJobId ? "constellation" : result.theaterJobId ? "theater" : null;
  return result;
}

async function fetchNativeJobs(jobIds, authToken) {
  const jobs = {};
  if (jobIds.theaterJobId) {
    jobs.theater = await fetchJsonEvidence(`/api/native/jobs/${jobIds.theaterJobId}`, { authToken });
  }
  if (jobIds.constellationJobId) {
    jobs.constellation = await fetchJsonEvidence(`/api/native/jobs/${jobIds.constellationJobId}`, { authToken });
  }
  return jobs;
}

function payloadFromEvidence(evidence) {
  return evidence?.ok ? evidence.payload : null;
}

function activeJobFromSample({ diagnostics, jobIds, jobs }) {
  const activeJobId = diagnostics.session?.activeGenerationJobId ?? jobIds.latestJobId;
  const theater = payloadFromEvidence(jobs.theater);
  const constellation = payloadFromEvidence(jobs.constellation);
  if (activeJobId && theater?.job_id === activeJobId) return { kind: "theater", job: theater };
  if (activeJobId && constellation?.job_id === activeJobId) return { kind: "constellation", job: constellation };
  if (constellation) return { kind: "constellation", job: constellation };
  if (theater) return { kind: "theater", job: theater };
  return { kind: jobIds.latestKind, job: null };
}

async function captureScreenshot(udid, index, elapsedMs, reason = "sample") {
  const padded = String(index).padStart(3, "0");
  const seconds = String(Math.max(0, Math.round(elapsedMs / 1000))).padStart(3, "0");
  const filename = `${padded}-${seconds}s-${reason}.png`;
  const tempScreenshotPath = path.join(tempDir, filename);
  const screenshotPath = path.join(samplesRunDir, filename);
  try {
    run("xcrun", ["simctl", "io", udid, "screenshot", tempScreenshotPath]);
    await copyFile(tempScreenshotPath, screenshotPath);
    return { screenshotPath, screenshotError: null };
  } catch (error) {
    return {
      screenshotPath: null,
      screenshotError: error instanceof Error ? error.message : String(error),
    };
  }
}

function runtimeStageSummary(runtimePayload) {
  const stages = runtimePayload?.agentTiming?.stages ?? {};
  return {
    multimodal: stages.multimodal?.latest ?? null,
    theater: stages.theater?.latest ?? null,
    constellation: stages.constellation?.latest ?? null,
  };
}

function roundNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function progressObservation(active) {
  const job = active.job;
  if (!job) {
    return {
      activeKind: active.kind,
      jobId: null,
      status: null,
      stage: null,
      progress: null,
      percent: null,
      stageProgress: null,
      progressBasis: null,
      label: null,
      elapsedMs: null,
      expectedMs: null,
    };
  }

  return {
    activeKind: active.kind,
    jobId: job.job_id ?? null,
    status: job.status ?? null,
    stage: job.current_stage ?? null,
    progress: roundNumber(Number(job.progress), 4),
    percent: Number.isFinite(Number(job.progress)) ? Math.round(Number(job.progress) * 100) : null,
    stageProgress: roundNumber(Number(job.stage_progress), 4),
    progressBasis: job.progress_basis ?? null,
    label: job.stage_detail?.label ?? null,
    elapsedMs: job.stage_detail?.elapsed_ms ?? null,
    expectedMs: job.stage_detail?.expected_ms ?? null,
  };
}

async function collectProgressSample({ index, udid, bundleId, launchedAtMs, reason = "sample" }) {
  const sampledAtMs = Date.now();
  const elapsedMs = sampledAtMs - launchedAtMs;
  const diagnostics = collectNativeDiagnostics(udid, bundleId);
  const jobIds = nativeJobIdsFromEvents(diagnostics.e2eEvents);
  const [jobs, runtimeEvidence, screenshot] = await Promise.all([
    fetchNativeJobs(jobIds, diagnostics.authToken),
    fetchJsonEvidence("/api/agent/runtime"),
    captureScreenshot(udid, index, elapsedMs, reason),
  ]);
  const active = activeJobFromSample({ diagnostics, jobIds, jobs });

  return {
    index,
    reason,
    sampledAt: new Date(sampledAtMs).toISOString(),
    elapsedMs,
    ...screenshot,
    nativeSession: diagnostics.session,
    jobIds,
    activeProgress: progressObservation(active),
    jobs: {
      theater: jobs.theater ?? null,
      constellation: jobs.constellation ?? null,
    },
    runtime: runtimeEvidence.ok
      ? {
          providerRequestMode: runtimeEvidence.payload?.providerRequestMode ?? null,
          liveProviderEnabled: runtimeEvidence.payload?.liveProviderEnabled ?? null,
          latest: runtimeStageSummary(runtimeEvidence.payload),
        }
      : runtimeEvidence,
    e2eEventsTail: diagnostics.e2eEvents.slice(-12),
  };
}

function progressPercent(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : "n/a";
}

function tableCell(value) {
  if (value === null || value === undefined || value === "") return "n/a";
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function analyzeSamples(samples) {
  const screenshotCount = samples.filter((sample) => sample.screenshotPath).length;
  const progressSamples = samples
    .filter((sample) => sample.activeProgress?.jobId && Number.isFinite(Number(sample.activeProgress.progress)))
    .map((sample) => ({
      index: sample.index,
      kind: sample.activeProgress.activeKind,
      jobId: sample.activeProgress.jobId,
      progress: Number(sample.activeProgress.progress),
      percent: sample.activeProgress.percent,
      stage: sample.activeProgress.stage,
      elapsedMs: sample.elapsedMs,
    }));
  const violations = [];
  const byJob = new Map();
  for (const sample of progressSamples) {
    const previous = byJob.get(sample.jobId);
    if (previous && sample.progress + 0.005 < previous.progress) {
      violations.push({
        jobId: sample.jobId,
        fromIndex: previous.index,
        toIndex: sample.index,
        fromProgress: previous.progress,
        toProgress: sample.progress,
      });
    }
    byJob.set(sample.jobId, sample);
  }
  const kinds = [...new Set(progressSamples.map((sample) => sample.kind).filter(Boolean))];
  const gaps = [];
  for (let index = 1; index < samples.length; index += 1) {
    gaps.push(samples[index].elapsedMs - samples[index - 1].elapsedMs);
  }

  return {
    sampleCount: samples.length,
    screenshotCount,
    sampledJobKinds: kinds,
    monotonicWithinJob: violations.length === 0,
    monotonicViolations: violations,
    maxSampleGapMs: gaps.length ? Math.max(...gaps) : 0,
    averageSampleGapMs: gaps.length ? Math.round(gaps.reduce((total, gap) => total + gap, 0) / gaps.length) : 0,
    firstProgressPercent: progressSamples[0]?.percent ?? null,
    lastProgressPercent: progressSamples.at(-1)?.percent ?? null,
  };
}

function buildMarkdownReport(summary) {
  const samples = summary.samples ?? [];
  const quality = summary.progressEvidence ?? {};
  const latestRuntime = summary.latestRuntime ?? {};
  const rows = samples.map((sample) => {
    const active = sample.activeProgress ?? {};
    return [
      sample.index,
      `${Math.round(sample.elapsedMs / 1000)}s`,
      active.activeKind ?? "n/a",
      active.stage ?? "n/a",
      active.percent === null || active.percent === undefined ? "n/a" : `${active.percent}%`,
      active.label ?? "n/a",
      sample.screenshotPath ?? sample.screenshotError ?? "n/a",
    ].map(tableCell).join(" | ");
  });

  return [
    "# Benyuan Native Staging Progress Report",
    "",
    `- generated_at: ${summary.generatedAt}`,
    `- base_url: ${summary.baseUrl}`,
    `- device: ${summary.device?.name ?? "n/a"} (${summary.device?.udid ?? "n/a"})`,
    `- bundle_id: ${summary.bundleId}`,
    `- launched_at: ${summary.launchedAt}`,
    `- finished_at: ${summary.finishedAt ?? "n/a"}`,
    `- total_duration_ms: ${summary.totalDurationMs ?? "n/a"}`,
    `- sample_interval_ms: ${summary.sampleIntervalMs}`,
    `- samples_dir: ${summary.samplesRunDir}`,
    `- error: ${summary.error ?? "none"}`,
    "",
    "## Progress Evidence",
    "",
    `- sample_count: ${quality.sampleCount ?? 0}`,
    `- screenshot_count: ${quality.screenshotCount ?? 0}`,
    `- sampled_job_kinds: ${(quality.sampledJobKinds ?? []).join(", ") || "none"}`,
    `- monotonic_within_job: ${quality.monotonicWithinJob === false ? "false" : "true"}`,
    `- first_progress_percent: ${quality.firstProgressPercent ?? "n/a"}`,
    `- last_progress_percent: ${quality.lastProgressPercent ?? "n/a"}`,
    `- max_sample_gap_ms: ${quality.maxSampleGapMs ?? "n/a"}`,
    "",
    "## Runtime Latest",
    "",
    `- multimodal: ${latestRuntime.multimodal?.duration_ms ?? "n/a"}ms / ${latestRuntime.multimodal?.runtime_mode ?? "n/a"} / ${latestRuntime.multimodal?.model ?? "n/a"}`,
    `- theater: ${latestRuntime.theater?.duration_ms ?? "n/a"}ms / ${latestRuntime.theater?.runtime_mode ?? "n/a"} / ${latestRuntime.theater?.model ?? "n/a"}`,
    `- constellation: ${latestRuntime.constellation?.duration_ms ?? "n/a"}ms / ${latestRuntime.constellation?.runtime_mode ?? "n/a"} / ${latestRuntime.constellation?.model ?? "n/a"}`,
    "",
    "## Samples",
    "",
    "index | t | active_job | stage | percent | label | screenshot",
    "--- | ---: | --- | --- | ---: | --- | ---",
    ...rows,
    "",
  ].join("\n");
}

async function copyAppLogsToOutput() {
  try {
    await writeFile(outputStdoutPath, redactSensitiveText(await readTextIfExists(stdoutPath)));
  } catch {}
  try {
    await writeFile(outputStderrPath, redactSensitiveText(await readTextIfExists(stderrPath)));
  } catch {}
}

function latestConstellationTiming(runtimePayload, startedAtMs) {
  const latest = runtimePayload?.agentTiming?.stages?.constellation?.latest;
  if (!latest?.recorded_at || !latest?.part1_id || !latest?.part2_id) return null;
  const recordedAt = Date.parse(latest.recorded_at);
  if (!Number.isFinite(recordedAt) || recordedAt < startedAtMs) return null;
  return latest;
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(samplesRunDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  await writeFile(stdoutPath, "");
  await writeFile(stderrPath, "");

  const runtimeBefore = await fetchJson("/api/agent/runtime");
  if (runtimeBefore.providerRequestMode !== "live" || !runtimeBefore.liveProviderEnabled) {
    throw new Error(`staging_runtime_not_live:${JSON.stringify(runtimeBefore)}`);
  }

  run("xcodegen", ["generate"], { cwd: shellProjectDir });
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
  terminateKnownCrossApps(device.udid);
  const launchOutput = run("xcrun", buildLaunchArgs({
    udid: device.udid,
    bundleId,
    baseUrl,
    stdoutPath,
    stderrPath,
    fixtureName,
  }));

  const samples = [];
  let sampleIndex = 0;
  let finalError = null;
  let finalNativeSession = null;
  let runtimePayload = null;
  let nextSampleAt = launchedAtMs;
  const deadline = launchedAtMs + maxWaitMs;

  try {
    while (Date.now() < deadline) {
      const now = Date.now();
      if (now >= nextSampleAt) {
        samples.push(await collectProgressSample({
          index: sampleIndex,
          udid: device.udid,
          bundleId,
          launchedAtMs,
        }));
        sampleIndex += 1;
        nextSampleAt = now + sampleIntervalMs;
      }

  const appStdout = await readTextIfExists(stdoutPath);
  const appStderr = await readTextIfExists(stderrPath);
      const appLogs = [appStdout, appStderr].filter(Boolean).join("\n");
      if (shouldTreatAppLogsAsNativeError(appLogs)) {
        throw new Error(`ios_staging_progress_native_error:${tailText(appLogs)}`);
      }

      const diagnostics = collectNativeDiagnostics(device.udid, bundleId);
      try {
        assertNativeConstellationPersisted({ nativeSession: diagnostics });
        finalNativeSession = diagnostics;
        break;
      } catch {}

      await sleep(Math.min(1000, Math.max(250, nextSampleAt - Date.now())));
    }

    if (!finalNativeSession) {
      throw new Error(`ios_staging_progress_timeout:${JSON.stringify(samples.at(-1)?.activeProgress ?? null)}`);
    }
  } catch (error) {
    finalError = error;
  }

  samples.push(await collectProgressSample({
    index: sampleIndex,
    udid: device.udid,
    bundleId,
    launchedAtMs,
    reason: finalError ? "error-final" : "final",
  }));

  try {
    runtimePayload = await fetchJson("/api/agent/runtime");
  } catch (error) {
    finalError ??= error;
  }
  finalNativeSession ??= collectNativeDiagnostics(device.udid, bundleId);
  await copyAppLogsToOutput();

  const appStdout = tailText(await readTextIfExists(stdoutPath));
  const appStderr = tailText(await readTextIfExists(stderrPath));
  const appLogs = [appStdout, appStderr].filter(Boolean).join("\n");
  const showsNativeError = shouldTreatAppLogsAsNativeError(appLogs);
  const latestRuntime = runtimeStageSummary(runtimePayload);
  const latestConstellation = latestConstellationTiming(runtimePayload, launchedAtMs);
  const finalScreenshotPath = samples.at(-1)?.screenshotPath ?? null;
  let showsShellError = false;
  if (finalScreenshotPath) {
    const screenshot = await readFile(finalScreenshotPath);
    const screenshotText = screenshot.toString("latin1");
    showsShellError =
      screenshotText.includes("The resource could not be loaded") ||
      screenshotText.includes("App Transport Security") ||
      screenshotText.includes("NSURLError") ||
      screenshotText.includes("DEBUG SHELL");
  }

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
    finishedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - launchedAtMs,
    launchOutput,
    samplesRunDir,
    sampleIntervalMs,
    jsonPath,
    markdownPath,
    stdoutPath: outputStdoutPath,
    stderrPath: outputStderrPath,
    simulatorStdoutPath: stdoutPath,
    simulatorStderrPath: stderrPath,
    showsShellError,
    showsNativeError,
    appStdout: redactSensitiveText(appStdout),
    appStderr: redactSensitiveText(appStderr),
    nativeSession: sanitizeDiagnostics(finalNativeSession),
    latestConstellation,
    latestRuntime,
    progressEvidence: analyzeSamples(samples),
    samples,
    error: finalError instanceof Error ? finalError.message : (finalError ? String(finalError) : null),
  };

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(markdownPath, buildMarkdownReport(summary));
  console.log(JSON.stringify(summary, null, 2));

  if (finalError) {
    throw finalError;
  }
  if (showsShellError) {
    throw new Error("ios_staging_progress_shell_error_page");
  }
  if (showsNativeError) {
    throw new Error("ios_staging_progress_native_error_page");
  }
  assertAllRequiredRuntimeStagesLive(latestRuntime);
  assertAllRequiredRuntimeStagesBelongToSession({
    latestRuntime,
    nativeSession: finalNativeSession,
    launchedAtMs,
  });
  assertNativeConstellationPersisted({ nativeSession: finalNativeSession });
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
