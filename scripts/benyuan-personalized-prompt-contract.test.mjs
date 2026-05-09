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

const { buildAnalystUserPrompt, buildDirectorUserPrompt } = await import("../src/lib/benyuan-v3-prompts.ts");
const { generateDeterministicConstellation } = await import("../src/lib/benyuan-v3-engine.ts");

function createPart1Record() {
  return {
    part1_id: "part1_prompt_contract",
    user_id: "usr_prompt_contract",
    created_at: "2026-05-08T00:00:00.000Z",
    updated_at: "2026-05-08T00:00:00.000Z",
    answers: {
      A1_core_image: "A1-1",
      A3_literature: ["A3-4", "A3-5"],
      A4_cinema: "A4-1",
      A5_inspiration_scene: "A5-2",
      B1_night_thoughts: "B1-6",
      B2_decision_style: "B2-2",
      B3_emotion_pattern: "B3-2",
      B4_time_philosophy: { past: 48, present: 22, future: 30 },
      B5_relationship_philosophy: "B5-1",
      C3_resonance_moments: ["C3-1", "C3-4"],
    },
    part1_data: {
      aesthetics: {
        core_desire_image: "A1-1",
        literature: ["A3-4", "A3-5"],
        cinema: "A4-1",
        inspiration_scene: "A5-2",
        music_analysis: {
          primary_genres: ["ambient", "post-rock"],
          emotional_tone: "melancholic_introspective",
          era_distribution: { "2000s": 35, "2010s": 45 },
          language_diversity: ["instrumental", "english"],
          personality_signals: { openness: "high", emotional_depth: "high" },
        },
      },
      philosophy: {
        night_thoughts: "B1-6",
        decision_style: "B2-2",
        emotion_pattern: "B3-2",
        time_orientation: { past: 48, present: 22, future: 30 },
        relationship_philosophy: "B5-1",
      },
      narrative: {
        social_posts_analysis: [
          {
            post_id: 1,
            text_content: "深夜的海像一封没有寄出的信。",
            emotional_tone: "melancholic_nostalgic",
            themes: ["solitude", "sea", "unsent_words"],
            expression_style: "poetic_implicit",
            self_presentation: "authentic_vulnerable",
            time_clue: "late_night_post",
            psychological_signals: ["high_sensitivity", "emotional_depth"],
          },
        ],
        social_posts_overall_pattern: {
          dominant_emotion: "melancholic",
          core_themes: ["solitude", "meaning", "sea"],
          expression_authenticity: "high",
        },
        precious_photo_analysis: {
          visual_content: "lone_figure_seascape_sunset",
          composition: "centered_figure_vast_background",
          lighting: "backlit_silhouette",
          color_mood: "warm_melancholic",
          symbolic_elements: ["sea", "horizon", "solitude"],
          psychological_interpretation: {
            core_themes: ["solitude", "meaning_seeking", "aesthetic_sensitivity"],
            emotional_tone: "peaceful_yet_melancholic",
            self_concept: "lone_seeker",
            existential_stance: "facing_infinity",
            traits: ["high_openness", "introversion", "meaning_seeking"],
          },
        },
        resonance_moments: ["C3-1", "C3-4"],
      },
    },
    aggregated_traits: {
      big_five: {
        openness: 84,
        conscientiousness: 52,
        extraversion: 38,
        agreeableness: 55,
        neuroticism: 66,
      },
      core_themes: ["meaning_seeking", "solitude", "aesthetic_sensitivity"],
      archetype_hints: ["lone_seeker", "existential_wanderer"],
    },
  };
}

function createPart2Record() {
  return {
    part2_id: "part2_prompt_contract",
    part1_id: "part1_prompt_contract",
    theater_script_id: "theater_prompt_contract",
    created_at: "2026-05-08T00:00:00.000Z",
    act2_choices: [
      { choice_id: 1, selected: "1C", hesitation_time: 4.2, timestamp: "2026-05-08T00:01:00.000Z" },
      { choice_id: 2, selected: "2A", hesitation_time: 8.6, timestamp: "2026-05-08T00:02:00.000Z" },
      { choice_id: 3, selected: "3D", hesitation_time: 12.1, timestamp: "2026-05-08T00:03:00.000Z" },
    ],
    act3_responses: [
      { question_id: 1, selected: "3A-2", hesitation_time: 9.4, timestamp: "2026-05-08T00:04:00.000Z" },
      { question_id: 2, selected: "3B-5", hesitation_time: 7.3, timestamp: "2026-05-08T00:05:00.000Z" },
    ],
    metadata: {
      total_time: 420,
      device: "ios-native",
      phase_durations: { act1: 38, act2: 130, act3: 95, epilogue: 20 },
    },
  };
}

test("director prompt includes readable A/B/C evidence and multimodal summaries", () => {
  const prompt = buildDirectorUserPrompt(createPart1Record());

  assert.match(prompt, /很大的天空、海面、远处的光/);
  assert.match(prompt, /塔可夫斯基《镜子》：雨、水、记忆和缓慢浮起的时间/);
  assert.match(prompt, /身体最先知道答案：靠近时放松，抗拒时收紧/);
  assert.match(prompt, /表面没什么，底下却一直有一股暗流在走/);
  assert.match(prompt, /大多数时候自己待着，但偶尔能真正聊到深处/);
  assert.match(prompt, /ambient \/ post-rock/);
  assert.match(prompt, /深夜的海像一封没有寄出的信/);
  assert.match(prompt, /lone_figure_seascape_sunset/);
  assert.match(prompt, /证据档案/);
});

test("analyst prompt includes theater choices as readable trajectory evidence", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const prompt = buildAnalystUserPrompt(part1, part2, fallback);

  assert.match(prompt, /剧场选择轨迹/);
  assert.match(prompt, /第 1 次选择：1C/);
  assert.match(prompt, /停顿 4\.2 秒/);
  assert.match(prompt, /镜面回答 1：3A-2/);
  assert.match(prompt, /ios-native/);
  assert.match(prompt, /精神分析、哲学与文艺旁证/);
  assert.match(prompt, /深夜的海像一封没有寄出的信/);
});
