import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.resolve("src", specifier.slice(2));
      const resolvedPath = existsSync(targetPath) ? targetPath : `${targetPath}.ts`;
      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { appendNativeGenerationEvent, eventsAfterSequence } = await import("../src/lib/benyuan-native-generation-events.ts");
const {
  claimNativeGenerationLease,
  hasActiveNativeGenerationLease,
  releaseNativeGenerationLease,
  renewNativeGenerationLease,
} = await import("../src/lib/benyuan-native-generation-lease.ts");

function job() {
  return {
    job_id: "job_event_contract",
    user_id: "usr_event_contract",
    part1_id: "part1_event_contract",
    data_cohort: "test",
    data_environment: "test",
    kind: "theater",
    status: "queued",
    current_stage: "queued",
    progress: 0.04,
    message: "queued",
    can_resume_in_background: true,
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
  };
}

test("generation events use monotonic sequence ids and cursor filtering", () => {
  const created = appendNativeGenerationEvent(job(), { event_type: "created", occurred_at: "2026-07-17T00:00:00.000Z" });
  const running = { ...created, status: "running", current_stage: "multimodal", message: "multimodal" };
  const staged = appendNativeGenerationEvent(running, { event_type: "stage_started", occurred_at: "2026-07-17T00:00:01.000Z" });
  const checkpoint = appendNativeGenerationEvent(staged, {
    event_type: "checkpoint",
    occurred_at: "2026-07-17T00:00:02.000Z",
    checkpoint: "behavior_profile_ready",
    behavior_profile_revision: "bp2_12345678",
  });

  assert.deepEqual(checkpoint.events.map((event) => event.sequence), [1, 2, 3]);
  assert.deepEqual(checkpoint.events.map((event) => event.event_id), ["job_event_contract:1", "job_event_contract:2", "job_event_contract:3"]);
  assert.deepEqual(eventsAfterSequence(checkpoint, 1).map((event) => event.sequence), [2, 3]);
  assert.equal(checkpoint.events[2].behavior_profile_revision, "bp2_12345678");
});

test("resume events preserve the prior ledger instead of resetting progress history", () => {
  const created = appendNativeGenerationEvent(job(), { event_type: "created", occurred_at: "2026-07-17T00:00:00.000Z" });
  const resumed = appendNativeGenerationEvent({ ...created, status: "running", current_stage: "multimodal" }, {
    event_type: "resumed",
    occurred_at: "2026-07-17T00:03:01.000Z",
    checkpoint: "multimodal_resume",
  });
  assert.equal(resumed.event_sequence, 2);
  assert.equal(resumed.events[0].event_type, "created");
  assert.equal(resumed.events[1].event_type, "resumed");
});

test("a durable lease allows one worker and fences a stale owner after takeover", () => {
  const now = new Date("2026-07-17T00:00:00.000Z");
  const first = claimNativeGenerationLease(job(), { owner: "worker_a", now, legacyStaleAfterMs: 180_000 });
  assert.equal(first.acquired, true);
  assert.equal(first.job.run_attempt, 1);
  assert.equal(hasActiveNativeGenerationLease(first.job, now.getTime()), true);

  const blocked = claimNativeGenerationLease(first.job, {
    owner: "worker_b",
    now: new Date("2026-07-17T00:01:00.000Z"),
    legacyStaleAfterMs: 180_000,
  });
  assert.equal(blocked.acquired, false);

  const renewed = renewNativeGenerationLease(first.job, { owner: "worker_a", now: new Date("2026-07-17T00:04:00.000Z") });
  assert.ok(renewed);
  const takeover = claimNativeGenerationLease(renewed, {
    owner: "worker_b",
    now: new Date("2026-07-17T00:09:01.000Z"),
    legacyStaleAfterMs: 180_000,
  });
  assert.equal(takeover.acquired, true);
  assert.equal(takeover.job.run_attempt, 2);
  assert.equal(renewNativeGenerationLease(takeover.job, { owner: "worker_a", now: new Date("2026-07-17T00:09:02.000Z") }), undefined);
  assert.equal(releaseNativeGenerationLease(takeover.job, "worker_a"), undefined);
  assert.equal(releaseNativeGenerationLease(takeover.job, "worker_b")?.lease_owner, undefined);
});

test("recent legacy running jobs are not double-claimed before their stale window", () => {
  const legacy = {
    ...job(),
    status: "running",
    current_stage: "theater",
    updated_at: "2026-07-17T00:00:00.000Z",
  };
  const recent = claimNativeGenerationLease(legacy, {
    owner: "worker_a",
    now: new Date("2026-07-17T00:02:00.000Z"),
    legacyStaleAfterMs: 180_000,
  });
  assert.equal(recent.acquired, false);
  const stale = claimNativeGenerationLease(legacy, {
    owner: "worker_a",
    now: new Date("2026-07-17T00:03:01.000Z"),
    legacyStaleAfterMs: 180_000,
  });
  assert.equal(stale.acquired, true);
});
