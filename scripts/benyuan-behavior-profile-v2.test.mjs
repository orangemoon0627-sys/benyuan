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

const {
  buildBehaviorProfileV2,
  formatBehaviorProfileV2Dossier,
  scoreShadowArchetypes,
} = await import("../src/lib/benyuan-v3-behavior-profile.ts");
const { normalizeFastConstellationSeed, normalizeFastTheaterSeed } = await import("../src/lib/benyuan-v3-agent.ts");

function behavior(signal, polarity, temporalScope, evidence) {
  return { signal, polarity, confidence: 0.88, temporal_scope: temporalScope, evidence: [evidence] };
}

function part1({ musicSignals = [], photoSignals = [], socialSignals = [] } = {}) {
  return {
    part1_id: "part1_profile_v2",
    user_id: "usr_profile_v2",
    data_cohort: "test",
    data_environment: "test",
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
    answers: {},
    part1_data: {
      aesthetics: {
        music_analysis: {
          analysis_status: "analyzed",
          evidence_quality: "high",
          primary_genres: ["ambient", "post-rock"],
          emotional_tone: "slow build and suspended release",
          era_distribution: {},
          language_diversity: ["instrumental"],
          personality_signals: {},
          behavioral_signals: musicSignals,
        },
      },
      philosophy: {},
      narrative: {
        social_posts_analysis: socialSignals.length > 0 ? [{
          post_id: 1,
          text_content: "我总会在真正靠近之前多停一会儿。",
          emotional_tone: "restrained",
          themes: ["distance"],
          expression_style: "indirect",
          self_presentation: "contained",
          time_clue: "recent",
          psychological_signals: [],
          behavioral_signals: socialSignals,
        }] : [],
        social_posts_overall_pattern: socialSignals.length > 0 ? {
          analysis_status: "analyzed",
          evidence_quality: "medium",
          dominant_emotion: "restrained",
          core_themes: ["distance"],
          expression_authenticity: "medium",
        } : null,
        precious_photo_analysis: {
          analysis_status: "analyzed",
          evidence_quality: "high",
          visual_content: "a person standing beyond a dark doorway",
          composition: "wide negative space",
          lighting: "low light",
          color_mood: "cool",
          symbolic_elements: ["doorway"],
          behavioral_signals: photoSignals,
          psychological_interpretation: {
            core_themes: ["boundary"],
            emotional_tone: "quiet",
            self_concept: "observer",
            existential_stance: "waiting",
            traits: [],
          },
        },
      },
    },
    aggregated_traits: {
      big_five: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
      core_themes: [],
      archetype_hints: ["lone_seeker"],
    },
  };
}

function findSignal(profile, key) {
  const signal = profile.signals.find((item) => item.key === key);
  assert.ok(signal, `expected ${key}`);
  return signal;
}

test("BehaviorProfileV2 separates current state from stable cross-source tendencies", () => {
  const current = buildBehaviorProfileV2(part1({
    socialSignals: [behavior("relationship_mirror_need", "support", "current_state", "最近会反复确认回应")],
  }));
  assert.equal(findSignal(current, "relationship_mirror_need").state, "current_state");

  const stable = buildBehaviorProfileV2(part1({
    musicSignals: [behavior("meaning_orientation", "support", "long_term_preference", "长期偏好层层展开的音乐")],
    photoSignals: [behavior("meaning_orientation", "support", "symbolic_material", "门后路径成为重复母题")],
  }));
  const meaning = findSignal(stable, "meaning_orientation");
  assert.equal(meaning.state, "stable");
  assert.ok(meaning.source_diversity >= 2);
  assert.ok(meaning.confidence >= 0.7);
});

