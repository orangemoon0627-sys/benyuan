import assert from "node:assert/strict";
import test from "node:test";

import { dedupeCoreTensions } from "../src/lib/benyuan-v3-constellation-normalization.ts";

function constellation(overrides = {}) {
  return {
    user_id: "u1",
    generated_at: "2026-05-08T00:00:00.000Z",
    archetype: {
      name: "远潮观月者",
      english_name: "The Far-Tide Moon Watcher",
      core_essence: "在幽暗与审美里寻找意义。",
      visual_prompt: "moonlit sea",
    },
    seven_dimensions: {
      openness: { score: 80, interpretation: "高" },
      independence: { score: 70, interpretation: "中高" },
      emotional_depth: { score: 75, interpretation: "高" },
      meaning_seeking: { score: 88, interpretation: "高" },
      aesthetic_sensitivity: { score: 82, interpretation: "高" },
      action_tendency: { score: 52, interpretation: "中" },
      relationship_need: { score: 58, interpretation: "中" },
    },
    narrative_overview: "第一段。\n\n第二段。",
    core_tensions: [
      {
        tension_id: 1,
        name: "想被听见，却把故事交给雨声",
        description: "你用雨声保存那些还没有被说出的故事。",
        growth_direction: "让故事拥有一个可被承接的出口。",
      },
      {
        tension_id: 2,
        name: "记忆把时间留住，现实还在轻轻敲门",
        description: "你用雨声保存那些还没有被说出的故事。",
        growth_direction: "让记忆进入现实里的微小动作。",
      },
    ],
    growth_suggestions: [],
    recommendations: { books: [], films: [], music: [] },
    ...overrides,
  };
}

test("dedupeCoreTensions removes duplicate core tension descriptions even when names differ", () => {
  const normalized = dedupeCoreTensions(constellation().core_tensions);

  assert.deepEqual(normalized.map((item) => item.name), ["想被听见，却把故事交给雨声"]);
});
