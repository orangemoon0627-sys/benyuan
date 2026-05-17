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

const { buildAnalystUserPrompt, buildDirectorUserPrompt, buildFastAnalystUserPrompt, buildFastDirectorUserPrompt, buildMultimodalUserPrompt } = await import("../src/lib/benyuan-v3-prompts.ts");
const { generateDeterministicConstellation } = await import("../src/lib/benyuan-v3-engine.ts");
const { getBenyuanArchetypeProfile } = await import("../src/lib/benyuan-v3-report-profile.ts");
const { buildPsycheMetadataDossier } = await import("../src/lib/benyuan-v3-psyche-metadata.ts");
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
      { choice_id: 4, selected: "4B", hesitation_time: 7.8, timestamp: "2026-05-08T00:04:00.000Z" },
    ],
    act3_responses: [],
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

  assert.match(prompt, /精神元数据剖面/u);
  assert.match(prompt, /原始证据只用于核验/u);
  assert.ok(prompt.indexOf("精神元数据剖面") < prompt.indexOf("证据档案"), "director prompt should present psyche metadata before raw evidence");
  assert.match(prompt, /上传素材不是素材库，而是反复母题/);
  assert.match(prompt, /同一段声音、同一句话、同一张照片里的构图，必须在 Act1 与 Act2 四轮中改变形态后再次出现/);
  assert.match(prompt, /Act2 是四轮连续剧场题：第一轮进入，第二轮改变距离，第三轮触碰或放下，第四轮把前三轮选择补成动机、边界、时间感或行动确认/);
  assert.match(prompt, /不要把关键补问放进 Act3，必须放在 Act2 第四轮/);
  assert.match(prompt, /motif ledger/i);
  assert.match(prompt, /每个 choice 的 scene 都必须延续上一轮至少一个母题/);
  assert.match(prompt, /禁止让 Act2 四轮 choice 互相独立/);
  assert.match(prompt, /第四轮必须问不同的心理动作/);
  assert.match(prompt, /禁止重复使用同一句可见问题/);
});

test("psyche metadata dossier standardizes raw answers and multimodal clues before theater generation", () => {
  const dossier = buildPsycheMetadataDossier(createPart1Record());

  assert.match(dossier, /精神元数据剖面/u);
  assert.match(dossier, /13 题是第一层精神向量采集/u);
  assert.match(dossier, /音乐\/歌单允许用公开作品元数据做联网补全/u);
  assert.match(dossier, /社交动态与私人照片不进行公网搜索/u);
  assert.match(dossier, /标准精神信号/u);
  assert.match(dossier, /object_distance|boundary_integrity|desire_structure|projection_symbolic_sensitivity|meaning_orientation/u);
  assert.match(dossier, /剧场补采样目标/u);
  assert.match(dossier, /前 13 题与多模态尚未采足/u);
  assert.match(dossier, /剧场生成指令/u);
  assert.match(dossier, /小说情节必须从精神元数据生长/u);
  assert.match(dossier, /不要把 13 题答案、歌单、社交文字或照片描述逐项搬进可见文本/u);
  assert.match(dossier, /旧版字段隔离区/u);
  assert.match(dossier, /旧版 Act3 \/ act3_responses \/ mirror_questions \/ mirror_final_words 只用于历史档案兼容/u);
  assert.match(dossier, /旧版 Act3 \/ 镜面追问只作为历史兼容字段，不参与新版剧场生成/u);
});

test("fast director prompt also prioritizes psyche metadata over raw multimodal fragments", () => {
  const part1 = createPart1Record();
  const fallback = {
    user_id: part1.user_id,
    generated_at: "2026-05-08T00:00:00.000Z",
    personalization_summary: { core_archetype: "远潮观月者", aesthetic_style: "深月场", emotional_tone: "低频", key_themes: ["意义"] },
    act1: { scene_description: "", visual_prompt: "", ambient_sound: "", duration: 30 },
    act2: { choices: [] },
    act3: { scene_description: "", mirror_questions: [], mirror_final_words: "" },
    epilogue: { scene_description: "", closing_text: "", transition_prompt: "", transition_animation: "" },
  };
  const prompt = buildFastDirectorUserPrompt(part1, fallback);

  assert.match(prompt, /精神元数据剖面/u);
  assert.match(prompt, /原始片段只作核验/u);
  assert.match(prompt, /剧场四轮的核心任务/u);
  assert.match(prompt, /补足前 13 题和多模态之后仍不够清楚的精神向量/u);
  assert.match(prompt, /不要照搬.*填空式素材摘要/u);
  assert.match(prompt, /mirror_questions 仅保留兼容，必须写 \[\]/u);
  assert.match(prompt, /"mirror_questions": \[\]/u);
  assert.ok(prompt.indexOf("精神元数据剖面") < prompt.indexOf("原始片段"), "fast director should see psyche metadata before raw fragments");
});

