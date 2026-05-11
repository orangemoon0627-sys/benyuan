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

    return nextResolve(specifier);
  },
});

const { generateDeterministicTheaterScript } = await import("../src/lib/benyuan-v3-engine.ts");
const { normalizeTheaterScript } = await import("../src/lib/benyuan-v3-agent.ts");

function createPart1Record() {
  return {
    part1_id: "part1_theater_agent_normalization",
    user_id: "usr_theater_agent_normalization",
    created_at: "2026-05-11T00:00:00.000Z",
    updated_at: "2026-05-11T00:00:00.000Z",
    answers: {
      A1_core_image: "A1-1",
      B1_night_thoughts: "B1-2",
      C3_resonance_moments: ["C3-1"],
    },
    part1_data: {
      aesthetics: {
        core_desire_image: "A1-1",
        literature: [],
        cinema: "A4-1",
        inspiration_scene: "A5-1",
        music_analysis: {
          primary_genres: ["ambient"],
          emotional_tone: "quiet",
          era_distribution: {},
          language_diversity: [],
          personality_signals: {},
        },
      },
      philosophy: {
        night_thoughts: "B1-2",
        decision_style: "B2-1",
        emotion_pattern: "B3-1",
        time_orientation: { past: 30, present: 40, future: 30 },
        relationship_philosophy: "B5-1",
      },
      narrative: {
        social_posts_analysis: [],
        social_posts_overall_pattern: {
          dominant_emotion: "quiet",
          core_themes: ["moon"],
          expression_authenticity: "medium",
        },
        precious_photo_analysis: {
          visual_content: "moon over sea",
          composition: "centered",
          lighting: "low light",
          color_mood: "deep",
          symbolic_elements: ["moon", "sea"],
          psychological_interpretation: {
            core_themes: ["solitude"],
            emotional_tone: "quiet",
            self_concept: "observer",
            existential_stance: "watching",
            traits: ["openness"],
          },
        },
        resonance_moments: ["C3-1"],
      },
    },
    aggregated_traits: {
      big_five: {
        openness: 80,
        conscientiousness: 50,
        extraversion: 35,
        agreeableness: 55,
        neuroticism: 52,
      },
      core_themes: ["solitude", "moon"],
      archetype_hints: ["observer"],
    },
  };
}

test("normalizeTheaterScript fills missing live act2 and act3 from fallback instead of throwing", () => {
  const fallback = generateDeterministicTheaterScript(createPart1Record());
  const normalized = normalizeTheaterScript(
    {
      theater_script: {
        user_id: "usr_theater_agent_normalization",
        act1: {
          scene_description: "模型只返回了第一幕。",
        },
        epilogue: {
          closing_text: "仍然应该被接住。",
        },
      },
    },
    fallback,
  );

  assert.ok(normalized);
  assert.equal(normalized.act1.scene_description, "模型只返回了第一幕。");
  assert.equal(normalized.act2.choices.length, fallback.act2.choices.length);
  assert.equal(normalized.act3.mirror_questions.length, fallback.act3.mirror_questions.length);
  assert.equal(normalized.epilogue.closing_text, "仍然应该被接住。");
});
