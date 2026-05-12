import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  makeMultimodalCacheKey,
  readCachedMultimodalAnalysis,
  writeCachedMultimodalAnalysis,
} from "../src/lib/benyuan-multimodal-cache.ts";
import { persistUploadedAsset, readUploadedAssetBuffer } from "../src/lib/benyuan-v3-assets.ts";

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
    const ref = await persistUploadedAsset({
      questionId: "A2_music_analysis",
      fileName: "music.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fixture-image"),
      uploadOrigin: "runtime-test",
    });

    assert.match(ref.sha256, /^[a-f0-9]{64}$/);
    const loaded = await readUploadedAssetBuffer(ref.asset_id);
    assert.equal(loaded?.stored.sha256, ref.sha256);
  });
});

test("multimodal cache writes and reads stage analysis outside the main store", async () => {
  await withTempDataRoot(async (dataRoot) => {
    const cacheKey = makeMultimodalCacheKey({
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
    });
    const result = {
      music_analysis: {
        primary_genres: ["ambient"],
        emotional_tone: "quiet",
        era_distribution: { "2010s": 100 },
        language_diversity: ["instrumental"],
        personality_signals: { openness: "high" },
      },
    };

    await writeCachedMultimodalAnalysis({
      cacheKey,
      kind: "music",
      assetHash: "hash-a+hash-b",
      provider: "custom",
      model: "gpt-5.5",
      result,
      runtime: { provider: "custom", model: "gpt-5.5", mode: "live", request_id: "req_1" },
    });

    const cached = await readCachedMultimodalAnalysis(cacheKey);
    assert.deepEqual(cached?.result, result);
    assert.equal(cached?.runtime.mode, "live");

    const cacheRaw = await readFile(path.join(dataRoot, "benyuan-multimodal-cache.json"), "utf8");
    assert.match(cacheRaw, /hash-a\+hash-b/);
  });
});
