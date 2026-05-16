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

const { benyuanPart1Questions, getQuestionOption } = await import("../src/lib/benyuan-v3-schema.ts");
const {
  ANALYST_SYSTEM_PROMPT,
  DIRECTOR_SYSTEM_PROMPT,
  buildAnalystUserPrompt,
  buildDirectorUserPrompt,
  buildFastDirectorUserPrompt,
} = await import("../src/lib/benyuan-v3-prompts.ts");
const {
  generateDeterministicConstellation,
  generateDeterministicTheaterScript,
} = await import("../src/lib/benyuan-v3-engine.ts");

function createPart1Record() {
  return {
    part1_id: "part1_content_v4",
    user_id: "usr_content_v4",
    created_at: "2026-05-09T00:00:00.000Z",
    updated_at: "2026-05-09T00:00:00.000Z",
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
    part2_id: "part2_content_v4",
    part1_id: "part1_content_v4",
    theater_script_id: "theater_content_v4",
    created_at: "2026-05-09T00:00:00.000Z",
    act2_choices: [
      { choice_id: 1, selected: "1C", hesitation_time: 4.2, timestamp: "2026-05-09T00:01:00.000Z" },
      { choice_id: 2, selected: "2A", hesitation_time: 8.6, timestamp: "2026-05-09T00:02:00.000Z" },
      { choice_id: 3, selected: "3D", hesitation_time: 12.1, timestamp: "2026-05-09T00:03:00.000Z" },
      { choice_id: 4, selected: "4C", hesitation_time: 10.4, timestamp: "2026-05-09T00:04:00.000Z" },
    ],
    act3_responses: [],
    metadata: {
      total_time: 420,
      device: "ios-native",
      phase_durations: { act1: 38, act2: 130, act3: 95, epilogue: 20 },
    },
  };
}

function recommendationSignature(constellation) {
  return [
    ...constellation.recommendations.books.map((item) => `book:${item.title}:${item.author}`),
    ...constellation.recommendations.films.map((item) => `film:${item.title}:${item.director}`),
    ...constellation.recommendations.music.map((item) => `music:${item.artist}:${item.album}`),
  ];
}

function allVisibleOptionText() {
  return benyuanPart1Questions.flatMap((question) => question.options?.map((option) => option.text) ?? []);
}

test("part1 questions use everyday entry points without visible clinical labels", () => {
  const optionText = allVisibleOptionText().join("\n");

  assert.doesNotMatch(optionText, /\p{Emoji_Presentation}/u);
  assert.doesNotMatch(optionText, /存在焦虑|依恋|神经质|精英意识|压抑型|低神经质|毁灭与重生/);
  assert.match(benyuanPart1Questions.find((question) => question.id === "A1_core_image")?.prompt ?? "", /手机相册|自我和世界|距离/);
  assert.match(getQuestionOption("B1_night_thoughts", "B1-6")?.text ?? "", /一直想|意义|带向哪里/);
  assert.match(getQuestionOption("B2_decision_style", "B2-2")?.text ?? "", /为什么出现|要不要靠近/);
  assert.match(getQuestionOption("B5_relationship_philosophy", "B5-1")?.text ?? "", /回复|语气|细微变化/);
});

test("literature options pair philosophical works with everyday self-recognition cues", () => {
  const literature = benyuanPart1Questions.find((question) => question.id === "A3_literature");
  assert(literature?.options?.length, "A3 literature options must exist");

  for (const option of literature.options) {
    assert.match(option.text, /《[^》]+》/, `${option.id} should preserve the work title`);
    assert.doesNotMatch(option.text, /^[^：:，。；;]+《[^》]+》$/, `${option.id} should not be a bare bibliography item`);
    assert.match(
      option.text,
      /像|那种|时候|突然|觉得|明明|仍然|反复|不合群|隔着|命运|时间|想要|说不清/,
      `${option.id} should expose an everyday entry point before the deeper signal`,
    );
  }
});

test("director prompt v4 requires continuous destiny-like theater generated from collected traces", () => {
  assert.match(DIRECTOR_SYSTEM_PROMPT, /剧场导演 Agent Prompt v4/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /用户的回答、审美素材与精神倾向/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /一条镜头连续推进/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /宿命感不是预言/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /物件、声音、颜色或距离/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /反复母题/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /私人小说感/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /小说片段、心理寓言和象征性处境/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /第四轮问题应帮助区分|心性辨认|动机辨认/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /二阶追问|心理补问|动机辨认|边界辨认|关系姿态/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /长度 500-800 字/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /\\n\\n 分隔/);
  assert.match(DIRECTOR_SYSTEM_PROMPT, /禁止把“月下剧场”字面化成售票、检票、座位、观众、演员、幕布、舞台、引座员/);

  const prompt = buildDirectorUserPrompt(createPart1Record());
  assert.match(prompt, /Act2 是四轮连续剧场题/);
  assert.match(prompt, /第四轮把前三轮选择补成动机、边界、时间感或行动确认/);
  assert.match(prompt, /上传素材不是素材库/);
  assert.match(prompt, /深夜的海像一封没有寄出的信/);
  assert.match(prompt, /lone_figure_seascape_sunset/);
});

