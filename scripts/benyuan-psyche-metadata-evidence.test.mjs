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

const { buildPsycheMetadataDossier, buildPsycheMetadataProfile } = await import("../src/lib/benyuan-v3-psyche-metadata.ts");

function createPart1Record({ answers = {}, music = null, socialPosts = [], socialOverall = null, photo = null } = {}) {
  return {
    part1_id: "part1_evidence_contract",
    user_id: "usr_evidence_contract",
    created_at: "2026-07-11T00:00:00.000Z",
    updated_at: "2026-07-11T00:00:00.000Z",
    answers,
    part1_data: {
      aesthetics: { music_analysis: music },
      philosophy: {},
      narrative: {
        social_posts_analysis: socialPosts,
        social_posts_overall_pattern: socialOverall,
        precious_photo_analysis: photo,
      },
    },
    aggregated_traits: {
      big_five: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
      core_themes: [],
      archetype_hints: [],
    },
  };
}

function createMusic(analysisStatus = "analyzed") {
  return {
    analysis_status: analysisStatus,
    evidence_quality: "high",
    primary_genres: ["ambient music"],
    emotional_tone: "symbolic and reflective",
    era_distribution: {},
    language_diversity: ["instrumental"],
    personality_signals: { aesthetic_sensitivity: "high" },
  };
}

function createPhoto(analysisStatus = "analyzed") {
  return {
    analysis_status: analysisStatus,
    evidence_quality: "high",
    visual_content: "a symbolic projection portrait",
    composition: "visual symbol in a wide frame",
    lighting: "soft light",
    color_mood: "quiet",
    symbolic_elements: ["threshold"],
    psychological_interpretation: {
      core_themes: ["projection", "aesthetic_sensitivity"],
      emotional_tone: "reflective",
      self_concept: "observer",
      existential_stance: "meaning seeking",
      traits: ["symbolic_sensitivity"],
    },
  };
}

function signal(profile, key) {
  const entry = profile.selectedSignals.find((item) => item.key === key);
  assert.ok(entry, `expected ${key} signal`);
  return entry;
}

function assertEvidenceMetadata(records) {
  assert.ok(records.length > 0);
  for (const record of records) {
    assert.equal(typeof record.evidence, "string");
    assert.equal(typeof record.source_kind, "string");
    assert.equal(typeof record.source_id, "string");
    assert.equal(typeof record.temporal_scope, "string");
    assert.match(record.polarity, /^(support|counter)$/);
    assert.equal(typeof record.confidence, "number");
    assert.ok(record.confidence >= 0 && record.confidence <= 1);
    assert.equal(typeof record.independence_group, "string");
  }
}

