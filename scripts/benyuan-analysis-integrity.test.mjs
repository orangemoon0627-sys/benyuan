import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateTraitsFromPart1,
  analyzeMusicInputs,
  analyzePreciousPhotoInput,
  analyzeSocialPostInputs,
  buildPart1DataFromAnswers,
  generateDeterministicConstellation,
  generateDeterministicTheaterScript,
  resolvePart1ArchetypeHints,
} from "../src/lib/benyuan-v3-engine.ts";
import {
  buildPsychoanalyticConceptBrief,
  selectPsychoanalyticConceptsForPart1,
} from "../src/lib/benyuan-v3-psychoanalytic-concepts.ts";
import { restorePart2ChoiceSemantics } from "../src/lib/benyuan-v3-part2-semantics.ts";
import { getPart2ChoiceText } from "../src/lib/benyuan-v3-theater-labels.ts";
import { validateAndSnapshotPart2Choices } from "../src/lib/benyuan-v3-validation.ts";

function createPart1Record() {
  const answers = {
    A1_core_image: "A1-1",
    A3_literature: ["A3-1", "A3-2"],
    A4_cinema: "A4-1",
    A5_inspiration_scene: "A5-1",
    B1_night_thoughts: "B1-1",
    B2_decision_style: "B2-1",
    B3_emotion_pattern: "B3-1",
    B4_time_philosophy: { past: 30, present: 35, future: 35 },
    B5_relationship_philosophy: "B5-1",
    C3_resonance_moments: ["C3-1", "C3-2"],
  };
  const part1Data = buildPart1DataFromAnswers(answers);
  return {
    part1_id: "part1_integrity",
    user_id: "user_integrity",
    data_cohort: "local",
    data_environment: "test",
    created_at: "2026-07-11T00:00:00.000Z",
    updated_at: "2026-07-11T00:00:00.000Z",
    answers,
    part1_data: part1Data,
    aggregated_traits: aggregateTraitsFromPart1(answers, part1Data),
  };
}

function createTheaterScript() {
  return {
    user_id: "user_integrity",
    generated_at: "2026-07-11T00:00:00.000Z",
    personalization_summary: {
      core_archetype: "test",
      aesthetic_style: "test",
      emotional_tone: "test",
      key_themes: [],
    },
    act1: { scene_description: "scene", visual_prompt: "visual", ambient_sound: "quiet", duration: 30 },
    act2: {
      choices: Array.from({ length: 4 }, (_, index) => ({
        choice_id: index + 1,
        scene: `scene-${index + 1}`,
        options: [
          {
            id: `${index + 1}A`,
            text: `第 ${index + 1} 轮真实选项`,
            trait_signal: index === 0 ? "counterevidence_avoidance + self_protection" : "agency + action + exploration",
            response: `response-${index + 1}`,
          },
          {
            id: `${index + 1}B`,
            text: `第 ${index + 1} 轮备选项`,
            trait_signal: "relationship + trust",
            response: `alternate-${index + 1}`,
          },
        ],
      })),
    },
    act3: { scene_description: "", mirror_questions: [], mirror_final_words: "" },
    epilogue: { scene_description: "", closing_text: "", transition_prompt: "", transition_animation: "" },
  };
}

function createPart2(signals) {
  return {
    part2_id: "part2_integrity",
    part1_id: "part1_integrity",
    theater_script_id: "theater_integrity",
    data_cohort: "local",
    data_environment: "test",
    created_at: "2026-07-11T00:01:00.000Z",
    act2_choices: signals.map((traitSignal, index) => ({
      choice_id: index + 1,
      selected: `${index + 1}A`,
      option_text: `自适应选项 ${index + 1}`,
      trait_signal: traitSignal,
      option_response: `回应 ${index + 1}`,
      timestamp: `2026-07-11T00:01:0${index}.000Z`,
    })),
    act3_responses: [],
    metadata: {},
  };
}

