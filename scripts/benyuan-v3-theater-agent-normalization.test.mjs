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

const { aggregateTraitsFromPart1, generateDeterministicTheaterScript } = await import("../src/lib/benyuan-v3-engine.ts");
const { normalizeTheaterScript } = await import("../src/lib/benyuan-v3-agent.ts");
const { getBenyuanArchetypeProfile } = await import("../src/lib/benyuan-v3-report-profile.ts");

const visibleLeakPattern =
  /undetermined_no_visible_music_playlist_or_music_screenshot|melancholic_introspective|reflective_open|post-rock raw|post-rock|ambient|surrealist_melancholic|introspective_cinematic|reflective_symbolic/i;

function collectVisibleTheaterText(script) {
  return [
    script.personalization_summary.core_archetype,
    script.personalization_summary.aesthetic_style,
    script.personalization_summary.emotional_tone,
    ...script.personalization_summary.key_themes,
    script.act1.scene_description,
    ...script.act2.choices.flatMap((choice) => [
      choice.scene,
      ...choice.options.flatMap((option) => [option.text, option.response]),
    ]),
    script.act3.scene_description,
    ...script.act3.mirror_questions.flatMap((question) => [
      question.dialogue,
      question.question,
      ...question.options.map((option) => option.text),
    ]),
    script.act3.mirror_final_words,
    script.epilogue.scene_description,
    script.epilogue.closing_text,
    script.epilogue.transition_prompt,
  ].join("\n");
}

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

test("generateDeterministicTheaterScript renders music motif as readable Chinese fallback", () => {
  const record = createPart1Record();
  record.part1_data.aesthetics.music_analysis = {
    primary_genres: ["post-rock raw", "ambient", "undetermined_no_visible_music_playlist_or_music_screenshot"],
    emotional_tone: "melancholic_introspective",
    era_distribution: {},
    language_diversity: [],
    personality_signals: {},
  };

  const script = generateDeterministicTheaterScript(record);
  const visibleText = collectVisibleTheaterText(script);

  assert.doesNotMatch(visibleText, visibleLeakPattern);
  assert.match(script.act1.scene_description, /后摇|氛围|低频|回声|声音|旋律/u);
});

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

test("normalizeTheaterScript cleans visible slug and OCR noise without rewriting internal signals", () => {
  const fallback = generateDeterministicTheaterScript(createPart1Record());
  const normalized = normalizeTheaterScript(
    {
      theater_script: {
        user_id: "usr_theater_agent_normalization",
        personalization_summary: {
          core_archetype: "melancholic_poet",
          aesthetic_style: "surrealist_melancholic",
          emotional_tone: "reflective_open",
          key_themes: ["undetermined_no_visible_music_playlist_or_music_screenshot", "aesthetic_sensitivity"],
        },
        act1: {
          scene_description: "空气里漂着 post-rock raw 和 melancholic_introspective。",
        },
        act2: {
          choices: [
            {
              scene: "undetermined_no_visible_music_playlist_or_music_screenshot",
              options: [
                {
                  id: "1A",
                  text: "post-rock raw",
                  trait_signal: "internal_signal + melancholic_introspective",
                  response: "reflective_open",
                },
              ],
            },
          ],
        },
        act3: {
          scene_description: "melancholic_introspective",
          mirror_questions: [
            {
              dialogue: "post-rock raw",
              question: "reflective_open",
              options: [
                {
                  id: "3A-1",
                  text: "undetermined_no_visible_music_playlist_or_music_screenshot",
                  trait_signal: "relationship_need + being_understood_desire",
                },
              ],
            },
          ],
          mirror_final_words: "surrealist_melancholic",
        },
        epilogue: {
          scene_description: "ambient",
          closing_text: "melancholic_introspective",
          transition_prompt: "reflective_open",
          transition_animation: "stars_converging",
        },
      },
    },
    fallback,
  );

  assert.ok(normalized);
  const visibleText = collectVisibleTheaterText(normalized);

  assert.doesNotMatch(visibleText, visibleLeakPattern);
  assert.equal(normalized.act2.choices[0].options[0].id, "1A");
  assert.equal(normalized.act2.choices[0].options[0].trait_signal, "internal_signal + melancholic_introspective");
  assert.equal(normalized.epilogue.transition_animation, "stars_converging");
});

test("archetype profile catalog contains complete distinct celestial prototypes", () => {
  const newHints = [
    "lone_seeker",
    "rational_builder",
    "gentle_guardian",
    "existential_wanderer",
    "melancholic_poet",
    "black_hole_event_horizon",
    "nebula_weaver",
    "solar_corona",
    "terrestrial_planet",
    "deep_space_anchor",
  ];
  const officialNames = [
    "远潮观月者",
    "星图筑序者",
    "月港栖岸者",
    "存在游牧者",
    "雨窗抒写者",
    "事件视界沉潜者",
    "星云织梦者",
    "日冕引燃者",
    "类地栖居者",
    "深空锚定者",
  ];
  const profiles = newHints.map((hint) => getBenyuanArchetypeProfile(hint));

  assert.equal(new Set(profiles.map((profile) => profile.archetype.name)).size, newHints.length);
  assert.deepEqual(profiles.map((profile) => profile.archetype.name), officialNames);
  for (const profile of profiles) {
    assert.match(profile.archetype.name, /[\u4e00-\u9fff]/u);
    assert.doesNotMatch(profile.archetype.name, /暮海寻光|守光/u);
    assert.match(profile.archetype.english_name, /^[A-Z]/);
    assert.ok(profile.archetype.core_essence.length >= 24);
    assert.ok(profile.archetype.visual_prompt.length >= 40);
    assert.ok(profile.growthSuggestions.length >= 3);
    assert.ok(profile.recommendations.books.length >= 3);
    assert.ok(profile.recommendations.films.length >= 3);
    assert.ok(profile.recommendations.music.length >= 3);
  }
});

test("aggregateTraitsFromPart1 maps existing answers to new celestial archetype hints", () => {
  const base = createPart1Record().part1_data;
  const blackHoleTraits = aggregateTraitsFromPart1(
    {
      A1_core_image: "A1-6",
      A3_literature: ["A3-7"],
      A4_cinema: "A4-2",
      A5_inspiration_scene: "A5-5",
      B1_night_thoughts: "B1-1",
      B2_decision_style: "B2-4",
      B3_emotion_pattern: "B3-4",
      B5_relationship_philosophy: "B5-5",
      C3_resonance_moments: ["C3-7"],
    },
    base,
  );
  const solarTraits = aggregateTraitsFromPart1(
    {
      A1_core_image: "A1-1",
      A4_cinema: "A4-5",
      A5_inspiration_scene: "A5-3",
      B1_night_thoughts: "B1-5",
      B2_decision_style: "B2-5",
      B3_emotion_pattern: "B3-7",
      B5_relationship_philosophy: "B5-3",
      C3_resonance_moments: ["C3-6"],
    },
    base,
  );
  const earthTraits = aggregateTraitsFromPart1(
    {
      A1_core_image: "A1-5",
      A4_cinema: "A4-8",
      A5_inspiration_scene: "A5-3",
      B2_decision_style: "B2-1",
      B3_emotion_pattern: "B3-1",
      B5_relationship_philosophy: "B5-2",
      C3_resonance_moments: ["C3-3"],
    },
    base,
  );

  assert.ok(blackHoleTraits.archetype_hints.includes("black_hole_event_horizon"));
  assert.ok(solarTraits.archetype_hints.includes("solar_corona"));
  assert.ok(earthTraits.archetype_hints.includes("terrestrial_planet"));
});