test("derived descriptions from each multimodal asset remain one independent source", () => {
  const part1 = createPart1Record({ photo: createPhoto() });
  const profile = buildPsycheMetadataProfile(part1);
  const projection = signal(profile, "projection_symbolic_sensitivity");

  assert.deepEqual(Object.keys(profile).sort(), [
    "dominantTensions",
    "legacyIsolation",
    "multimodalSignalVocabulary",
    "narrativeInstruction",
    "note",
    "privacyBoundary",
    "rawAnswerCount",
    "selectedSignals",
    "theaterSupplementTargets",
  ]);
  assert.ok(projection.evidence.length >= 2, "legacy evidence strings should remain available");
  assert.ok(projection.evidence_records.length >= 2, "derived descriptions should retain their provenance records");
  assertEvidenceMetadata(projection.evidence_records);
  assert.equal(new Set(projection.evidence_records.map((record) => record.independence_group)).size, 1);
  assert.equal(projection.independent_source_count, 1);
  assert.equal(projection.source_kind_count, 1);
  assert.equal(projection.support_count, 1);
  assert.equal(projection.counter_count, 0);
  assert.deepEqual(projection.temporal_scope, ["remembered_or_symbolic_material"]);
  assert.match(buildPsycheMetadataDossier(part1), /projection_symbolic_sensitivity \/ 投射与象征感受力 \/ weak_signal/u);

  const musicProfile = buildPsycheMetadataProfile(createPart1Record({ music: createMusic() }));
  const transitional = signal(musicProfile, "transitional_space");
  assert.ok(transitional.evidence_records.length >= 2);
  assert.equal(transitional.independent_source_count, 1);
  assert.equal(transitional.support_count, 1);

  const socialProfile = buildPsycheMetadataProfile(createPart1Record({
    socialPosts: [
      {
        post_id: 1,
        text_content: "I keep returning to what this means.",
        emotional_tone: "reflective",
        themes: ["meaning"],
        expression_style: "direct",
        self_presentation: "open",
        time_clue: "recent",
        psychological_signals: ["meaning_seeking"],
      },
    ],
    socialOverall: {
      analysis_status: "analyzed",
      evidence_quality: "high",
      dominant_emotion: "reflective",
      core_themes: ["meaning"],
      expression_authenticity: "high",
    },
  }));
  const meaning = signal(socialProfile, "meaning_orientation");
  assert.ok(meaning.evidence_records.length >= 2);
  assert.equal(meaning.independent_source_count, 1);
  assert.equal(meaning.support_count, 1);
});

test("support across music and photo sources strengthens a signal", () => {
  const part1 = createPart1Record({ music: createMusic(), photo: createPhoto() });
  const profile = buildPsycheMetadataProfile(part1);
  const projection = signal(profile, "projection_symbolic_sensitivity");

  assert.equal(projection.independent_source_count, 2);
  assert.equal(projection.source_kind_count, 2);
  assert.equal(projection.support_count, 2);
  assert.deepEqual(new Set(projection.evidence_records.map((record) => record.source_kind)), new Set(["music", "photo"]));
  assert.match(buildPsycheMetadataDossier(part1), /projection_symbolic_sensitivity \/ 投射与象征感受力 \/ medium_signal/u);

  const questionProfile = buildPsycheMetadataProfile(createPart1Record({
    answers: {
      A1_core_image: "A1-1",
      B1_night_thoughts: "B1-6",
    },
  }));
  const meaning = signal(questionProfile, "meaning_orientation");
  assert.equal(meaning.independent_source_count, 2);
  assert.equal(meaning.source_kind_count, 1);
  assert.equal(meaning.support_count, 2);
});

test("structured multimodal signals outrank keyword inference and preserve alternative explanations", () => {
  const music = {
    ...createMusic(),
    personality_signals: { projection_symbolic_sensitivity: "high" },
    behavioral_signals: [
      {
        signal: "meaning_orientation",
        polarity: "support",
        confidence: 0.84,
        temporal_scope: "long_term_preference",
        evidence: ["曲目长期保持缓慢展开", "主题反复回到时间与存在"],
        alternative_explanation: "也可能是专注场景下的功能性选择",
      },
    ],
  };
  const part1 = createPart1Record({ music });
  const profile = buildPsycheMetadataProfile(part1);
  const meaning = signal(profile, "meaning_orientation");

  assert.equal(meaning.independent_source_count, 1);
  assert.equal(meaning.evidence_records[0].confidence, 0.84);
  assert.equal(meaning.evidence_records[0].temporal_scope, "long_term_preference");
  assert.match(meaning.evidence_records[0].evidence, /缓慢展开/u);
  assert.match(buildPsycheMetadataDossier(part1), /备选解释：也可能是专注场景下的功能性选择/u);
  assert.equal(
    profile.selectedSignals.some((item) => item.key === "projection_symbolic_sensitivity"),
    false,
    "structured signals should be authoritative when present instead of double-counting keyword fallbacks",
  );
});

