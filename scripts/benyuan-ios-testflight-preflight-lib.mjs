import path from "node:path";

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
  return extractSettingValue(block, primaryKey) ?? (fallbackKey ? extractSettingValue(block, fallbackKey) : null);
}

export function collectIosProjectConfig(projectYml) {
  const stagingBlock = collectConfigBlock(projectYml, "Staging");
  const releaseBlock = collectConfigBlock(projectYml, "Release");
  const baseBlock = collectConfigBlock(projectYml, "base");

  return {
    shell: {
      displayName: extractSettingValue(projectYml, "INFOPLIST_KEY_CFBundleDisplayName"),
      marketingVersion: extractSettingValue(projectYml, "MARKETING_VERSION"),
      buildNumber: extractSettingValue(projectYml, "CURRENT_PROJECT_VERSION"),
      bundleId: extractSettingValue(projectYml, "PRODUCT_BUNDLE_IDENTIFIER"),
    },
    releaseConfig: {
      stagingBaseUrl:
        extractConfigValue(releaseBlock, "BenyuanShellStagingBaseURL", "INFOPLIST_KEY_BenyuanShellStagingBaseURL") ??
        extractConfigValue(stagingBlock, "BenyuanShellStagingBaseURL", "INFOPLIST_KEY_BenyuanShellStagingBaseURL"),
      productionBaseUrl: extractConfigValue(
        releaseBlock,
        "BenyuanShellProductionBaseURL",
        "INFOPLIST_KEY_BenyuanShellProductionBaseURL",
      ),
    },
    authConfig: {
      wechatAppId: extractConfigValue(releaseBlock, "BENYUAN_WECHAT_APP_ID") ?? extractSettingValue(baseBlock, "BENYUAN_WECHAT_APP_ID"),
      wechatUniversalLink:
        extractConfigValue(releaseBlock, "BENYUAN_WECHAT_UNIVERSAL_LINK") ?? extractSettingValue(baseBlock, "BENYUAN_WECHAT_UNIVERSAL_LINK"),
      wechatAssociatedDomain:
        extractConfigValue(releaseBlock, "BENYUAN_WECHAT_ASSOCIATED_DOMAIN") ?? extractSettingValue(baseBlock, "BENYUAN_WECHAT_ASSOCIATED_DOMAIN"),
    },
  };
}

function isMissingWechatAppId(value) {
  return !value || !/^wx[a-zA-Z0-9]{8,}$/.test(value);
}

function isMissingWechatUniversalLink(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol !== "https:" || !url.pathname.startsWith("/app/benyuan/");
  } catch {
    return true;
  }
}