test("multimodal prompt extracts music lookup seeds while keeping private materials off public search", () => {
  const prompt = buildMultimodalUserPrompt({
    music_inputs: [{ visible_text: "Some playlist screenshot" }],
    social_post_inputs: [{ visible_text: "深夜的海像一封没有寄出的信。" }],
    precious_photo_input: { description: "low light sea horizon" },
  });

  assert.match(prompt, /recognized_tracks/u);
  assert.match(prompt, /后端会用公开音乐元数据做联网补全/u);
  assert.match(prompt, /社交动态和私人照片禁止联网搜索/u);
  assert.match(prompt, /标准化精神信号/u);
  assert.match(prompt, /desire_structure|defense_style|projection_symbolic_sensitivity|object_distance|boundary_integrity/u);
});

test("analyst prompt includes theater choices as readable trajectory evidence", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const prompt = buildAnalystUserPrompt(part1, part2, fallback);

  assert.match(prompt, /剧场选择轨迹/);
  assert.match(prompt, /第 1 次选择：1C/);
  assert.match(prompt, /第 4 次选择：4B/);
  assert.match(prompt, /停顿 4\.2 秒/);
  assert.match(prompt, /新版流程无 Act3 追问/);
  assert.match(prompt, /ios-native/);
  assert.match(prompt, /精神分析、哲学与文艺旁证/);
  assert.match(prompt, /深夜的海像一封没有寄出的信/);
});

test("legacy act3 responses are isolated from analyst evidence and part2 json payload", () => {
  const part1 = createPart1Record();
  const part2 = {
    ...createPart2Record(),
    act3_responses: [
      { question_id: 1, selected: "3A-1", hesitation_time: 9.9, timestamp: "2026-05-08T00:05:00.000Z" },
    ],
  };
  const fallback = generateDeterministicConstellation(part1, part2);
  const prompt = buildAnalystUserPrompt(part1, part2, fallback);

  assert.match(prompt, /旧版 Act3 \/ 镜面追问记录 1 条/u);
  assert.match(prompt, /legacy isolation/u);
  assert.match(prompt, /legacy_act3_response_count/u);
  assert.doesNotMatch(prompt, /act3_mirror_responses/u);
  assert.doesNotMatch(prompt, /3A-1/);
  assert.doesNotMatch(prompt, /被真正听懂|急着解释/u);
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

test("normalizeConstellation rejects retired visible labels as personal labels", () => {
  assert.equal(typeof normalizeConstellation, "function");

  const fallback = generateDeterministicConstellation(createPart1Record(), createPart2Record());
  const normalized = normalizeConstellation(
    {
      psyche_constellation: {
        ...fallback,
        archetype: {
          ...fallback.archetype,
          personalized_name: "月门潜航者",
          personalized_subtitle: "暗潮守月人：夜城相机与远海，守住暗金边界",
        },
      },
    },
    fallback,
  );

  assert.ok(normalized);
  assert.equal(normalized.archetype.name, fallback.archetype.name);
  assert.equal(normalized.archetype.personalized_name, fallback.archetype.personalized_name);
  assert.equal(normalized.archetype.personalized_subtitle, fallback.archetype.personalized_subtitle);
  assert.doesNotMatch(normalized.archetype.personalized_name ?? "", /月门潜航者|暗潮守月人|夜城相机/u);
  assert.doesNotMatch(normalized.archetype.personalized_subtitle ?? "", /月门潜航者|暗潮守月人|夜城相机/u);
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

test("analyst prompts keep fixed archetype as the only visible naming", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const fullPrompt = buildAnalystUserPrompt(part1, part2, fallback);
  const fastPrompt = buildFastAnalystUserPrompt(part1, part2, fallback);

  assert.match(fullPrompt, /canonical_archetype_name/);
  assert.match(fullPrompt, /archetype\.name\s*必须保持/u);
  assert.match(fullPrompt, /personalized_name/);
  assert.match(fullPrompt, /personalized_subtitle/);
  assert.match(fullPrompt, /用户可见的主标题只允许使用固定 10 个主星体标签/u);
  assert.match(fullPrompt, /不进入结果页主标签、分享标题或保存长图标题/u);
  assert.doesNotMatch(fullPrompt, /用于结果页展示更私人化的称谓和副标题/u);
  assert.doesNotMatch(fullPrompt, /它们才是根据用户细节生成的个人化称谓/u);
  assert.match(fastPrompt, /不要覆盖 canonical_archetype_name/u);
  assert.match(fastPrompt, /personalized_name/);
  assert.match(fastPrompt, /personalized_subtitle/);
  assert.match(fastPrompt, /只是内部显影短语，不能承担用户可见命名/u);
});
