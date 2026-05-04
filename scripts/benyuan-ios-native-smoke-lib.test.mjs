import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseSimulatorDevice,
  extractInstalledSimulatorSdkVersion,
} from "./benyuan-ios-native-smoke-lib.mjs";

test("chooseSimulatorDevice prefers the requested device when runtime is installed", () => {
  const selected = chooseSimulatorDevice({
    desiredDeviceName: "iPhone 17",
    installedSimulatorSdkVersion: "26.4",
    devicesByRuntime: {
      "iOS 26.4": [
        { name: "iPhone 17", udid: "device-a", isAvailable: true, state: "Booted" },
        { name: "iPhone 17 Pro", udid: "device-b", isAvailable: true, state: "Shutdown" },
      ],
    },
  });

  assert.equal(selected?.udid, "device-a");
});

test("chooseSimulatorDevice falls back to another available iPhone on the highest compatible runtime", () => {
  const selected = chooseSimulatorDevice({
    desiredDeviceName: "iPhone 17",
    installedSimulatorSdkVersion: "26.4",
    devicesByRuntime: {
      "iOS 26.3": [
        { name: "iPhone 17", udid: "device-old", isAvailable: true, state: "Booted" },
      ],
      "iOS 26.4": [
        { name: "iPhone 17 Pro", udid: "device-new", isAvailable: true, state: "Shutdown" },
      ],
    },
  });

  assert.equal(selected?.udid, "device-new");
});

test("chooseSimulatorDevice falls back to the nearest same-major runtime when exact sdk runtime is missing", () => {
  const selected = chooseSimulatorDevice({
    desiredDeviceName: "iPhone 17",
    installedSimulatorSdkVersion: "26.4",
    devicesByRuntime: {
      "iOS 26.3": [
        { name: "iPhone 17", udid: "device-263", isAvailable: true, state: "Booted" },
      ],
      "iOS 25.9": [
        { name: "iPhone 17 Pro", udid: "device-259", isAvailable: true, state: "Shutdown" },
      ],
    },
  });

  assert.equal(selected?.udid, "device-263");
});

test("chooseSimulatorDevice understands CoreSimulator runtime identifiers", () => {
  const selected = chooseSimulatorDevice({
    desiredDeviceName: "iPhone 17",
    installedSimulatorSdkVersion: "26.4",
    devicesByRuntime: {
      "com.apple.CoreSimulator.SimRuntime.iOS-26-4": [
        { name: "iPhone 17", udid: "device-runtime-id", isAvailable: true, state: "Shutdown" },
      ],
    },
  });

  assert.equal(selected?.udid, "device-runtime-id");
});

test("chooseSimulatorDevice returns null when no compatible iPhone simulator exists", () => {
  const selected = chooseSimulatorDevice({
    desiredDeviceName: "iPhone 17",
    installedSimulatorSdkVersion: "26.4",
    devicesByRuntime: {
      "iOS 25.4": [
        { name: "iPad Air", udid: "device-ipad", isAvailable: true, state: "Shutdown" },
      ],
    },
  });

  assert.equal(selected, null);
});

test("extractInstalledSimulatorSdkVersion reads the simulator sdk version from xcodebuild output", () => {
  const version = extractInstalledSimulatorSdkVersion(`
iOS SDKs:
	iOS 26.4                       -sdk iphoneos26.4

iOS Simulator SDKs:
	Simulator - iOS 26.4         -sdk iphonesimulator26.4

macOS SDKs:
	macOS 26.4                   -sdk macosx26.4
`);

  assert.equal(version, "26.4");
});
