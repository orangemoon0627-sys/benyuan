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
