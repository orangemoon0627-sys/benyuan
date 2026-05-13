export function buildLaunchArgs({
  udid,
  bundleId,
  stdoutPath,
  stderrPath,
  baseUrl,
  fixtureName,
}) {
  return [
    "simctl",
    "launch",
    `--stdout=${stdoutPath}`,
    `--stderr=${stderrPath}`,
    "--terminate-running-process",
    udid,
    bundleId,
    "--benyuan-base-url",
    baseUrl,
    "--benyuan-native-e2e-autorun",
    "--benyuan-native-pick-fixture",
    fixtureName,
  ];
}

export function shouldTreatAppLogsAsNativeError(logText) {
  return String(logText ?? "").includes("BENYUAN_E2E_ERROR");
}

export function assertAllRequiredRuntimeStagesLive(latestRuntime) {
  for (const stage of ["multimodal", "theater", "constellation"]) {
    const latest = latestRuntime?.[stage];
    if (!latest) {
      throw new Error(`ios_staging_e2e_stage_missing:${stage}`);
    }
    if (latest.runtime_mode === "fallback") {
      throw new Error(`ios_staging_e2e_stage_fallback:${stage}:${latest.error ?? "unknown"}`);
    }
    if (latest.runtime_mode !== "live") {
      throw new Error(`ios_staging_e2e_stage_not_live:${stage}:${latest.runtime_mode ?? "unknown"}`);
    }
  }
}

export function assertAllRequiredRuntimeStagesBelongToSession({
  latestRuntime,
  nativeSession,
  launchedAtMs,
}) {
  const session = nativeSession?.session;
  const expectedPart1Id = session?.part1Id;
  const expectedPart2Id = session?.part2Id;

  if (!expectedPart1Id) {
    throw new Error("ios_staging_e2e_native_session_missing_part1");
  }

  for (const stage of ["multimodal", "theater", "constellation"]) {
    const latest = latestRuntime?.[stage];
    if (!latest) {
      throw new Error(`ios_staging_e2e_stage_missing:${stage}`);
    }

    const recordedAtMs = Date.parse(latest.recorded_at ?? "");
    if (!Number.isFinite(recordedAtMs) || recordedAtMs < launchedAtMs) {
      throw new Error(`ios_staging_e2e_stage_stale:${stage}:${latest.recorded_at ?? "unknown"}`);
    }

    if (latest.part1_id !== expectedPart1Id) {
      throw new Error(`ios_staging_e2e_stage_part1_mismatch:${stage}:${latest.part1_id ?? "missing"}:${expectedPart1Id}`);
    }

    if (stage === "constellation") {
      if (!expectedPart2Id) {
        throw new Error("ios_staging_e2e_native_session_missing_part2");
      }
      if (latest.part2_id !== expectedPart2Id) {
        throw new Error(`ios_staging_e2e_stage_part2_mismatch:${stage}:${latest.part2_id ?? "missing"}:${expectedPart2Id}`);
      }
    }
  }
}

export function assertNativeConstellationPersisted({ nativeSession }) {
  const constellationId = nativeSession?.session?.constellationId;
  if (!constellationId) {
    throw new Error("ios_staging_e2e_native_session_missing_constellation");
  }

  const events = Array.isArray(nativeSession?.e2eEvents) ? nativeSession.e2eEvents : [];
  const expectedMessage = `constellation_generated constellation_id=${constellationId}`;
  if (!events.some((event) => event?.message === expectedMessage)) {
    throw new Error(`ios_staging_e2e_native_constellation_event_missing:${constellationId}`);
  }
}

export function safeNativeSessionSummary(session) {
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
    answerCount: countObjectKeys(session.answers),
    uploadQuestionCount: countObjectKeys(session.uploaded_assets),
  };
}

export function safeNativeE2EEvents(events, maxCount = 80) {
  if (!Array.isArray(events)) return [];
  return events.slice(-maxCount).map((event) => ({
    recordedAt: event?.recorded_at ?? event?.recordedAt ?? null,
    message: String(event?.message ?? ""),
  }));
}

function countObjectKeys(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.keys(value).length;
}
