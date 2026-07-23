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
      return nextResolve(pathToFileURL(existsSync(targetPath) ? targetPath : `${targetPath}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { normalizeMultimodalResult } = await import("../src/lib/benyuan-v3-agent.ts");

const fallback = {
  music_analysis: {
    analysis_status: "insufficient_evidence",
    evidence_quality: "none",
    primary_genres: [],
    emotional_tone: "",
    era_distribution: {},
    language_diversity: [],
    personality_signals: {},
  },
  social_posts_analysis: [],
  social_posts_overall_pattern: {
    analysis_status: "insufficient_evidence",
    evidence_quality: "none",
    dominant_emotion: "",
    core_themes: [],
    expression_authenticity: "",
  },
  precious_photo_analysis: {
    analysis_status: "insufficient_evidence",
    evidence_quality: "none",
    visual_content: "",
    composition: "",
    lighting: "",
    color_mood: "",
    symbolic_elements: [],
    psychological_interpretation: {
      core_themes: [],
      emotional_tone: "",
      self_concept: "",
      existential_stance: "",
      traits: [],
    },
  },
};

test("social normalization accepts more live items than the fallback contains", () => {
  const result = normalizeMultimodalResult({
    social_posts_analysis: [
      { text_content: "第一条动态", emotional_tone: "克制", themes: ["边界"] },
      { text_content: "第二条动态", emotional_tone: "松弛", themes: ["靠近"] },
    ],
    social_posts_overall_pattern: {
      analysis_status: "analyzed",
      evidence_quality: "high",
      dominant_emotion: "克制而真实",
      core_themes: ["边界", "靠近"],
      expression_authenticity: "high",
    },
  }, fallback);

  assert.ok(result);
  assert.equal(result.social_posts_analysis.length, 2);
  assert.deepEqual(result.social_posts_analysis.map((item) => item.post_id), [1, 2]);
  assert.deepEqual(result.social_posts_analysis.map((item) => item.text_content), ["第一条动态", "第二条动态"]);
});

test("behavioral signals keep canonical evidence and reject unsupported free-text dimensions", () => {
  const result = normalizeMultimodalResult({
    music_analysis: {
      analysis_status: "analyzed",
      evidence_quality: "high",
      primary_genres: ["ambient"],
      emotional_tone: "low-frequency and reflective",
      era_distribution: {},
      language_diversity: ["instrumental"],
      personality_signals: { meaning_orientation: "high" },
      behavioral_signals: [
        {
          signal: "meaning_orientation",
          polarity: "support",
          confidence: 1.4,
          temporal_scope: "long_term_preference",
          evidence: ["多首作品保持缓慢展开", "曲目主题反复回到时间感"],
          alternative_explanation: "也可能只是近期工作时使用的背景音乐",
        },
        {
          signal: "invented_personality_axis",
          polarity: "support",
          confidence: 0.9,
          temporal_scope: "long_term_preference",
          evidence: ["unsupported"],
        },
      ],
    },
  }, fallback);

  assert.ok(result);
  assert.equal(result.music_analysis.behavioral_signals.length, 1);
  assert.equal(result.music_analysis.behavioral_signals[0].signal, "meaning_orientation");
  assert.equal(result.music_analysis.behavioral_signals[0].confidence, 1);
  assert.equal(result.music_analysis.behavioral_signals[0].evidence.length, 2);
  assert.match(result.music_analysis.behavioral_signals[0].alternative_explanation, /背景音乐/u);
});
