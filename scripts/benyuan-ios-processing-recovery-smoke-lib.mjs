export function latestEventMessage(events, pattern) {
  if (!Array.isArray(events)) return null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const message = String(events[index]?.message ?? "");
    if (pattern.test(message)) return message;
  }
  return null;
}

export function extractJobId(message) {
  const match = String(message ?? "").match(/\bjob_id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function assertProcessingRecoverySummary(summary) {
  const events = summary?.afterRelaunch?.e2eEvents ?? [];
  const startedMessage = latestEventMessage(summary?.beforeTerminate?.e2eEvents, /native_job_started kind=constellation/);
  const restoredMessage = latestEventMessage(events, /constellation_generated constellation_id=/);
  const startedJobId = extractJobId(startedMessage);

  if (!startedJobId) {
    throw new Error("ios_processing_recovery_missing_started_constellation_job");
  }
  if (!restoredMessage) {
    throw new Error("ios_processing_recovery_missing_recovered_constellation");
  }
  if (summary?.afterRelaunch?.session?.activeGenerationJobId) {
    throw new Error(`ios_processing_recovery_job_not_cleared:${summary.afterRelaunch.session.activeGenerationJobId}`);
  }
  if (!summary?.afterRelaunch?.session?.constellationId) {
    throw new Error("ios_processing_recovery_missing_session_constellation");
  }
  if (summary?.showsNativeError) {
    throw new Error("ios_processing_recovery_native_error");
  }
  if (summary?.showsShellError) {
    throw new Error("ios_processing_recovery_shell_error");
  }

  return {
    startedJobId,
    constellationId: summary.afterRelaunch.session.constellationId,
  };
}
