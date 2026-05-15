import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

const { generateDeterministicConstellation } = await import("../src/lib/benyuan-v3-engine.ts");
const { buildAnalystUserPrompt, buildFastAnalystUserPrompt } = await import("../src/lib/benyuan-v3-prompts.ts");

const nativeConstellationView = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift", "utf8");
const nativeRenderer = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanConstellationImageRenderer.swift", "utf8");
const nativeActions = readFileSync("mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationActions.swift", "utf8");

function createPart1Record() {
  return {
    part1_id: "part1_depth_export_contract",
    user_id: "usr_depth_export_contract",
    created_at: "2026-05-15T00:00:00.000Z",
    updated_at: "2026-05-15T00:00:00.000Z",
    answers: {
      A1_core_image: "A1-6",
      A3_literature: ["A3-2", "A3-5"],
      A4_cinema: "A4-3",
      A5_inspiration_scene: "A5-5",
      B1_night_thoughts: "B1-4",
      B2_decision_style: "B2-1",
      B3_emotion_pattern: "B3-2",
      B4_time_philosophy: { past: 48, present: 22, future: 30 },
      B5_relationship_philosophy: "B5-5",
      C3_resonance_moments: ["C3-2", "C3-7"],
    },
    part1_data: {
      aesthetics: {
        core_desire_image: "A1-6",
        literature: ["A3-2", "A3-5"],
        cinema: "A4-3",
        inspiration_scene: "A5-5",
        music_analysis: {
          primary_genres: ["ambient", "post-rock"],
          emotional_tone: "melancholic_introspective",
          era_distribution: { "2010s": 60, "2020s": 40 },
          language_diversity: ["instrumental"],
          personality_signals: { openness: "high", introversion: "medium_high", emotional_depth: "high" },
        },
      },
      philosophy: {
        night_thoughts: "B1-4",
        decision_style: "B2-1",
        emotion_pattern: "B3-2",
        time_orientation: { past: 48, present: 22, future: 30 },
        relationship_philosophy: "B5-5",
      },
      narrative: {
        social_posts_analysis: [
          {
            post_id: 1,
            text_content: "有些话不是不想说，只是还没找到可以安放的房间。",
            emotional_tone: "quiet_withheld",
            themes: ["unsaid_words", "boundary", "night"],
            expression_style: "implicit",
            self_presentation: "reserved_authentic",
            time_clue: "late_night",
            psychological_signals: ["withheld_expression", "boundary_need", "emotional_depth"],
          },
        ],
        social_posts_overall_pattern: {
          dominant_emotion: "quiet",
          core_themes: ["boundary", "unsaid_words", "night"],
          expression_authenticity: "high",
        },
        precious_photo_analysis: {
          visual_content: "empty rooftop with distant city light",
          composition: "wide frame and small foreground",
          lighting: "low backlight",
          color_mood: "deep black gold",
          symbolic_elements: ["rooftop", "distant_light", "threshold"],
          psychological_interpretation: {
            core_themes: ["boundary", "solitude", "meaning_seeking"],
            emotional_tone: "contained",
            self_concept: "edge_observer",
            existential_stance: "waiting_before_entry",
            traits: ["introversion", "meaning_seeking", "aesthetic_sensitivity"],
          },
        },
        resonance_moments: ["C3-2", "C3-7"],
      },
    },
    aggregated_traits: {
      big_five: {
        openness: 84,
        conscientiousness: 60,
        extraversion: 32,
        agreeableness: 52,
        neuroticism: 72,
      },
      core_themes: ["meaning_seeking", "solitude", "boundary"],
      archetype_hints: ["black_hole_event_horizon", "lone_seeker"],
    },
  };
}

