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

const { buildAnalystUserPrompt, buildDirectorUserPrompt, buildFastAnalystUserPrompt } = await import("../src/lib/benyuan-v3-prompts.ts");
const { generateDeterministicConstellation } = await import("../src/lib/benyuan-v3-engine.ts");
const { getBenyuanArchetypeProfile } = await import("../src/lib/benyuan-v3-report-profile.ts");
const agentModule = await import("../src/lib/benyuan-v3-agent.ts");
const { normalizeConstellation, mergeFastConstellationSeed } = agentModule;

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
  assert.match(prompt, /认真想它为什么出现，再决定要不要靠近/);
  assert.match(prompt, /努力维持平静，但底下已经快要撑不住/);
  assert.match(prompt, /对方回复和语气里的细微变化/);
  assert.match(prompt, /ambient \/ post-rock/);
  assert.match(prompt, /深夜的海像一封没有寄出的信/);
  assert.match(prompt, /lone_figure_seascape_sunset/);
  assert.match(prompt, /证据档案/);
});

test("director prompt requires continuous theater motifs instead of generic isolated questions", () => {
  const prompt = buildDirectorUserPrompt(createPart1Record());

  assert.match(prompt, /上传素材不是素材库，而是反复母题/);
  assert.match(prompt, /同一段声音、同一句话、同一张照片里的构图，必须在 Act1\/Act2\/Act3 中改变形态后再次出现/);
  assert.match(prompt, /Act2 要形成连续行动链：第一步进入，第二步改变距离，第三步触碰或放下某个物件/);
  assert.match(prompt, /Act3 的镜面问题必须从 Act2 变形而来，不要突然跳成问卷/);
  assert.match(prompt, /motif ledger/i);
  assert.match(prompt, /每个 choice 的 scene 都必须延续上一幕至少一个母题/);
  assert.match(prompt, /禁止让 Act2 三组 choice 互相独立/);
  assert.match(prompt, /Act3 的每个 mirror question 必须问不同的心理动作/);
  assert.match(prompt, /禁止重复使用同一句可见问题/);
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

test("deterministic constellation keeps canonical archetype and adds personal title fields", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const canonical = getBenyuanArchetypeProfile(part1.aggregated_traits.archetype_hints[0]).archetype;

  assert.equal(fallback.archetype.name, canonical.name);
  assert.ok(fallback.archetype.personalized_name?.length >= 4);
  assert.ok(fallback.archetype.personalized_subtitle?.length >= 10);
  assert.notEqual(fallback.archetype.personalized_name, fallback.archetype.name);
  assert.doesNotMatch(fallback.archetype.personalized_name, /lone_seeker|post-rock|ambient|_/i);
  assert.doesNotMatch(fallback.archetype.personalized_subtitle, /lone_seeker|post-rock|ambient|_/i);
});

test("normalizeConstellation treats model archetype name as personal label without changing canonical type", () => {
  assert.equal(typeof normalizeConstellation, "function");

  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const normalized = normalizeConstellation(
    {
      psyche_constellation: {
        ...fallback,
        archetype: {
          name: "黑潮边的守信者",
          english_name: "The Model Tried To Rename The Canonical Type",
          core_essence: "你把未寄出的信、海面和剧场里那次长停顿收成一条只属于自己的暗金轨道。",
          visual_prompt: "black tide witness with sealed letter and event horizon",
          personalized_name: "未寄之信的守夜人",
          personalized_subtitle: "在海面、长停顿与暗金轨道之间保存真实的人",
        },
      },
    },
    fallback,
  );

  assert.ok(normalized);
  assert.equal(normalized.archetype.name, fallback.archetype.name);
  assert.equal(normalized.archetype.english_name, fallback.archetype.english_name);
  assert.equal(normalized.archetype.personalized_name, "未寄之信的守夜人");
  assert.equal(normalized.archetype.personalized_subtitle, "在海面、长停顿与暗金轨道之间保存真实的人");
  assert.match(normalized.archetype.core_essence, /未寄出的信|暗金轨道/);
});

test("normalizeConstellation rejects sluggy or noisy personal labels", () => {
  assert.equal(typeof normalizeConstellation, "function");

  const fallback = generateDeterministicConstellation(createPart1Record(), createPart2Record());
  const normalized = normalizeConstellation(
    {
      psyche_constellation: {
        ...fallback,
        archetype: {
          ...fallback.archetype,
          name: "lone_seeker",
          personalized_name: "post-rock raw abandoned_post_rope",
          personalized_subtitle: "undetermined_no_visible_music_playlist_or_music_screenshot",
        },
      },
    },
    fallback,
  );

  assert.ok(normalized);
  assert.equal(normalized.archetype.name, fallback.archetype.name);
  assert.equal(normalized.archetype.personalized_name, fallback.archetype.personalized_name);
  assert.equal(normalized.archetype.personalized_subtitle, fallback.archetype.personalized_subtitle);
  assert.doesNotMatch(normalized.archetype.personalized_name ?? "", /post-rock|abandoned|_/i);
  assert.doesNotMatch(normalized.archetype.personalized_subtitle ?? "", /undetermined|no_visible|_/i);
});

test("fast constellation seed merges personalized label while preserving canonical archetype", () => {
  assert.equal(typeof mergeFastConstellationSeed, "function");

  const fallback = generateDeterministicConstellation(createPart1Record(), createPart2Record());
  const merged = mergeFastConstellationSeed(fallback, {
    archetype_name: "黑潮边的回声体",
    personalized_subtitle: "把社交文本里的海与剧场里的停顿收进同一条轨道",
    archetype_essence: "你把海面、未寄出的信和停顿里的边界感，收成一套更私人的精神潮汐。",
    visual_prompt: "black tide personal orbit around fixed moonlit seeker archetype",
    mirror_paragraphs: [],
    dimension_interpretations: {},
    tension_lenses: [],
    growth_lenses: [],
    recommendation_lenses: { books: [], films: [], music: [] },
  });

  assert.equal(merged.archetype.name, fallback.archetype.name);
  assert.equal(merged.archetype.english_name, fallback.archetype.english_name);
  assert.equal(merged.archetype.personalized_name, "黑潮边的回声体");
  assert.equal(merged.archetype.personalized_subtitle, "把社交文本里的海与剧场里的停顿收进同一条轨道");
  assert.match(merged.archetype.core_essence, /未寄出的信|精神潮汐/);
});

test("analyst prompts separate fixed archetype type from personalized naming", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const fullPrompt = buildAnalystUserPrompt(part1, part2, fallback);
  const fastPrompt = buildFastAnalystUserPrompt(part1, part2, fallback);

  assert.match(fullPrompt, /canonical_archetype_name/);
  assert.match(fullPrompt, /archetype\.name\s*必须保持/u);
  assert.match(fullPrompt, /personalized_name/);
  assert.match(fullPrompt, /personalized_subtitle/);
  assert.match(fastPrompt, /不要覆盖 canonical_archetype_name/u);
  assert.match(fastPrompt, /personalized_name/);
  assert.match(fastPrompt, /personalized_subtitle/);
});
