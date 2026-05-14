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

const conceptModule = await import("../src/lib/benyuan-v3-psychoanalytic-concepts.ts");
const { buildAnalystUserPrompt, buildDirectorUserPrompt, buildFastAnalystUserPrompt } = await import("../src/lib/benyuan-v3-prompts.ts");
const { generateDeterministicConstellation } = await import("../src/lib/benyuan-v3-engine.ts");

function createPart1Record() {
  return {
    part1_id: "part1_psychoanalytic_contract",
    user_id: "usr_psychoanalytic_contract",
    created_at: "2026-05-13T00:00:00.000Z",
    updated_at: "2026-05-13T00:00:00.000Z",
    answers: {
      A1_core_image: "A1-2",
      A3_literature: ["A3-2", "A3-5"],
      A4_cinema: "A4-3",
      A5_inspiration_scene: "A5-5",
      B1_night_thoughts: "B1-4",
      B2_decision_style: "B2-1",
      B3_emotion_pattern: "B3-2",
      B4_time_philosophy: { past: 44, present: 25, future: 31 },
      B5_relationship_philosophy: "B5-5",
      C3_resonance_moments: ["C3-2", "C3-7"],
    },
    part1_data: {
      aesthetics: {
        core_desire_image: "A1-2",
        literature: ["A3-2", "A3-5"],
        cinema: "A4-3",
        inspiration_scene: "A5-5",
        music_analysis: {
          primary_genres: ["ambient", "modern classical"],
          emotional_tone: "restrained_night",
          era_distribution: { "2010s": 50, "2020s": 30 },
          language_diversity: ["instrumental"],
          personality_signals: { emotional_depth: "high", introversion: "medium_high" },
        },
      },
      philosophy: {
        night_thoughts: "B1-4",
        decision_style: "B2-1",
        emotion_pattern: "B3-2",
        time_orientation: { past: 44, present: 25, future: 31 },
        relationship_philosophy: "B5-5",
      },
      narrative: {
        social_posts_analysis: [
          {
            post_id: 1,
            text_content: "有些话不是不想说，只是还没找到可以安放的房间。",
            emotional_tone: "quiet_withheld",
            themes: ["unsaid_words", "room", "boundary"],
            expression_style: "implicit",
            self_presentation: "reserved_authentic",
            time_clue: "late_night",
            psychological_signals: ["boundary_need", "withheld_expression"],
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
            traits: ["introversion", "meaning_seeking"],
          },
        },
        resonance_moments: ["C3-2", "C3-7"],
      },
    },
    aggregated_traits: {
      big_five: {
        openness: 82,
        conscientiousness: 58,
        extraversion: 34,
        agreeableness: 54,
        neuroticism: 68,
      },
      core_themes: ["meaning_seeking", "solitude", "boundary"],
      archetype_hints: ["black_hole_event_horizon", "lone_seeker"],
    },
  };
}

function createPart2Record() {
  return {
    part2_id: "part2_psychoanalytic_contract",
    part1_id: "part1_psychoanalytic_contract",
    theater_script_id: "theater_psychoanalytic_contract",
    created_at: "2026-05-13T00:08:00.000Z",
    act2_choices: [
      { choice_id: 1, selected: "1B", hesitation_time: 7.8, timestamp: "2026-05-13T00:09:00.000Z" },
      { choice_id: 2, selected: "2A", hesitation_time: 9.2, timestamp: "2026-05-13T00:10:00.000Z" },
      { choice_id: 3, selected: "3A", hesitation_time: 10.4, timestamp: "2026-05-13T00:11:00.000Z" },
    ],
    act3_responses: [
      { question_id: 1, selected: "3A-2", hesitation_time: 6.1, timestamp: "2026-05-13T00:12:00.000Z" },
      { question_id: 2, selected: "3B-5", hesitation_time: 8.5, timestamp: "2026-05-13T00:13:00.000Z" },
    ],
    metadata: {
      total_time: 388,
      device: "ios-native",
      phase_durations: { act1: 35, act2: 120, act3: 90 },
    },
  };
}

test("psychoanalytic concept cards provide safe structured reading material", () => {
  const { BENYUAN_PSYCHOANALYTIC_CONCEPTS, buildPsychoanalyticConceptBrief, selectPsychoanalyticConceptsForPart1 } = conceptModule;

  assert.ok(Array.isArray(BENYUAN_PSYCHOANALYTIC_CONCEPTS));
  assert.ok(BENYUAN_PSYCHOANALYTIC_CONCEPTS.length >= 20);

  for (const concept of BENYUAN_PSYCHOANALYTIC_CONCEPTS) {
    assert.ok(concept.id);
    assert.ok(concept.zhName);
    assert.ok(concept.coreMeaning.length > 12);
    assert.ok(concept.starMetaphors.length >= 2);
    assert.ok(concept.useWhen.length >= 2);
    assert.ok(concept.safeLanguage.length >= 1);
    assert.ok(concept.avoid.length >= 2);
  }

  const selected = selectPsychoanalyticConceptsForPart1(createPart1Record(), createPart2Record());
  assert.ok(selected.length >= 4);
  assert.ok(selected.some((item) => /边界|客体距离|被吞没|防御|阴影/u.test(item.concept.zhName)));

  const brief = buildPsychoanalyticConceptBrief(selected);
  assert.match(brief, /精神分析概念卡/u);
  assert.match(brief, /适用信号/u);
  assert.match(brief, /星图转译/u);
  assert.match(brief, /禁止误用/u);
});

test("director and analyst prompts use concept cards without allowing diagnosis", () => {
  const part1 = createPart1Record();
  const part2 = createPart2Record();
  const fallback = generateDeterministicConstellation(part1, part2);
  const directorPrompt = buildDirectorUserPrompt(part1);
  const analystPrompt = buildAnalystUserPrompt(part1, part2, fallback);
  const fastPrompt = buildFastAnalystUserPrompt(part1, part2, fallback);

  for (const prompt of [directorPrompt, analystPrompt, fastPrompt]) {
    assert.match(prompt, /精神分析概念卡/u);
    assert.match(prompt, /用户输入证据/u);
    assert.match(prompt, /星图转译/u);
    assert.match(prompt, /不是心理诊断|禁止诊断/u);
    assert.match(prompt, /不要判断用户有创伤|人格障碍|疾病/u);
  }

  assert.match(directorPrompt, /叙事种子/u);
  assert.match(directorPrompt, /recurring_choice_pattern/u);
  assert.match(directorPrompt, /central_object/u);
  assert.match(analystPrompt, /输入痕迹 → 精神结构 → 星体化命名 → 温和肯定/u);
  assert.match(fastPrompt, /concept_lenses/u);
});

test("deterministic constellation includes evidence-based psychoanalytic star translation", () => {
  const constellation = generateDeterministicConstellation(createPart1Record(), createPart2Record());

  assert.match(constellation.narrative_overview, /边界|轨道/u);
  assert.match(constellation.narrative_overview, /荣格|温尼科特|客体距离|防御/u);
  assert.match(constellation.narrative_overview, /不是.*诊断|不是.*缺陷|不是.*冷淡/u);
  assert.doesNotMatch(constellation.narrative_overview, /人格障碍|心理疾病|抑郁症|焦虑症|创伤诊断/u);
  assert.ok(constellation.narrative_overview.length > 700);
});