test("insufficient multimodal analyses contribute no psyche evidence", () => {
  const part1 = createPart1Record({
    music: createMusic("insufficient_evidence"),
    socialPosts: [
      {
        post_id: 1,
        text_content: "meaning boundary projection solitude",
        emotional_tone: "withheld",
        themes: ["meaning", "boundary"],
        expression_style: "symbolic",
        self_presentation: "reserved",
        time_clue: "late_night",
        psychological_signals: ["projection", "repression"],
      },
    ],
    socialOverall: {
      analysis_status: "insufficient_evidence",
      evidence_quality: "none",
      dominant_emotion: "withheld",
      core_themes: ["meaning", "boundary", "projection"],
      expression_authenticity: "unknown",
    },
    photo: createPhoto("insufficient_evidence"),
  });

  assert.deepEqual(buildPsycheMetadataProfile(part1).selectedSignals, []);
});

test("theater option metadata records counter-evidence and keeps rounds independent", () => {
  const part1 = createPart1Record();
  const part2 = {
    part2_id: "part2_evidence_contract",
    part1_id: part1.part1_id,
    theater_script_id: "theater_evidence_contract",
    created_at: "2026-07-11T00:10:00.000Z",
    act2_choices: [
      {
        choice_id: 1,
        selected: "opaque-counter-option",
        option_text: "把这一刻留在原地",
        trait_signal: "counter_boundary",
        timestamp: "2026-07-11T00:11:00.000Z",
      },
      {
        choice_id: 2,
        selected: "opaque-support-option",
        option_text: "让下一步保持自己的节奏",
        trait_signal: "boundary_integrity",
        timestamp: "2026-07-11T00:12:00.000Z",
      },
    ],
    act3_responses: [],
    metadata: {},
  };
  const profile = buildPsycheMetadataProfile(part1, part2);
  const boundary = signal(profile, "boundary_integrity");

  assert.equal(boundary.independent_source_count, 2);
  assert.equal(boundary.source_kind_count, 1);
  assert.equal(boundary.support_count, 1);
  assert.equal(boundary.counter_count, 1);
  assert.deepEqual(new Set(boundary.evidence_records.map((record) => record.polarity)), new Set(["support", "counter"]));
  assert.ok(boundary.evidence_records.some((record) => record.evidence.includes("把这一刻留在原地")));
  assert.ok(boundary.evidence_records.every((record) => record.source_kind === "theater"));
  assert.ok(boundary.evidence_records.every((record) => record.temporal_scope === "current_theater_session"));
  assert.match(profile.theaterSupplementTargets[0], /boundary_integrity.*支持与反证/u);
});

test("theater trait components classify avoidance by explicit polarity rather than keyword", () => {
  const part1 = createPart1Record();
  const part2 = {
    part2_id: "part2_polarity_contract",
    part1_id: part1.part1_id,
    theater_script_id: "theater_polarity_contract",
    created_at: "2026-07-11T00:20:00.000Z",
    act2_choices: [
      {
        choice_id: 1,
        selected: "avoidant-support",
        option_text: "先退半步，保住自己的位置",
        trait_signal: "avoidant_attachment + self_preservation",
        timestamp: "2026-07-11T00:21:00.000Z",
      },
      {
        choice_id: 2,
        selected: "avoidant-counter",
        option_text: "确认这一次不必退开",
        trait_signal: "counterevidence_avoidance",
        timestamp: "2026-07-11T00:22:00.000Z",
      },
    ],
    act3_responses: [],
    metadata: {},
  };
  const profile = buildPsycheMetadataProfile(part1, part2);
  const defense = signal(profile, "defense_style");

  assert.equal(defense.support_count, 1);
  assert.equal(defense.counter_count, 1);
  assert.equal(
    defense.evidence_records.find((record) => record.source_id.endsWith(":1"))?.polarity,
    "support",
  );
  assert.equal(
    defense.evidence_records.find((record) => record.source_id.endsWith(":2"))?.polarity,
    "counter",
  );
});
