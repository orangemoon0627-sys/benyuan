import assert from "node:assert/strict";
import test from "node:test";

import { classifyBenyuanMultimodalCacheStatus } from "../src/lib/benyuan-agent-timing.ts";

test("classifies a fully cold multimodal run without relying on runtime error text as the public API", () => {
  const status = classifyBenyuanMultimodalCacheStatus(undefined, {
    music: 1,
    social: 2,
    photo: 1,
  });

  assert.equal(status.cache_status, "cold");
  assert.equal(status.cold_start, true);
  assert.deepEqual(status.cache_hit_stages, []);
  assert.deepEqual(status.cache_miss_stages, ["music", "social", "photo"]);
  assert.equal(status.asset_count, 4);
});

test("classifies partial multimodal cache hits from legacy runtime metadata", () => {
  const status = classifyBenyuanMultimodalCacheStatus(
    "multimodal_stage_cache_hit:music,photo | social:provider_timeout",
    {
      music: 1,
      social: 3,
      photo: 1,
    },
  );

  assert.equal(status.cache_status, "partial_cache_hit");
  assert.equal(status.cold_start, true);
  assert.deepEqual(status.cache_hit_stages, ["music", "photo"]);
  assert.deepEqual(status.cache_miss_stages, ["social"]);
  assert.equal(status.asset_count, 5);
});

test("classifies fully cached multimodal runs", () => {
  const status = classifyBenyuanMultimodalCacheStatus("multimodal_stage_cache_hit:music,social,photo", {
    music: 1,
    social: 1,
    photo: 1,
  });

  assert.equal(status.cache_status, "cache_hit");
  assert.equal(status.cold_start, false);
  assert.deepEqual(status.cache_hit_stages, ["music", "social", "photo"]);
  assert.deepEqual(status.cache_miss_stages, []);
  assert.equal(status.asset_count, 3);
});
