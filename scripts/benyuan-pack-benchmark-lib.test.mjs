import assert from "node:assert/strict";
import test from "node:test";

import { requestStageJson } from "./benyuan-pack-benchmark-lib.mjs";

test("requestStageJson honors the stage retry limit for transport failures", async () => {
  let calls = 0;
  const requestJson = async () => {
    calls += 1;
    throw new Error("transport failed");
  };

  await assert.rejects(
    requestStageJson(requestJson, "/api/theater/generate", { method: "POST" }, { retries: 1, sleep: async () => {} }),
    /transport failed/,
  );

  assert.equal(calls, 2);
});

test("requestStageJson retries fallback payloads with the same retry budget", async () => {
  let calls = 0;
  const requestJson = async () => {
    calls += 1;
    if (calls === 1) return { runtime: { mode: "fallback", error: "provider_timeout" } };
    return { runtime: { mode: "live" }, ok: true };
  };
  const events = [];

  const payload = await requestStageJson(requestJson, "/api/analyze/multimodal", { method: "POST" }, { retries: 1, events, label: "multimodal", pack: "A", sleep: async () => {} });

  assert.equal(payload.ok, true);
  assert.equal(calls, 2);
  assert.equal(events.length, 1);
  assert.equal(events[0].mode, "fallback");
});
