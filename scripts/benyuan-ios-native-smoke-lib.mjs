function parseVersion(value) {
  const source = String(value ?? "");
  const runtimeIdentifierMatch = source.match(/iOS[-_](\d+)[-_](\d+)/i);
  if (runtimeIdentifierMatch) {
    return {
      major: Number(runtimeIdentifierMatch[1]),
      minor: Number(runtimeIdentifierMatch[2]),
      raw: `${runtimeIdentifierMatch[1]}.${runtimeIdentifierMatch[2]}`,
    };
  }

  const match = source.match(/(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), raw: `${match[1]}.${match[2]}` };
}

export function chooseSimulatorDevice({ desiredDeviceName, installedSimulatorSdkVersion, devicesByRuntime }) {
  const installed = parseVersion(installedSimulatorSdkVersion);
  if (!installed) return null;

  const runtimeEntries = Object.entries(devicesByRuntime ?? {})
    .map(([runtime, devices]) => ({
      runtime,
      version: parseVersion(runtime),
      devices: Array.isArray(devices) ? devices : [],
    }))
    .filter((entry) => {
      if (!entry.version) return false;
      if (entry.version.major !== installed.major) return false;
      return entry.version.minor <= installed.minor;
    })
    .sort((left, right) => {
      if (!left.version || !right.version) return 0;
      if (right.version.major !== left.version.major) return right.version.major - left.version.major;
      return right.version.minor - left.version.minor;
    });

  for (const entry of runtimeEntries) {
    const available = entry.devices.filter((device) => device?.isAvailable);
    const exact = available.find((device) => device.name === desiredDeviceName);
    if (exact) return exact;

    const bootedIPhone = available.find((device) => String(device.name).includes("iPhone") && device.state === "Booted");
    if (bootedIPhone) return bootedIPhone;

    const anyIPhone = available.find((device) => String(device.name).includes("iPhone"));
    if (anyIPhone) return anyIPhone;
  }

  return null;
}

export function extractInstalledSimulatorSdkVersion(rawSdkList) {
  const lines = String(rawSdkList ?? "").split("\n");
  const markerIndex = lines.findIndex((line) => line.includes("iOS Simulator SDKs:"));
  if (markerIndex === -1) return null;

  for (const line of lines.slice(markerIndex + 1)) {
    const version = parseVersion(line);
    if (version) return version.raw;
    if (line.trim() === "") break;
  }

  return null;
}