test("multimodal fallback is explicitly evidence-free and cannot change aggregated traits", () => {
  const record = createPart1Record();
  const baseline = aggregateTraitsFromPart1(record.answers, record.part1_data);
  const music = analyzeMusicInputs([{ source: "playlist-screenshot.png" }]);
  const social = analyzeSocialPostInputs([{ source: "social-screenshot.png" }]);
  const photo = analyzePreciousPhotoInput({ description: "C2_precious_photo_analysis:IMG_001.png" });

  assert.equal(music.analysis_status, "insufficient_evidence");
  assert.deepEqual(music.personality_signals, {});
  assert.equal(social.overallPattern.analysis_status, "insufficient_evidence");
  assert.deepEqual(social.posts, []);
  assert.equal(photo.analysis_status, "insufficient_evidence");
  assert.deepEqual(photo.psychological_interpretation.traits, []);

  const withFallback = {
    ...record.part1_data,
    aesthetics: { ...record.part1_data.aesthetics, music_analysis: music },
    narrative: {
      ...record.part1_data.narrative,
      social_posts_analysis: social.posts,
      social_posts_overall_pattern: social.overallPattern,
      precious_photo_analysis: photo,
    },
  };
  assert.deepEqual(aggregateTraitsFromPart1(record.answers, withFallback), baseline);
});

test("legacy multimodal records without an analyzed status cannot change aggregated traits", () => {
  const record = createPart1Record();
  const baseline = aggregateTraitsFromPart1(record.answers, record.part1_data);
  const legacyData = {
    ...record.part1_data,
    aesthetics: {
      ...record.part1_data.aesthetics,
      music_analysis: {
        primary_genres: ["ambient"],
        emotional_tone: "reflective",
        era_distribution: {},
        language_diversity: ["instrumental"],
        personality_signals: { openness: "high", emotional_depth: "high" },
      },
    },
    narrative: {
      ...record.part1_data.narrative,
      social_posts_analysis: [{
        post_id: 1,
        text_content: "legacy synthetic signal",
        emotional_tone: "deep",
        themes: ["meaning"],
        expression_style: "poetic",
        self_presentation: "reserved",
        time_clue: "unknown",
        psychological_signals: ["high_sensitivity", "emotional_depth", "solitary_reflection"],
      }],
      social_posts_overall_pattern: {
        dominant_emotion: "deep",
        core_themes: ["meaning", "solitude"],
        expression_authenticity: "high",
      },
      precious_photo_analysis: {
        visual_content: "legacy synthetic image",
        composition: "centered",
        lighting: "low",
        color_mood: "quiet",
        symbolic_elements: ["threshold"],
        psychological_interpretation: {
          core_themes: ["meaning"],
          emotional_tone: "deep",
          self_concept: "observer",
          existential_stance: "searching",
          traits: ["high_openness", "introversion", "meaning_seeking"],
        },
      },
    },
  };

  assert.deepEqual(aggregateTraitsFromPart1(record.answers, legacyData), baseline);
});

test("part2 validation snapshots adaptive semantics and rejects malformed four-round logs", () => {
  const theater = createTheaterScript();
  const valid = theater.act2.choices.map((choice, index) => ({
    choice_id: choice.choice_id,
    selected: choice.options[0].id,
    hesitation_time: index + 0.5,
    timestamp: `2026-07-11T00:01:0${index}.000Z`,
  }));

  const result = validateAndSnapshotPart2Choices(theater, valid);
  assert.equal(result.ok, true);
  assert.equal(result.choices[0].option_text, "第 1 轮真实选项");
  assert.equal(result.choices[0].trait_signal, "counterevidence_avoidance + self_protection");
  assert.equal(result.choices[0].option_response, "response-1");

  const duplicate = validateAndSnapshotPart2Choices(theater, [valid[0], valid[0], valid[2], valid[3]]);
  assert.deepEqual({ ok: duplicate.ok, error: duplicate.error }, { ok: false, error: "duplicate_theater_act2_choice" });

  const unknownOption = validateAndSnapshotPart2Choices(theater, valid.map((item, index) => index === 2 ? { ...item, selected: "3Z" } : item));
  assert.deepEqual({ ok: unknownOption.ok, error: unknownOption.error }, { ok: false, error: "invalid_theater_act2_option" });

  const incomplete = validateAndSnapshotPart2Choices(theater, valid.slice(0, 3));
  assert.deepEqual({ ok: incomplete.ok, error: incomplete.error }, { ok: false, error: "incomplete_theater_act2_choices" });
});

