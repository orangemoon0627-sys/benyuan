import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  clearCachedMultimodalAnalysisForCohort,
  getBenyuanMultimodalCachePath,
  makeMultimodalCacheKey,
  MULTIMODAL_STAGE_PROMPT_VERSION,
  readCachedMultimodalAnalysis,
  writeCachedMultimodalAnalysis,
} from "../src/lib/benyuan-multimodal-cache.ts";

test("multimodal cache version tracks the structured behavioral evidence contract", () => {
  assert.match(MULTIMODAL_STAGE_PROMPT_VERSION, /^v4-behavioral-evidence-/);
});

async function withTempDataRoot(run) {
  const previousRoot = process.env.BENYUAN_DATA_ROOT;
  const previousStorePath = process.env.BENYUAN_V3_STORE_PATH;
  const dataRoot = await mkdtemp(path.join(tmpdir(), "benyuan-multimodal-cache-"));
  process.env.BENYUAN_DATA_ROOT = dataRoot;
  delete process.env.BENYUAN_V3_STORE_PATH;
  try {
    await run(dataRoot);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.BENYUAN_DATA_ROOT;
    } else {
      process.env.BENYUAN_DATA_ROOT = previousRoot;
    }
    if (previousStorePath === undefined) {
      delete process.env.BENYUAN_V3_STORE_PATH;
    } else {
      process.env.BENYUAN_V3_STORE_PATH = previousStorePath;
    }
    await rm(dataRoot, { recursive: true, force: true });
  }
}

test("persistUploadedAsset stores sha256 and returns it in uploaded asset refs", async () => {
  await withTempDataRoot(async () => {
    const { clearBenyuanCohortData } = await import("../src/lib/benyuan-v3-store.ts");
    const { persistUploadedAsset, readUploadedAssetBuffer } = await import("../src/lib/benyuan-v3-assets.ts");
    const ref = await persistUploadedAsset({
      ownerUserId: "usr_fixture",
      questionId: "A2_music_analysis",
      fileName: "music.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fixture-image"),
      uploadOrigin: "runtime-test",
    });

    assert.match(ref.sha256, /^[a-f0-9]{64}$/);
    const loaded = await readUploadedAssetBuffer(ref.asset_id);
    assert.equal(loaded?.stored.sha256, ref.sha256);
    assert.equal(path.extname(loaded?.stored.stored_path ?? ""), ".jpg", "stored extension must come from the validated MIME type");

    const cleared = await clearBenyuanCohortData("beta");
    assert.equal(cleared.deleted_uploaded_assets, 1);
    assert.equal(cleared.deleted_upload_files, 1);
    assert.equal(await readUploadedAssetBuffer(ref.asset_id), null, "cohort clearing must remove uploaded-asset metadata");
    await assert.rejects(() => readFile(loaded?.stored.stored_path ?? ""), { code: "ENOENT" });
  });
});

test("multimodal cache isolates cohorts and can clear beta analysis without deleting public entries", async () => {
  await withTempDataRoot(async (dataRoot) => {
    const betaCacheKey = makeMultimodalCacheKey({
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
      dataCohort: "beta",
    });
    const publicCacheKey = makeMultimodalCacheKey({
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
      dataCohort: "public",
    });
    assert.notEqual(betaCacheKey, publicCacheKey);
    const result = {
      music_analysis: {
        analysis_status: "analyzed",
        evidence_quality: "high",
        primary_genres: ["ambient"],
        emotional_tone: "quiet",
        era_distribution: { "2010s": 100 },
        language_diversity: ["instrumental"],
        personality_signals: { openness: "high" },
      },
    };

    await writeCachedMultimodalAnalysis({
      cacheKey: betaCacheKey,
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
      dataCohort: "beta",
      result,
      runtime: { provider: "custom", model: "gpt-5.5", mode: "live", request_id: "req_1" },
    });
    await writeCachedMultimodalAnalysis({
      cacheKey: publicCacheKey,
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
      dataCohort: "public",
      result,
      runtime: { provider: "custom", model: "gpt-5.5", mode: "live", request_id: "req_2" },
    });

    const cached = await readCachedMultimodalAnalysis(betaCacheKey);
    assert.deepEqual(cached?.result, result);
    assert.equal(cached?.runtime.mode, "live");
    assert.equal(await clearCachedMultimodalAnalysisForCohort("beta"), 1);
    assert.equal(await readCachedMultimodalAnalysis(betaCacheKey), null);
    assert.ok(await readCachedMultimodalAnalysis(publicCacheKey), "clearing beta cache must preserve public cache entries");

    const cacheRaw = await readFile(path.join(dataRoot, "benyuan-multimodal-cache.json"), "utf8");
    assert.match(cacheRaw, /hash-a\+hash-b/);
  });
});

test("multimodal cache rejects entries created by an older evidence contract", async () => {
  await withTempDataRoot(async () => {
    const legacyPromptVersion = "v1-parallel-stage-2026-05-12";
    const cacheKey = makeMultimodalCacheKey({
      kind: "music",
      assetHash: "legacy-hash",
      provider: "custom",
      model: "gpt-5.5",
      dataCohort: "beta",
      promptVersion: legacyPromptVersion,
    });
    await writeFile(getBenyuanMultimodalCachePath(), `${JSON.stringify({
      version: 1,
      entries: {
        [cacheKey]: {
          cache_key: cacheKey,
          kind: "music",
          asset_hash: "legacy-hash",
          prompt_version: legacyPromptVersion,
          provider: "custom",
          model: "gpt-5.5",
          data_cohort: "beta",
          result: {
            music_analysis: {
              primary_genres: ["ambient"],
              emotional_tone: "quiet",
              era_distribution: {},
              language_diversity: [],
              personality_signals: { openness: "high" },
            },
          },
          runtime: { provider: "custom", model: "gpt-5.5", mode: "live" },
          created_at: "2026-05-12T00:00:00.000Z",
          updated_at: "2026-05-12T00:00:00.000Z",
        },
      },
    }, null, 2)}\n`);

    assert.notEqual(legacyPromptVersion, MULTIMODAL_STAGE_PROMPT_VERSION);
    assert.equal(await readCachedMultimodalAnalysis(cacheKey), null);
  });
});
