#!/usr/bin/env node

import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputDir = path.join(root, "output");
const auditDir = path.join(outputDir, "ios-motion-audit");
const videoDir = path.join(auditDir, "videos");
const buildSummaryPath = path.join(outputDir, "benyuan-ios-shell-build.json");
const manifestPath = path.join(auditDir, "capture-manifest.json");
const baseUrl = process.env.BENYUAN_BASE_URL ?? "http://127.0.0.1:3015";

const captures = [
  { id: "home", stage: "home", durationMs: 7_000 },
  { id: "auth", stage: "auth", durationMs: 6_000 },
  { id: "collect", stage: "collect", durationMs: 5_000 },
  { id: "upload", stage: "upload", durationMs: 5_000 },
  { id: "processing", stage: "processing", durationMs: 6_000 },
  { id: "theater", stage: "theater", durationMs: 7_000 },
  { id: "theater-act2", stage: "theater-act2", durationMs: 7_000 },
  { id: "constellation", stage: "constellation", durationMs: 6_000 },
  { id: "constellation-end", stage: "constellation-end", durationMs: 6_000 },
  { id: "event-horizon", stage: "constellation", variant: "event-horizon-diver", durationMs: 6_000 },
  { id: "terrestrial", stage: "constellation", variant: "terrestrial-planet", durationMs: 6_000 },
  { id: "account", stage: "account", durationMs: 5_000 },
  { id: "account-feedback", stage: "account-feedback", durationMs: 5_000 },
];

const captureFilter = new Set(
  (process.env.BENYUAN_MOTION_AUDIT_FILTER ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const selectedCaptures = captureFilter.size > 0
  ? captures.filter((capture) => captureFilter.has(capture.id))
  : captures;

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

async function stopRecording(recording) {
  if (recording.exitCode != null) return;
  recording.kill("SIGINT");
  await Promise.race([
    new Promise((resolve) => recording.once("exit", resolve)),
    sleep(4_000).then(() => {
      if (recording.exitCode == null) recording.kill("SIGTERM");
    }),
  ]);
}

async function captureVideo({ deviceUdid, bundleId, config, runStamp }) {
  try {
    run("xcrun", ["simctl", "terminate", deviceUdid, bundleId]);
  } catch {}

  const videoPath = path.join(videoDir, `${config.id}.mp4`);
  const recording = spawn(
    "xcrun",
    ["simctl", "io", deviceUdid, "recordVideo", "--codec=h264", "--force", videoPath],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  let recorderError = "";
  recording.stderr.on("data", (chunk) => {
    recorderError += chunk.toString();
  });

  await sleep(650);
  const launchArgs = [
    "simctl",
    "launch",
    deviceUdid,
    bundleId,
    "--args",
    "--benyuan-base-url",
    baseUrl,
    "--benyuan-native-preview",
    config.stage,
    "--benyuan-native-preview-stamp",
    runStamp,
    "--benyuan-native-preview-revision",
    "motion-audit",
    "--benyuan-native-preview-no-watermark",
    "--benyuan-native-preview-clean",
  ];
  if (config.variant) launchArgs.push("--benyuan-native-preview-archetype", config.variant);
  const launchOutput = run("xcrun", launchArgs);

  await sleep(config.durationMs);
  await stopRecording(recording);
  try {
    run("xcrun", ["simctl", "terminate", deviceUdid, bundleId]);
  } catch {}

  if (recording.exitCode !== 0 && recording.exitCode !== null) {
    throw new Error(`motion_audit_recording_failed:${config.id}:${recorderError.trim()}`);
  }
  return {
    ...config,
    videoPath,
    launchOutput,
  };
}

async function main() {
  await mkdir(videoDir, { recursive: true });
  const build = JSON.parse(await readFile(buildSummaryPath, "utf8"));
  const deviceUdid = build.device?.udid;
  const bundleId = build.bundleId;
  const appPath = path.join(build.targetBuildDir, build.product);
  if (!deviceUdid || !bundleId || !build.targetBuildDir || !build.product) {
    throw new Error("motion_audit_build_summary_incomplete");
  }

  try {
    run("xcrun", ["simctl", "boot", deviceUdid]);
  } catch {}
  run("xcrun", ["simctl", "bootstatus", deviceUdid, "-b"]);
  try {
    run("xcrun", ["simctl", "uninstall", deviceUdid, bundleId]);
  } catch {}
  run("xcrun", ["simctl", "install", deviceUdid, appPath]);

  const runStamp = new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
  const results = [];
  for (const config of selectedCaptures) {
    process.stdout.write(`recording ${config.id}...\n`);
    results.push(await captureVideo({ deviceUdid, bundleId, config, runStamp }));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    runStamp,
    build,
    captures: results.map((result) => ({
      id: result.id,
      stage: result.stage,
      variant: result.variant ?? null,
      durationMs: result.durationMs,
      video: path.relative(auditDir, result.videoPath),
    })),
  };
  if (captureFilter.size > 0) {
    try {
      const previous = JSON.parse(await readFile(manifestPath, "utf8"));
      const byId = new Map(previous.captures?.map((capture) => [capture.id, capture]) ?? []);
      for (const capture of manifest.captures) byId.set(capture.id, capture);
      manifest.captures = captures.flatMap((capture) => {
        const recorded = byId.get(capture.id);
        return recorded ? [recorded] : [];
      });
    } catch {}
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