test("historical part2 semantics recover only from the associated original theater script", () => {
  const theater = createTheaterScript();
  const theaterRecord = {
    theater_script_id: "theater_integrity",
    part1_id: "part1_integrity",
    data_cohort: "local",
    data_environment: "test",
    created_at: "2026-07-11T00:00:30.000Z",
    runtime: { provider: "fixture", model: "fixture", mode: "live" },
    theater_script: theater,
  };
  const legacy = {
    ...createPart2([]),
    act2_choices: theater.act2.choices.map((choice, index) => ({
      choice_id: choice.choice_id,
      selected: choice.options[0].id,
      timestamp: `2026-07-11T00:01:0${index}.000Z`,
    })),
  };

  const restored = restorePart2ChoiceSemantics(legacy, theaterRecord);
  assert.equal(restored.act2_choices[0].option_text, "第 1 轮真实选项");
  assert.equal(restored.act2_choices[0].trait_signal, "counterevidence_avoidance + self_protection");
  assert.equal(restored.act2_choices[0].option_response, "response-1");

  const snapshotted = {
    ...legacy,
    act2_choices: legacy.act2_choices.map((choice, index) => index === 0
      ? { ...choice, option_text: "当时保存的文字", trait_signal: "historical_signal", option_response: "当时保存的回应" }
      : choice),
  };
  const preserved = restorePart2ChoiceSemantics(snapshotted, theaterRecord);
  assert.equal(preserved.act2_choices[0].option_text, "当时保存的文字");
  assert.equal(preserved.act2_choices[0].trait_signal, "historical_signal");
  assert.equal(preserved.act2_choices[0].option_response, "当时保存的回应");

  const withoutScript = restorePart2ChoiceSemantics(legacy, undefined);
  assert.equal(withoutScript.act2_choices[0].option_text, undefined);
  assert.equal(withoutScript.act2_choices[0].trait_signal, undefined);
  assert.equal(getPart2ChoiceText(withoutScript.act2_choices[0]), "");

  const wrongScript = restorePart2ChoiceSemantics(legacy, { ...theaterRecord, theater_script_id: "theater_other" });
  assert.equal(wrongScript.act2_choices[0].option_text, undefined);
  assert.equal(wrongScript.act2_choices[0].trait_signal, undefined);
});

test("historical option ids without semantic snapshots cannot alter the current scoring model", () => {
  const part1 = createPart1Record();
  part1.aggregated_traits.archetype_hints = ["rational_builder"];
  const legacy = {
    ...createPart2([]),
    act2_choices: Array.from({ length: 4 }, (_, index) => ({
      choice_id: index + 1,
      selected: `${index + 1}A`,
      timestamp: `2026-07-11T00:01:0${index}.000Z`,
    })),
  };

  const baseline = generateDeterministicConstellation(part1);
  const withUnresolvedHistory = generateDeterministicConstellation(part1, legacy);
  assert.equal(withUnresolvedHistory.archetype.name, baseline.archetype.name);
  assert.deepEqual(withUnresolvedHistory.seven_dimensions, baseline.seven_dimensions);
  assert.deepEqual(withUnresolvedHistory.recommendations, baseline.recommendations);
});

test("unknown stored archetype hints are recomputed from Part 1 instead of impersonating a moon profile", () => {
  const baseline = createPart1Record();
  const expectedHints = [...baseline.aggregated_traits.archetype_hints];
  const corrupted = createPart1Record();
  corrupted.aggregated_traits.archetype_hints = ["legacy_unknown_label"];

  assert.deepEqual(resolvePart1ArchetypeHints(corrupted), expectedHints);
  assert.deepEqual(
    generateDeterministicConstellation(corrupted).archetype,
    generateDeterministicConstellation(baseline).archetype,
  );
  assert.equal(
    generateDeterministicTheaterScript(corrupted).personalization_summary.core_archetype,
    generateDeterministicTheaterScript(baseline).personalization_summary.core_archetype,
  );
});

