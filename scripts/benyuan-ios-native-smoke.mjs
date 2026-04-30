#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import {
  chooseSimulatorDevice,
  extractInstalledSimulatorSdkVersion,
} from './benyuan-ios-native-smoke-lib.mjs';

const desiredDeviceName = process.env.BENYUAN_SIM_DEVICE ?? 'iPhone 17';
const baseUrl = process.env.BENYUAN_BASE_URL ?? 'http://127.0.0.1:3015';
const configuration = process.env.BENYUAN_IOS_CONFIGURATION ?? 'Debug';
const fixtureName = 'native-smoke-fixture.png';
const outputDir = path.join(process.cwd(), 'output');
const tempDir = path.join(os.tmpdir(), 'benyuan-ios-native-smoke');
const jsonPath = path.join(outputDir, 'benyuan-ios-native-smoke.json');
const shellProjectDir = path.join(process.cwd(), 'mobile', 'benyuan_origin_ios_shell');
const projectPath = path.join(shellProjectDir, 'BenyuanOriginShell.xcodeproj');
const scheme = 'BenyuanOriginShell';
const runConfigs = [
  {
    source: 'library',
    route: '/lab/native-handoff/smoke?autorun=1&source=library',
    screenshotPath: path.join(outputDir, 'benyuan-ios-native-smoke-library.png'),
  },
  {
    source: 'camera',
    route: '/lab/native-handoff/smoke?autorun=1&source=camera',
    screenshotPath: path.join(outputDir, 'benyuan-ios-native-smoke-camera.png'),
  },
];

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectSimulatorEnvironment() {
  const sdkVersion = extractInstalledSimulatorSdkVersion(run('xcodebuild', ['-showsdks']));
  const deviceList = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '-j']));
  const device = chooseSimulatorDevice({
    desiredDeviceName,
    installedSimulatorSdkVersion: sdkVersion,
    devicesByRuntime: deviceList.devices,
  });

  if (!device) {
    const runtimes = Object.keys(deviceList.devices ?? {}).join(', ');
    throw new Error(`ios_simulator_unavailable: simulator sdk=${sdkVersion ?? 'unknown'} runtimes=[${runtimes}]`);
  }

  return { sdkVersion, device };
}

function parseBuildSettings(raw) {
  const settings = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (!match) continue;
    settings[match[1]] = match[2].trim();
  }
  return settings;
}

function collectDestinations() {
  try {
    return run('xcodebuild', ['-project', projectPath, '-scheme', scheme, '-showdestinations'], { cwd: shellProjectDir });
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
    return [stdout, stderr].filter(Boolean).join('\n');
  }
}

function buildSimulatorApp(device) {
  const buildArgs = [
    '-project',
    projectPath,
    '-scheme',
    scheme,
    '-configuration',
    configuration,
    '-destination',
    `id=${device.udid}`,
  ];

  const rawSettings = run('xcodebuild', [...buildArgs, '-showBuildSettings'], { cwd: shellProjectDir });
  const settings = parseBuildSettings(rawSettings);
  const targetBuildDir = settings.TARGET_BUILD_DIR;
  const fullProductName = settings.FULL_PRODUCT_NAME;
  const bundleId = settings.PRODUCT_BUNDLE_IDENTIFIER;

  if (!targetBuildDir || !fullProductName || !bundleId) {
    throw new Error('ios_build_settings_incomplete');
  }

  run('xcodebuild', [...buildArgs, 'CODE_SIGNING_ALLOWED=NO', 'build'], { cwd: shellProjectDir });

  return {
    appPath: path.join(targetBuildDir, fullProductName),
    bundleId,
    configuration,
  };
}

function terminateApp(udid, bundleId) {
  try {
    run('xcrun', ['simctl', 'terminate', udid, bundleId]);
  } catch {}
}

function launchRun(udid, bundleId, config) {
  return run('xcrun', [
    'simctl',
    'launch',
    udid,
    bundleId,
    '--args',
    '--benyuan-base-url',
    baseUrl,
    '--benyuan-route',
    config.route,
    '--benyuan-native-pick-fixture',
    fixtureName,
  ]);
}

async function executeRun(udid, bundleId, config) {
  terminateApp(udid, bundleId);
  const launchedAt = new Date().toISOString();
  const launchOutput = launchRun(udid, bundleId, config);
  await sleep(6500);
  const tempScreenshotPath = path.join(tempDir, path.basename(config.screenshotPath));
  run('xcrun', ['simctl', 'io', udid, 'screenshot', tempScreenshotPath]);
  await copyFile(tempScreenshotPath, config.screenshotPath);

  return {
    source: config.source,
    route: config.route,
    launchedAt,
    screenshotPath: config.screenshotPath,
    launchOutput,
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
  run('xcodegen', ['generate'], { cwd: shellProjectDir });

  const { sdkVersion, device } = collectSimulatorEnvironment();

  try {
    run('xcrun', ['simctl', 'boot', device.udid]);
  } catch {}
  run('xcrun', ['simctl', 'bootstatus', device.udid, '-b']);

  const { appPath, bundleId } = buildSimulatorApp(device);

  terminateApp(device.udid, bundleId);
  try {
    run('xcrun', ['simctl', 'uninstall', device.udid, bundleId]);
  } catch {}
  run('xcrun', ['simctl', 'install', device.udid, appPath]);

  const runs = [];
  for (const config of runConfigs) {
    runs.push(await executeRun(device.udid, bundleId, config));
  }
  terminateApp(device.udid, bundleId);

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration,
    sdkVersion,
    device: { name: device.name, udid: device.udid },
    bundleId,
    baseUrl,
    fixtureName,
    appPath,
    runs,
  };

  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : '';
  const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
  const message = [
    error instanceof Error ? error.message : String(error),
    stdout,
    stderr,
    collectDestinations(),
  ]
    .filter(Boolean)
    .join('\n\n');
  console.error(message);
  process.exit(1);
});