function isMissingWechatAssociatedDomain(value) {
  return !value || value === "applinks:" || !/^applinks:[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

function sameEndpoint(left, right) {
  if (!left || !right) return false;
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    return (
      leftUrl.protocol === rightUrl.protocol &&
      leftUrl.hostname.toLowerCase() === rightUrl.hostname.toLowerCase() &&
      (leftUrl.port || defaultPort(leftUrl.protocol)) === (rightUrl.port || defaultPort(rightUrl.protocol))
    );
  } catch {
    return left === right;
  }
}

function isHttpsEndpoint(value) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function defaultPort(protocol) {
  if (protocol === "https:") return "443";
  if (protocol === "http:") return "80";
  return "";
}

export function evaluateIosAuthReleaseReadiness(input) {
  const blockers = [];
  const warnings = [];
  const authSmokeScriptsPresent = input.authSmokeScriptsPresent ?? {};
  const entitlementsText = String(input.entitlementsText ?? "");
  const releaseConfig = input.releaseConfig ?? {};

  if (!entitlementsText.includes("com.apple.developer.applesignin")) {
    blockers.push("apple_sign_in_entitlement_missing");
  }
  if (!releaseConfig.productionBaseUrl) {
    blockers.push("release_production_base_url_missing");
  }
  if (!releaseConfig.stagingBaseUrl) {
    blockers.push("release_fallback_base_url_missing");
  }
  if (releaseConfig.productionBaseUrl && !isHttpsEndpoint(releaseConfig.productionBaseUrl)) {
    blockers.push("release_production_base_url_not_https");
  }
  if (releaseConfig.stagingBaseUrl && !isHttpsEndpoint(releaseConfig.stagingBaseUrl)) {
    blockers.push("release_network_fallback_not_https");
  }
  if (sameEndpoint(releaseConfig.productionBaseUrl, releaseConfig.stagingBaseUrl)) {
    blockers.push("release_network_fallback_matches_primary");
  }
  if (!input.authRunbookPresent) {
    blockers.push("auth_runbook_missing");
  }
  if (!authSmokeScriptsPresent.contract) {
    blockers.push("auth_contract_smoke_missing");
  }
  if (!authSmokeScriptsPresent.runtime) {
    blockers.push("auth_runtime_smoke_missing");
  }
  if (!authSmokeScriptsPresent.smsAliyun) {
    blockers.push("auth_sms_aliyun_smoke_missing");
  }

  const authConfig = input.authConfig ?? {};
  if (isMissingWechatAppId(authConfig.wechatAppId)) {
    warnings.push("wechat_app_id_missing");
  }
  if (isMissingWechatUniversalLink(authConfig.wechatUniversalLink)) {
    warnings.push("wechat_universal_link_missing");
  }
  if (isMissingWechatAssociatedDomain(authConfig.wechatAssociatedDomain)) {
    warnings.push("wechat_associated_domain_missing");
  }
  if (!entitlementsText.includes("com.apple.developer.associated-domains")) {
    warnings.push("wechat_associated_domains_entitlement_missing");
  }

  return {
    readyForCoreAuth: blockers.length === 0,
    readyForWechatRelease: blockers.length === 0 && warnings.length === 0,
    blockers,
    warnings,
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

function parseTimestamp(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

export const BENYUAN_IOS_RELEASE_ARTIFACT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function evaluateIosReleaseArtifactSet(input) {
  const blockers = [];
  const now = parseTimestamp(input.now) ?? Date.now();
  const maxAgeMs = input.maxAgeMs ?? BENYUAN_IOS_RELEASE_ARTIFACT_MAX_AGE_MS;
  const current = input.currentProvenance ?? null;
  const artifacts = [
    ["shell_build", input.shellBuild],
    ["native_smoke", input.nativeSmoke],
    ["release_archive", input.archive],
    ["app_store_connect_export", input.exportSummary],
  ];

  if (!current?.sourceHash || !current?.gitRevision) {
    blockers.push("ios_source_provenance_unavailable");
  } else if (current.gitDirty === true) {
    blockers.push("ios_source_tree_dirty");
  }

  const timestamps = new Map();
  for (const [name, artifact] of artifacts) {
    if (!artifact) continue;
    const artifactTime = parseTimestamp(artifact.generatedAt);
    timestamps.set(name, artifactTime);
    if (artifactTime === null) {
      blockers.push(`${name}_timestamp_missing`);
    } else if (artifactTime > now + 5 * 60 * 1000) {
      blockers.push(`${name}_timestamp_in_future`);
    } else if (now - artifactTime > maxAgeMs) {
      blockers.push(`${name}_stale`);
    }

    const provenance = artifact.provenance;
    if (!provenance?.sourceHash || !provenance?.gitRevision) {
      blockers.push(`${name}_provenance_missing`);
      continue;
    }
    if (current?.sourceHash && provenance.sourceHash !== current.sourceHash) {
      blockers.push(`${name}_source_mismatch`);
    }
    if (current?.gitRevision && provenance.gitRevision !== current.gitRevision) {
      blockers.push(`${name}_revision_mismatch`);
    }
    if (provenance.gitDirty === true) {
      blockers.push(`${name}_built_from_dirty_tree`);
    }
  }

  const buildTime = timestamps.get("shell_build");
  const smokeTime = timestamps.get("native_smoke");
  const archiveTime = timestamps.get("release_archive");
  const exportTime = timestamps.get("app_store_connect_export");
  if (buildTime !== null && archiveTime !== null && buildTime !== undefined && archiveTime !== undefined && archiveTime < buildTime) {
    blockers.push("release_archive_predates_shell_build");
  }
  if (smokeTime !== null && archiveTime !== null && smokeTime !== undefined && archiveTime !== undefined && archiveTime < smokeTime) {
    blockers.push("release_archive_predates_native_smoke");
  }
  if (archiveTime !== null && exportTime !== null && archiveTime !== undefined && exportTime !== undefined && exportTime < archiveTime) {
    blockers.push("app_store_connect_export_stale");
  }

  return {
    ready: blockers.length === 0,
    maxAgeMs,
    blockers: [...new Set(blockers)],
  };
}

export function evaluateTestFlightExportFreshness(input) {
  const blockers = [];
  const archive = input.archive ?? null;
  const exportSummary = input.exportSummary ?? null;
  const exportDistribution = input.exportDistribution ?? null;

  if (!exportSummary) {
    blockers.push("app_store_connect_export_missing");
  } else {
    if (exportSummary.method !== "app-store-connect") {
      blockers.push("app_store_connect_export_method_mismatch");
    }

    if (!exportSummary.archivePath || !archive?.archivePath || exportSummary.archivePath !== archive.archivePath) {
      blockers.push("app_store_connect_export_archive_mismatch");
    }

    const archiveTime = parseTimestamp(archive?.generatedAt);
    const exportTime = parseTimestamp(exportSummary.generatedAt);
    if (archiveTime === null || exportTime === null) {
      blockers.push("app_store_connect_export_timestamp_missing");
    } else if (exportTime < archiveTime) {
      blockers.push("app_store_connect_export_stale");
    }

    if (!exportSummary.ipaPath || input.ipaExists !== true) {
      blockers.push("app_store_connect_ipa_missing");
    }
  }

  if (input.distributionSummaryExists !== true) {
    blockers.push("app_store_connect_distribution_summary_missing");
  }

  if (exportDistribution?.readyForAppStoreConnect !== true) {
    blockers.push("app_store_connect_export_not_app_store_ready");
  }

  return {
    readyForAppStoreConnect: blockers.length === 0,
    blockers,
  };
}

export function resolveTestFlightDistributionSummaryPath(defaultPath, exportSummary) {
  return exportSummary?.exportDir
    ? path.join(exportSummary.exportDir, "DistributionSummary.plist")
    : defaultPath;
}

export function evaluateRequestedIosArchive(input) {
  const blockers = [];
  const archive = input.archive ?? null;
  const requestedArchivePath = input.requestedArchivePath ?? null;
  const requestedIdentity = input.requestedIdentity ?? null;
  const recordedIdentity = archive?.archiveIdentity ?? null;

  if (!archive?.archivePath || !requestedArchivePath || archive.archivePath !== requestedArchivePath) {
    blockers.push("upload_archive_path_mismatch");
  }
  if (!recordedIdentity?.archiveSha256 || !recordedIdentity?.executableSha256) {
    blockers.push("release_archive_identity_missing");
  }
  if (!requestedIdentity?.archiveSha256 || !requestedIdentity?.executableSha256) {
    blockers.push("upload_archive_identity_unavailable");
  } else if (recordedIdentity?.archiveSha256 && (
    recordedIdentity.archiveSha256 !== requestedIdentity.archiveSha256 ||
    recordedIdentity.archiveEntryCount !== requestedIdentity.archiveEntryCount ||
    recordedIdentity.archiveByteSize !== requestedIdentity.archiveByteSize ||
    recordedIdentity.executableSha256 !== requestedIdentity.executableSha256 ||
    recordedIdentity.executableSize !== requestedIdentity.executableSize
  )) {
    blockers.push("upload_archive_binary_mismatch");
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}
