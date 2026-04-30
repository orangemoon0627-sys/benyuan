#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  chooseSimulatorDevice,
  extractInstalledSimulatorSdkVersion,
} from "./benyuan-ios-native-smoke-lib.mjs";

const root = process.cwd();
const shellProjectDir = path.join(root, "mobile", "benyuan_origin_ios_shell");
const projectPath = path.join(shellProjectDir, "BenyuanOriginShell.xcodeproj");
const outputDir = path.join(root, "output");
const outputPath = path.join(outputDir, "benyuan-ios-shell-build.json");
const desiredDeviceName = process.env.BENYUAN_SIM_DEVICE ?? "iPhone 17";
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? "Debug";
const scheme = "BenyuanOriginShell";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
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

async function main() {
  await mkdir(outputDir, { recursive: true });
  run("xcodegen", ["generate"], { cwd: shellProjectDir });

  const { sdkVersion, device } = collectSimulatorEnvironment();

  try {
    run("xcrun", ["simctl", "boot", device.udid]);
  } catch {}
  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);

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

  try {
    const buildSettings = parseBuildSettings(run("xcodebuild", [...buildArgs, "-showBuildSettings"], { cwd: shellProjectDir }));
    run("xcodebuild", [...buildArgs, "CODE_SIGNING_ALLOWED=NO", "build"], { cwd: shellProjectDir });

    const summary = {
      generatedAt: new Date().toISOString(),
      configuration,
      sdkVersion,
      device: {
        name: device.name,
        udid: device.udid,
        state: device.state,
      },
      bundleId: buildSettings.PRODUCT_BUNDLE_IDENTIFIER ?? null,
      product: buildSettings.FULL_PRODUCT_NAME ?? null,
      targetBuildDir: buildSettings.TARGET_BUILD_DIR ?? null,
    };

    await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
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

    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
