function matchFirst(text, pattern) {
  const match = String(text ?? "").match(pattern);
  return match?.[1]?.trim() ?? null;
}

function collectConfigBlock(text, configName) {
  const lines = String(text ?? "").split("\n");
  const marker = `${configName}:`;
  const markerIndex = lines.findIndex((line) => line.trim() === marker);
  if (markerIndex === -1) return "";

  const markerIndent = lines[markerIndex].match(/^\s*/)?.[0].length ?? 0;
  const blockLines = [];
  for (const line of lines.slice(markerIndex + 1)) {
    if (line.trim() === "") {
      blockLines.push(line);
      continue;
    }

    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (indent <= markerIndent) break;
    blockLines.push(line);
  }

  return blockLines.join("\n");
}

function extractSettingValue(text, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = matchFirst(text, new RegExp(`^\\s*${escaped}:\\s*(.+)\\s*$`, "m"));
  if (!value) return null;
  return value.replace(/^["']|["']$/g, "");
}

function extractConfigValue(block, primaryKey, fallbackKey) {
  return extractSettingValue(block, primaryKey) ?? extractSettingValue(block, fallbackKey);
}

export function collectIosProjectConfig(projectYml) {
  const stagingBlock = collectConfigBlock(projectYml, "Staging");
  const releaseBlock = collectConfigBlock(projectYml, "Release");

  return {
    shell: {
      displayName: extractSettingValue(projectYml, "INFOPLIST_KEY_CFBundleDisplayName"),
      marketingVersion: extractSettingValue(projectYml, "MARKETING_VERSION"),
      buildNumber: extractSettingValue(projectYml, "CURRENT_PROJECT_VERSION"),
      bundleId: extractSettingValue(projectYml, "PRODUCT_BUNDLE_IDENTIFIER"),
    },
    releaseConfig: {
      stagingBaseUrl: extractConfigValue(
        stagingBlock,
        "BenyuanShellStagingBaseURL",
        "INFOPLIST_KEY_BenyuanShellStagingBaseURL",
      ),
      productionBaseUrl: extractConfigValue(
        releaseBlock,
        "BenyuanShellProductionBaseURL",
        "INFOPLIST_KEY_BenyuanShellProductionBaseURL",
      ),
    },
  };
}

export function collectTestFlightExportStatus(distributionSummary, exportSummary) {
  const ipaName = Object.keys(distributionSummary ?? {})[0];
  const entries = ipaName ? distributionSummary[ipaName] : null;
  const app = Array.isArray(entries) ? entries[0] : null;
  if (!app) return null;

  const certificateType = app.certificate?.type ?? null;
  const profileName = app.profile?.name ?? null;
  const entitlements = app.entitlements ?? {};
  const isDistributionCertificate =
    typeof certificateType === "string" &&
    /Apple Distribution|iPhone Distribution|Cloud Managed Apple Distribution/.test(certificateType);
  const isAppStoreProfile =
    entitlements["beta-reports-active"] === true &&
    entitlements["get-task-allow"] === false &&
    typeof profileName === "string" &&
    /Store Provisioning Profile|App Store/i.test(profileName);
  const readyForAppStoreConnect =
    exportSummary?.method === "app-store-connect" && isDistributionCertificate && isAppStoreProfile;

  return {
    ipaPath: exportSummary?.ipaPath ?? null,
    method: exportSummary?.method ?? null,
    certificateType,
    certificateSha1: app.certificate?.SHA1 ?? null,
    profileName,
    profileUuid: app.profile?.UUID ?? null,
    teamId: app.team?.id ?? entitlements["com.apple.developer.team-identifier"] ?? null,
    betaReportsActive: entitlements["beta-reports-active"] === true,
    getTaskAllow: entitlements["get-task-allow"] ?? null,
    isDistributionCertificate,
    isAppStoreProfile,
    readyForAppStoreConnect,
  };
}