test("fast director prompt preserves multimodal evidence and psychoanalytic sampling intent", () => {
  const record = createPart1Record();
  const fallback = generateDeterministicTheaterScript(record);
  const prompt = buildFastDirectorUserPrompt(record, fallback);

  assert.match(prompt, /多模态线索/);
  assert.match(prompt, /音乐: ambient \/ post-rock；melancholic_introspective/);
  assert.match(prompt, /社交: 深夜的海像一封没有寄出的信/);
  assert.match(prompt, /照片: lone_figure_seascape_sunset/);
  assert.match(prompt, /act2_lenses 四条分别写进入、改变距离、触碰或放下、动机\/边界\/时间感\/行动确认的补采样/);
  assert.match(prompt, /精神分析概念卡只用于强化叙事种子/);
  assert.match(prompt, /关系距离、边界、暗面、轨道、回声或核心物件/);
});

test("fallback theater is a continuous role-play scene rather than a questionnaire", () => {
  const theater = generateDeterministicTheaterScript(createPart1Record());
  const visibleText = JSON.stringify(theater);
  const actionStart = /^(靠近|停下|沿着|伸手|绕开|留在|回望|推开|等待|把|走向)/;

  assert.match(theater.act1.scene_description, /深夜的海像一封没有寄出的信|lone_figure_seascape_sunset|海/);
  assert.match(theater.act1.scene_description, /一段只能由你继续往下走的小说|前面那些画面、声音、句子和停顿|第一条细线/);
  assert.match(theater.act1.scene_description, /\n\n/);
  assert.equal(theater.act2.choices.length, 4);
  assert(theater.act2.choices.every((choice) => choice.options.length === 4), "fallback theater must expose four options for each of the four rounds");
  assert.match(theater.act2.choices[1].scene, /第一幕|那封没有寄出的信|潮声|照片/);
  assert.match(theater.act2.choices[3].scene, /最后一道门|先看见哪一层|星图/);
  assert(theater.act2.choices.every((choice) => choice.options.every((option) => actionStart.test(option.text))), "act2 options must start with embodied actions");
  assert.doesNotMatch(visibleText, /镜像测试|选择最接近|你已经知道答案了|正确的答案/);
  assert.doesNotMatch(visibleText, /售票|检票|座位|观众|演员|幕布|引座员/);
  assert.match(theater.act3.mirror_questions[0].dialogue, /剧场|追问|补问|声音|物件|海|动机|边界|关系/);
  assert.doesNotMatch(visibleText, /让镜面停在一个方向上/);
});

test("analyst prompt and fallback constellation bind star language to psychoanalytic and philosophical discernment", () => {
  assert.match(ANALYST_SYSTEM_PROMPT, /精神分析师 Agent Prompt v4/);
  assert.match(ANALYST_SYSTEM_PROMPT, /短引或转述/);
  assert.match(ANALYST_SYSTEM_PROMPT, /荣格|温尼科特|克尔凯郭尔|尼采|海德格尔|加缪/);

  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const prompt = buildAnalystUserPrompt(part1, part2, fallback);
  const reportText = JSON.stringify(fallback);
  const overview = fallback.narrative_overview;

  assert.match(prompt, /星体语言/);
  assert.match(prompt, /精神分析、哲学与文艺旁证/);
  assert.match(prompt, /沿着回声回应一句话/);
  assert.match(prompt, /寻找没有标出的出口/);
  assert.match(prompt, /把保护自己的边界放到暗金轨道上/);
  assert.match(reportText, /荣格|温尼科特|加缪|尼采|海德格尔|卡夫卡|博尔赫斯|卡尔维诺/);
  assert.match(overview, /沿着回声回应一句话|回声回应/);
  assert.match(overview, /没有标出的出口|第三条细线/);
  assert.match(overview, /把保护自己的边界放到暗金轨道上|四轮|补足/);
  assert.match(overview, /停顿|停留|迟疑|慢/);
  assert.doesNotMatch(reportText, /孤独求索者|敏感而复杂的人|关系哲学“/);
  assert.doesNotMatch(overview, /你给人的核心印象|你给人的第一印象/);
  assert(fallback.recommendations.books.some((item) => /精神旁证|存在主义|个体化|时间|动机|边界|辨认/.test(item.reason)));
  assert.match(ANALYST_SYSTEM_PROMPT, /动作\s*→\s*目的\s*→\s*预期成效|动作 \+ 目的 \+ 预期成效/);
  assert.doesNotMatch(ANALYST_SYSTEM_PROMPT, /补足什么|照见什么|什么时候靠近/);
  assert.ok(
    fallback.growth_suggestions.every((item) =>
      item.actionable_steps.every((step) => /为了|用来|让你|帮助你|这样做会|从而|会让|目的|成效/u.test(step))
    ),
    "growth path actions must explain purpose and expected effect, not only give an isolated task"
  );
  assert.ok(
    fallback.growth_suggestions.every((item) => !item.actionable_steps.some((step) => /写下三个不需要立刻|不需要立刻解决的问题/u.test(step))),
    "growth path actions should not keep the old unclear three-unresolved-problems wording"
  );
  assert.ok(
    [...fallback.recommendations.books, ...fallback.recommendations.films, ...fallback.recommendations.music].every((item) =>
      /补足|延伸|照见|回应|适合|靠近|承接|镜面|旁证|结构|气质|节律|边界|意义|时间|情绪/u.test(item.reason)
    ),
    "recommendation reasons must explain resonance or use context, not just list a work"
  );
});

