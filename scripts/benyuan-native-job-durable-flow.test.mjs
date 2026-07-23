import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
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

const dataRoot = await mkdtemp(path.join(tmpdir(), "benyuan-durable-job-"));
process.env.BENYUAN_DATA_ROOT = dataRoot;
process.env.BENYUAN_LLM_LIVE = "0";
delete process.env.BENYUAN_V3_STORE_PATH;

const {
  getNativeGenerationJob,
  readBenyuanV3Store,
  runNativeGenerationJob,
  savePart1Record,
  startNativeGenerationJob,
} = await import("../src/lib/benyuan-v3-store.ts");

function part1() {
  return {
    part1_id: "part1_durable_job",
    user_id: "usr_durable_job",
    data_cohort: "beta",
    data_environment: "test",
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
    answers: {
      A1_core_image: "A1-1",
      B1_night_thoughts: "B1-6",
      B2_decision_style: "B2-2",
      B5_relationship_philosophy: "B5-1",
    },
    part1_data: { aesthetics: {}, philosophy: {}, narrative: {} },
    aggregated_traits: {
      big_five: { openness: 60, conscientiousness: 50, extraversion: 40, agreeableness: 55, neuroticism: 50 },
      core_themes: ["meaning"],
      archetype_hints: ["lone_seeker"],
    },
  };
}

test("native theater jobs persist one profile snapshot and release their durable lease", async (t) => {
  t.after(async () => rm(dataRoot, { recursive: true, force: true }));
  const record = part1();
  await savePart1Record(record);
  const started = await startNativeGenerationJob({ kind: "theater", part1Id: record.part1_id });
  assert.ok(started);
  await runNativeGenerationJob(started.job_id);

  const completed = await getNativeGenerationJob(started.job_id);
  assert.equal(completed.status, "done");
  assert.equal(completed.run_attempt, 1);
  assert.equal(completed.lease_owner, undefined);
  assert.equal(completed.lease_expires_at, undefined);
  assert.match(completed.behavior_profile_revision, /^bp2_/u);
  assert.ok(completed.events.some((event) => event.checkpoint === "behavior_profile_ready"));
  assert.equal(completed.events.at(-1)?.event_type, "completed");

  const store = await readBenyuanV3Store();
  assert.equal(Object.keys(store.behavior_profile_snapshots).length, 1);
  const theater = store.theater_scripts[completed.theater_script_id];
  assert.equal(theater.behavior_profile_revision, completed.behavior_profile_revision);

  await runNativeGenerationJob(started.job_id);
  assert.equal((await getNativeGenerationJob(started.job_id)).run_attempt, 1, "completed jobs must stay idempotent");
});
