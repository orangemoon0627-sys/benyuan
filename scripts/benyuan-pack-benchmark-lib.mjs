export async function requestJsonWithRetry(requestJson, pathname, init, { retries = 2, backoffMs = 1500, sleep = defaultSleep } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await requestJson(pathname, init);
    } catch (error) {
      attempt += 1;
      if (attempt > retries) throw error;
      await sleep(backoffMs * attempt);
    }
  }
}

export async function requestStageJson(requestJson, pathname, init, { label, pack, events, retries = 1, backoffMs = 2000, sleep = defaultSleep } = {}) {
  let fallbackAttempt = 0;
  while (true) {
    const payload = await requestJsonWithRetry(requestJson, pathname, init, { retries, backoffMs, sleep });
    const runtimeMode = payload?.runtime?.mode;
    if (runtimeMode !== "fallback" || fallbackAttempt >= retries) {
      return payload;
    }

    fallbackAttempt += 1;
    const runtimeError = payload?.runtime?.error ? ` (${payload.runtime.error})` : "";
    events?.push({
      pack,
      stage: label,
      attempt: fallbackAttempt,
      mode: runtimeMode,
      error: payload?.runtime?.error ?? null,
      recordedAt: new Date().toISOString(),
    });
    console.warn(`${label} returned fallback runtime, retry ${fallbackAttempt}/${retries}${runtimeError}`);
    await sleep(backoffMs * fallbackAttempt);
  }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