test("seven dimensions follow snapshotted trait semantics instead of reusable option ids", () => {
  const part1 = createPart1Record();
  part1.aggregated_traits.big_five.openness = 50;
  const actionSignals = Array(4).fill("agency + action + exploration + risk_taking");
  const avoidanceSignals = Array(4).fill("counterevidence_avoidance + withdrawal + delay + self_preservation");
  const action = generateDeterministicConstellation(part1, createPart2(actionSignals));
  const avoidance = generateDeterministicConstellation(part1, createPart2(avoidanceSignals));

  assert(action.seven_dimensions.action_tendency.score > avoidance.seven_dimensions.action_tendency.score);
  assert(action.seven_dimensions.openness.score > avoidance.seven_dimensions.openness.score);
});

test("explicit counter-evidence reverses avoidance while ordinary avoidant signals remain supporting evidence", () => {
  const part1 = createPart1Record();
  part1.aggregated_traits.archetype_hints = ["rational_builder", "black_hole_event_horizon"];
  const avoidant = generateDeterministicConstellation(
    part1,
    createPart2(Array(4).fill("avoidant_attachment + withdrawal")),
  );
  const counterAvoidant = generateDeterministicConstellation(
    part1,
    createPart2(Array(4).fill("counterevidence_avoidant_attachment + counterevidence_withdrawal")),
  );

  assert(avoidant.seven_dimensions.action_tendency.score < counterAvoidant.seven_dimensions.action_tendency.score);
  assert.equal(avoidant.archetype.name, "事件视界沉潜者");
  assert.notEqual(counterAvoidant.archetype.name, "事件视界沉潜者");
});

test("B4 time gravity changes deterministic themes and dimensions", () => {
  const past = createPart1Record();
  past.answers.B4_time_philosophy = { past: 100, present: 0, future: 0 };
  past.part1_data = buildPart1DataFromAnswers(past.answers);
  past.aggregated_traits = aggregateTraitsFromPart1(past.answers, past.part1_data);
  past.aggregated_traits.big_five.openness = 50;

  const future = createPart1Record();
  future.answers.B4_time_philosophy = { past: 0, present: 0, future: 100 };
  future.part1_data = buildPart1DataFromAnswers(future.answers);
  future.aggregated_traits = aggregateTraitsFromPart1(future.answers, future.part1_data);
  future.aggregated_traits.big_five.openness = 50;

  const pastReport = generateDeterministicConstellation(past);
  const futureReport = generateDeterministicConstellation(future);
  assert.notDeepEqual(past.aggregated_traits.core_themes, future.aggregated_traits.core_themes);
  assert(pastReport.seven_dimensions.emotional_depth.score > futureReport.seven_dimensions.emotional_depth.score);
  assert(futureReport.seven_dimensions.openness.score > pastReport.seven_dimensions.openness.score);
});

test("four coherent theater rounds can update the canonical archetype within the fixed ten labels", () => {
  const part1 = createPart1Record();
  part1.aggregated_traits.archetype_hints = ["rational_builder"];
  const beforeTheater = generateDeterministicConstellation(part1);
  const afterTheater = generateDeterministicConstellation(
    part1,
    createPart2(Array(4).fill("agency + action + movement + risk_taking")),
  );

  assert.notEqual(afterTheater.archetype.name, beforeTheater.archetype.name);
  assert.equal(afterTheater.archetype.name, "日冕引燃者");
});

test("unmatched psychoanalytic cards stay conceptual lenses, not fabricated user evidence", () => {
  const record = createPart1Record();
  record.answers = {};
  record.part1_data = buildPart1DataFromAnswers({});
  record.aggregated_traits = aggregateTraitsFromPart1({}, record.part1_data);
  const concepts = selectPsychoanalyticConceptsForPart1(record);
  const brief = buildPsychoanalyticConceptBrief(concepts);

  assert(concepts.some((item) => item.evidenceBasis === "conceptual_lens"));
  assert.match(brief, /仅作为概念镜片，不是用户输入证据/u);
  assert.doesNotMatch(brief, /用户输入证据：用户/u);
});