function createPart2Record() {
  return {
    part2_id: "part2_depth_export_contract",
    part1_id: "part1_depth_export_contract",
    theater_script_id: "theater_depth_export_contract",
    created_at: "2026-05-15T00:08:00.000Z",
    act2_choices: [
      { choice_id: 1, selected: "1B", hesitation_time: 7.2, timestamp: "2026-05-15T00:09:00.000Z" },
      { choice_id: 2, selected: "2A", hesitation_time: 8.4, timestamp: "2026-05-15T00:10:00.000Z" },
      { choice_id: 3, selected: "3A", hesitation_time: 10.1, timestamp: "2026-05-15T00:11:00.000Z" },
      { choice_id: 4, selected: "4C", hesitation_time: 9.6, timestamp: "2026-05-15T00:12:00.000Z" },
    ],
    act3_responses: [],
    metadata: {
      total_time: 360,
      device: "ios-native",
      phase_durations: { act1: 42, act2: 210 },
    },
  };
}

test("constellation prompts require unconscious-level evidence, not only poetic archetype language", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const analystPrompt = buildAnalystUserPrompt(part1, part2, fallback);
  const fastPrompt = buildFastAnalystUserPrompt(part1, part2, fallback);

  for (const prompt of [analystPrompt, fastPrompt]) {
    assert.match(prompt, /潜意识|意识之外/u);
    assert.match(prompt, /防御|欲望|投射|重复|阴影|客体关系/u);
    assert.match(prompt, /意外感|不自知|尚未意识/u);
    assert.match(prompt, /引经据典|思想旁证|哲学与文艺旁证/u);
  }
});

test("deterministic constellation speaks in direct psychoanalytic conclusions", () => {
  const constellation = generateDeterministicConstellation(createPart1Record(), createPart2Record());
  const dimensionTexts = Object.values(constellation.seven_dimensions).map((dimension) => dimension.interpretation);

  assert.match(constellation.narrative_overview, /潜意识|意识之外/u);
  assert.match(constellation.narrative_overview, /防御|欲望|投射|重复|阴影|客体关系/u);
  assert.match(constellation.narrative_overview, /荣格|温尼科特|弗洛伊德|拉康|加缪|尼采/u);
  assert.match(constellation.narrative_overview, /你真正想确认的是|你反复保护的是|你不自知地/u);
  assert.ok(dimensionTexts.every((text) => /^结论：/u.test(text)), "dimension interpretations must start with a direct conclusion");
  assert.ok(dimensionTexts.every((text) => /潜在防御：|潜在意图：/u.test(text)), "dimension interpretations must name intention or defense");
  assert.ok(dimensionTexts.every((text) => /盲点：/u.test(text)), "dimension interpretations must name a concrete blind spot");
  assert.ok(dimensionTexts.every((text) => !/不是一个分数|不是一个分析/u.test(text)), "dimension interpretations must avoid circular score disclaimers");
});

test("native constellation dimension UI is structured with bold mental-feature labels", () => {
  assert.doesNotMatch(nativeConstellationView, /不是一个分数|不是一个分析/u);
  for (const label of ["核心结论", "潜在防御", "盲点", "可用方向"]) {
    assert.match(nativeConstellationView, new RegExp(label), `native dimension card must expose ${label}`);
  }
  assert.match(nativeConstellationView, /font\(\.system\(size:\s*13,\s*weight:\s*\.black/u, "dimension labels should be visually emphasized");
});

test("saved constellation image is a full long report, not a compact share card", () => {
  assert.match(nativeRenderer, /long|Long|长图|完整星图/u);
  assert.match(nativeRenderer, /height:\s*3[0-9]{3}|height:\s*4[0-9]{3}/u, "poster renderer should be tall enough for the full constellation page");
  for (const section of ["七维轨道", "星际谱系", "核心张力", "精神肖像", "继续共鸣"]) {
    assert.match(nativeRenderer, new RegExp(section), `long image renderer must include ${section}`);
  }
  assert.match(nativeRenderer, /在「本源」里，生成你的精神星图/u);
  assert.match(nativeRenderer, /搜索「本源」/u);
  assert.match(nativeRenderer, /发给想一起探索的人/u);
  assert.match(nativeActions, /星图长图已保存到相册/u);
  assert.doesNotMatch(nativeActions, /星图摘要已保存/u);
});