test("conflicting evidence remains a tension and preserves both evidence sides", () => {
  const profile = buildBehaviorProfileV2(part1({
    musicSignals: [behavior("object_distance", "support", "long_term_preference", "偏好保留距离的声音空间")],
    photoSignals: [behavior("object_distance", "counter", "symbolic_material", "主体主动穿过门靠近他人")],
  }));
  const distance = findSignal(profile, "object_distance");
  assert.equal(distance.state, "conflicted");
  assert.equal(distance.support_evidence_ids.length, 1);
  assert.equal(distance.counter_evidence_ids.length, 1);
  assert.ok(profile.theater_sampling_gaps.some((gap) => gap.signal === "object_distance" && gap.reason === "conflicted"));
});

test("source context keeps narrative material compact while profile revision stays deterministic", () => {
  const record = part1();
  const first = buildBehaviorProfileV2(record);
  const second = buildBehaviorProfileV2(record);
  assert.equal(first.revision, second.revision);
  assert.deepEqual(first.source_context.music.genres, ["ambient", "post-rock"]);
  const dossier = formatBehaviorProfileV2Dossier(first, { maxSignals: 3, evidencePerPolarity: 1 });
  assert.match(dossier, /ambient \/ post-rock/u);
  assert.match(dossier, /受控来源上下文/u);
});

test("insufficient multimodal records cannot re-enter prompts through source context", () => {
  const record = part1();
  record.part1_data.aesthetics.music_analysis.analysis_status = "insufficient_evidence";
  record.part1_data.aesthetics.music_analysis.evidence_quality = "none";
  record.part1_data.narrative.precious_photo_analysis.analysis_status = "insufficient_evidence";
  record.part1_data.narrative.precious_photo_analysis.evidence_quality = "none";
  const profile = buildBehaviorProfileV2(record);
  assert.deepEqual(profile.source_context.music.genres, []);
  assert.equal(profile.source_context.music.emotional_tone, "insufficient_evidence");
  assert.equal(profile.source_context.photo.visual_motif, "insufficient_evidence");
  assert.deepEqual(profile.source_context.photo.symbolic_elements, []);
});

test("shadow scorer always remains a ten-way diagnostic and is omitted from downstream dossier labels", () => {
  const profile = buildBehaviorProfileV2(part1({
    musicSignals: [behavior("projection_symbolic_sensitivity", "support", "long_term_preference", "用声音保存难以直说的感受")],
    photoSignals: [behavior("transitional_space", "support", "symbolic_material", "门廊成为内外之间的过渡空间")],
  }));
  const shadow = scoreShadowArchetypes(profile.signals);
  assert.equal(shadow.mode, "shadow_only");
  assert.equal(shadow.scores.length, 10);
  assert.ok(shadow.margin >= 0);
  const dossier = formatBehaviorProfileV2Dossier(profile);
  assert.doesNotMatch(dossier, new RegExp(shadow.primary, "u"));
});

test("personalized seeds are accepted only when they reference the current profile evidence", () => {
  const profile = buildBehaviorProfileV2(part1({
    musicSignals: [behavior("meaning_orientation", "support", "long_term_preference", "长期寻找声音背后的意义")],
    photoSignals: [behavior("boundary_integrity", "support", "symbolic_material", "门框反复成为边界母题")],
  }));
  const evidenceIds = profile.signals.flatMap((signal) => signal.support_evidence_ids).slice(0, 2);
  const grounding = { profile_revision: profile.revision, evidence_ids: evidenceIds };

  assert.equal(normalizeFastTheaterSeed({ theater_seed: { motifs: ["门后的低频"], act2_rounds: [], mirror_questions: [] } }, profile), null);
  assert.ok(normalizeFastTheaterSeed({ theater_seed: { grounding, motifs: ["门后的低频"], act2_rounds: [], mirror_questions: [] } }, profile));
  assert.equal(normalizeFastConstellationSeed({ constellation_seed: { grounding: { ...grounding, profile_revision: "stale" }, mirror_paragraphs: ["你在门前停留。"] } }, profile), null);
  assert.ok(normalizeFastConstellationSeed({ constellation_seed: { grounding, mirror_paragraphs: ["你在门前停留。"] } }, profile));
});