test("same canonical archetype still personalizes report and recommendations from current evidence", () => {
  assert.match(ANALYST_SYSTEM_PROMPT, /同一个主星体|同一主星体/);
  assert.match(ANALYST_SYSTEM_PROMPT, /不能只套固定推荐|不得只套固定推荐|推荐.*当次输入/);

  const basePart1 = createPart1Record();
  basePart1.aggregated_traits.archetype_hints = ["black_hole_event_horizon", "lone_seeker"];
  const basePart2 = createPart2Record();

  const variantPart1 = structuredClone(basePart1);
  variantPart1.part1_id = "part1_content_v4_variant";
  variantPart1.user_id = "usr_content_v4_variant";
  variantPart1.part1_data.aesthetics.music_analysis = {
    primary_genres: ["electronic", "indie"],
    emotional_tone: "warm_hopeful",
    era_distribution: { "2010s": 40, "2020s": 60 },
    language_diversity: ["chinese", "japanese"],
    personality_signals: { openness: "medium", emotional_depth: "medium", nostalgia: "low" },
  };
  variantPart1.part1_data.narrative.social_posts_analysis = [
    {
      post_id: 1,
      text_content: "清晨骑车穿过树影，突然觉得生活可以重新开始。",
      emotional_tone: "warm_hopeful",
      themes: ["movement", "morning", "renewal"],
      expression_style: "reflective_direct",
      self_presentation: "active_rebuilding",
      time_clue: "morning_post",
      psychological_signals: ["renewal", "action_tendency"],
    },
  ];
  variantPart1.part1_data.narrative.social_posts_overall_pattern = {
    dominant_emotion: "warm_hopeful",
    core_themes: ["movement", "renewal", "daily_life"],
    expression_authenticity: "high",
  };
  variantPart1.part1_data.narrative.precious_photo_analysis = {
    visual_content: "morning_bicycle_tree_shadow",
    composition: "moving_subject_open_path",
    lighting: "soft_morning_light",
    color_mood: "green_warm",
    symbolic_elements: ["bicycle", "tree_shadow", "open_path"],
    psychological_interpretation: {
      core_themes: ["movement", "renewal", "grounded_action"],
      emotional_tone: "calm_forward",
      self_concept: "active_rebuilder",
      existential_stance: "returning_to_life",
      traits: ["action_tendency", "openness"],
    },
  };
  variantPart1.aggregated_traits.core_themes = ["movement", "renewal", "grounded_action"];
  variantPart1.aggregated_traits.archetype_hints = ["black_hole_event_horizon", "solar_corona"];

  const variantPart2 = structuredClone(basePart2);
  variantPart2.part1_id = variantPart1.part1_id;
  variantPart2.act2_choices = [
    { choice_id: 1, selected: "1A", hesitation_time: 1.4, timestamp: "2026-05-09T00:01:00.000Z" },
    { choice_id: 2, selected: "2D", hesitation_time: 2.2, timestamp: "2026-05-09T00:02:00.000Z" },
    { choice_id: 3, selected: "3B", hesitation_time: 2.8, timestamp: "2026-05-09T00:03:00.000Z" },
    { choice_id: 4, selected: "4A", hesitation_time: 1.9, timestamp: "2026-05-09T00:04:00.000Z" },
  ];

  const base = generateDeterministicConstellation(basePart1, basePart2);
  const variant = generateDeterministicConstellation(variantPart1, variantPart2);

  assert.equal(base.archetype.name, "事件视界沉潜者");
  assert.equal(variant.archetype.name, "事件视界沉潜者");
  assert.notEqual(base.narrative_overview, variant.narrative_overview);
  assert.notDeepEqual(
    recommendationSignature(base),
    recommendationSignature(variant),
    "same fixed archetype should still produce evidence-sensitive recommendation variants"
  );
  assert.match(JSON.stringify(variant.recommendations), /清晨|骑车|树影|electronic|电子|indie|独立|重新开始|open_path|路径/u);
});
