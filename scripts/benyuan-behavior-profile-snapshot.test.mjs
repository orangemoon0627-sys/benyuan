import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { existsSync } from "node:fs";
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

const dataRoot = await mkdtemp(path.join(tmpdir(), "benyuan-profile-snapshot-"));
process.env.BENYUAN_DATA_ROOT = dataRoot;
delete process.env.BENYUAN_V3_STORE_PATH;

const {
  clearBenyuanCohortData,
  ensureBehaviorProfileSnapshot,
  getBehaviorProfileSnapshot,
  readBenyuanV3Store,
  savePart1Record,
} = await import("../src/lib/benyuan-v3-store.ts");

function part1(updatedAt = "2026-07-17T00:00:00.000Z") {
  return {
    part1_id: "part1_snapshot_contract",
    user_id: "usr_snapshot_contract",
    data_cohort: "beta",
    data_environment: "test",
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: updatedAt,
    answers: { B1_night_thoughts: "B1-6" },
    part1_data: { aesthetics: {}, philosophy: {}, narrative: {} },
    aggregated_traits: {
      big_five: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
      core_themes: [],
      archetype_hints: ["lone_seeker"],
    },
  };
}

test("behavior profile snapshots are immutable, versioned, and cohort-scoped", async (t) => {
  t.after(async () => rm(dataRoot, { recursive: true, force: true }));
  const original = part1();
  await savePart1Record(original);
  const first = await ensureBehaviorProfileSnapshot(original);
  const duplicate = await ensureBehaviorProfileSnapshot(original);
  assert.equal(duplicate.profile_revision, first.profile_revision);
  assert.equal(duplicate.created_at, first.created_at);
  assert.equal((await readBenyuanV3Store()).behavior_profile_snapshots[first.profile_revision]?.part1_id, original.part1_id);
  assert.equal((await getBehaviorProfileSnapshot(first.profile_revision))?.profile.revision, first.profile_revision);

  const changed = part1("2026-07-17T00:10:00.000Z");
  await savePart1Record(changed);
  const second = await ensureBehaviorProfileSnapshot(changed);
  assert.notEqual(second.profile_revision, first.profile_revision);
  assert.equal(Object.keys((await readBenyuanV3Store()).behavior_profile_snapshots).length, 2);
  await assert.rejects(() => ensureBehaviorProfileSnapshot(changed, undefined, first.profile), /behavior_profile_source_mismatch/);

  const cleared = await clearBenyuanCohortData("beta");
  assert.equal(cleared.deleted_behavior_profile_snapshots, 2);
  assert.equal(Object.keys((await readBenyuanV3Store()).behavior_profile_snapshots).length, 0);
});
