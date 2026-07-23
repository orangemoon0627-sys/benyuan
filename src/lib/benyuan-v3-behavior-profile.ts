import { buildPsycheMetadataProfile } from "@/lib/benyuan-v3-psyche-metadata";
import type { BenyuanPsycheSignalKey } from "@/lib/benyuan-v3-trait-signals";
import type { Part1Record, Part2Record } from "@/lib/benyuan-v3-types";

export const BENYUAN_BEHAVIOR_PROFILE_SCHEMA_VERSION = "behavior-profile.v2" as const;

export type BenyuanBehaviorSignalState = "current_state" | "candidate" | "stable" | "conflicted";

export type BenyuanBehaviorEvidenceRef = {
  evidence_id: string;
  source_kind: string;
  source_id: string;
  temporal_scope: string;
  confidence: number;
  preview: string;
};

export type BenyuanBehaviorProfileSignal = {
  key: BenyuanPsycheSignalKey;
  name: string;
  state: BenyuanBehaviorSignalState;
  confidence: number;
  source_diversity: number;
  support_evidence_ids: string[];
  counter_evidence_ids: string[];
  support_evidence: BenyuanBehaviorEvidenceRef[];
  counter_evidence: BenyuanBehaviorEvidenceRef[];
  alternative_explanations: string[];
};

export type BenyuanTheaterSamplingGap = {
  signal: BenyuanPsycheSignalKey;
  reason: "missing" | "single_source" | "current_state_only" | "conflicted";
  priority: number;
};

export type BenyuanBehaviorSourceContext = {
  fixed_answer_count: number;
  music?: {
    analysis_status: string;
    evidence_quality: string;
    genres: string[];
    emotional_tone: string;
    public_genres: string[];
    public_moods: string[];
  };
  social?: {
    analysis_status: string;
    evidence_quality: string;
    post_count: number;
    dominant_emotion: string;
    themes: string[];
    expression_style: string[];
    expression_samples: string[];
  };
  photo?: {
    analysis_status: string;
    evidence_quality: string;
    visual_motif: string;
    composition: string;
    color_mood: string;
    symbolic_elements: string[];
    core_themes: string[];
  };
  theater?: {
    round_count: number;
    selected_actions: string[];
  };
};

export type BenyuanShadowArchetypeScore = {
  archetype: BenyuanShadowArchetypeKey;
  score: number;
};

export type BenyuanShadowArchetypeResult = {
  mode: "shadow_only";
  primary: BenyuanShadowArchetypeKey;
  secondary: BenyuanShadowArchetypeKey;
  margin: number;
  confidence: number;
  decisive_signals: BenyuanPsycheSignalKey[];
  conflicting_signals: BenyuanPsycheSignalKey[];
  scores: BenyuanShadowArchetypeScore[];
};

export type BenyuanBehaviorProfileV2 = {
  schema_version: typeof BENYUAN_BEHAVIOR_PROFILE_SCHEMA_VERSION;
  revision: string;
  source_revision: string;
  source_context: BenyuanBehaviorSourceContext;
  signals: BenyuanBehaviorProfileSignal[];
  dominant_tensions: string[];
  theater_sampling_gaps: BenyuanTheaterSamplingGap[];
  shadow_archetype: BenyuanShadowArchetypeResult;
};

const SHADOW_ARCHETYPE_WEIGHTS = {
  lone_seeker: {
    solitude_capacity: 1,
    meaning_orientation: 0.55,
    projection_symbolic_sensitivity: 0.35,
    object_distance: 0.25,
    action_entry: -0.2,
  },
  melancholic_poet: {
    repression_container: 0.85,
    repetition_loop: 0.8,
    projection_symbolic_sensitivity: 0.65,
    shadow_material: 0.4,
    time_gravity: 0.35,
  },
  existential_wanderer: {
    meaning_orientation: 1,
    desire_structure: 0.55,
    time_gravity: 0.5,
    action_entry: 0.2,
    transitional_space: 0.2,
  },
  rational_builder: {
    boundary_integrity: 0.55,
    action_entry: 0.5,
    meaning_orientation: 0.25,
    object_distance: 0.25,
    repetition_loop: -0.15,
  },
  gentle_guardian: {
    relationship_mirror_need: 1,
    object_distance: 0.35,
    transitional_space: 0.25,
    boundary_integrity: 0.2,
    solitude_capacity: -0.15,
  },
  black_hole_event_horizon: {
    shadow_material: 1,
    repression_container: 0.75,
    object_distance: 0.55,
    repetition_loop: 0.4,
    defense_style: 0.25,
  },
  nebula_weaver: {
    projection_symbolic_sensitivity: 1,
    transitional_space: 0.75,
    desire_structure: 0.4,
    meaning_orientation: 0.3,
    shadow_material: 0.15,
  },
  solar_corona: {
    action_entry: 1,
    desire_structure: 0.65,
    boundary_integrity: 0.2,
    solitude_capacity: -0.35,
    object_distance: -0.2,
  },
  terrestrial_planet: {
    boundary_integrity: 0.75,
    relationship_mirror_need: 0.5,
    action_entry: 0.4,
    transitional_space: 0.3,
    repression_container: -0.15,
  },
  deep_space_anchor: {
    boundary_integrity: 1,
    solitude_capacity: 0.7,
    object_distance: 0.6,
    repression_container: 0.2,
    relationship_mirror_need: -0.15,
  },
} satisfies Record<string, Partial<Record<BenyuanPsycheSignalKey, number>>>;

export type BenyuanShadowArchetypeKey = keyof typeof SHADOW_ARCHETYPE_WEIGHTS;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function compact(value: string, limit = 96) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function evidenceId(input: {
  source_kind: string;
  source_id: string;
  independence_group: string;
  polarity: string;
  evidence: string;
}) {
  return `evi_${stableHash([input.source_kind, input.source_id, input.independence_group, input.polarity, input.evidence].join("|"))}`;
}

function maxConfidenceByIndependentSource(records: Array<{ independence_group: string; confidence: number }>) {
  const groups = new Map<string, number>();
  for (const record of records) {
    groups.set(record.independence_group, Math.max(groups.get(record.independence_group) ?? 0, record.confidence));
  }
  return [...groups.values()];
}

function resolveSignalState(entry: ReturnType<typeof buildPsycheMetadataProfile>["selectedSignals"][number]): BenyuanBehaviorSignalState {
  if (entry.support_count > 0 && entry.counter_count > 0) return "conflicted";
  const supportRecords = entry.evidence_records.filter((record) => record.polarity === "support");
  const currentOnly = supportRecords.length > 0 && supportRecords.every((record) => record.temporal_scope === "current_state");
  if (currentOnly) return "current_state";
  if (entry.support_count >= 2 && entry.source_kind_count >= 2) return "stable";
  return "candidate";
}

function signalConfidence(entry: ReturnType<typeof buildPsycheMetadataProfile>["selectedSignals"][number], state: BenyuanBehaviorSignalState) {
  const support = maxConfidenceByIndependentSource(entry.evidence_records.filter((record) => record.polarity === "support"));
  const counter = maxConfidenceByIndependentSource(entry.evidence_records.filter((record) => record.polarity === "counter"));
  const supportMean = support.length > 0 ? support.reduce((sum, value) => sum + value, 0) / support.length : 0;
  const counterMean = counter.length > 0 ? counter.reduce((sum, value) => sum + value, 0) / counter.length : 0;
  const diversityBoost = Math.min(0.18, Math.max(0, entry.source_kind_count - 1) * 0.09);
  if (state === "conflicted") return clamp01(0.45 + Math.min(supportMean, counterMean) * 0.3 + diversityBoost);
  if (state === "current_state") return clamp01(supportMean * 0.72);
  if (state === "stable") return clamp01(supportMean * 0.82 + diversityBoost);
  return clamp01(supportMean * 0.72 + diversityBoost);
}

function evidenceRefs(entry: ReturnType<typeof buildPsycheMetadataProfile>["selectedSignals"][number], polarity: "support" | "counter") {
  const strongestByIndependentSource = new Map<string, (typeof entry.evidence_records)[number]>();
  for (const record of entry.evidence_records) {
    if (record.polarity !== polarity) continue;
    const current = strongestByIndependentSource.get(record.independence_group);
    if (!current || record.confidence > current.confidence) strongestByIndependentSource.set(record.independence_group, record);
  }
  const seen = new Set<string>();
  return [...strongestByIndependentSource.values()].flatMap((record) => {
    const id = evidenceId(record);
    if (seen.has(id)) return [];
    seen.add(id);
    return [{
      evidence_id: id,
      source_kind: record.source_kind,
      source_id: record.source_id,
      temporal_scope: record.temporal_scope,
      confidence: Number(record.confidence.toFixed(2)),
      preview: compact(record.evidence),
    }];
  });
}

function buildSourceContext(part1: Part1Record, part2?: Part2Record): BenyuanBehaviorSourceContext {
  const music = part1.part1_data.aesthetics.music_analysis;
  const socialPosts = part1.part1_data.narrative.social_posts_analysis ?? [];
  const socialOverall = part1.part1_data.narrative.social_posts_overall_pattern;
  const photo = part1.part1_data.narrative.precious_photo_analysis;
  const musicAnalyzed = music?.analysis_status === "analyzed";
  const socialAnalyzed = socialOverall?.analysis_status === "analyzed";
  const photoAnalyzed = photo?.analysis_status === "analyzed";
  return {
    fixed_answer_count: Object.keys(part1.answers).length,
    music: music ? {
      analysis_status: music.analysis_status ?? "unknown",
      evidence_quality: music.evidence_quality ?? "unknown",
      genres: musicAnalyzed ? music.primary_genres.slice(0, 6) : [],
      emotional_tone: musicAnalyzed ? compact(music.emotional_tone, 120) : "insufficient_evidence",
      public_genres: musicAnalyzed ? music.public_metadata?.genres?.slice(0, 6) ?? [] : [],
      public_moods: musicAnalyzed ? music.public_metadata?.mood_keywords?.slice(0, 6) ?? [] : [],
    } : undefined,
    social: socialPosts.length > 0 || socialOverall ? {
      analysis_status: socialOverall?.analysis_status ?? "unknown",
      evidence_quality: socialOverall?.evidence_quality ?? "unknown",
      post_count: socialPosts.length,
      dominant_emotion: socialAnalyzed ? compact(socialOverall?.dominant_emotion ?? "unknown", 80) : "insufficient_evidence",
      themes: socialAnalyzed ? [...new Set([...(socialOverall?.core_themes ?? []), ...socialPosts.flatMap((post) => post.themes)])].slice(0, 8) : [],
      expression_style: socialAnalyzed ? [...new Set(socialPosts.map((post) => post.expression_style).filter(Boolean))].slice(0, 5) : [],
      expression_samples: socialAnalyzed ? socialPosts.map((post) => compact(post.text_content, 100)).filter(Boolean).slice(0, 2) : [],
    } : undefined,
    photo: photo ? {
      analysis_status: photo.analysis_status ?? "unknown",
      evidence_quality: photo.evidence_quality ?? "unknown",
      visual_motif: photoAnalyzed ? compact(photo.visual_content, 120) : "insufficient_evidence",
      composition: photoAnalyzed ? compact(photo.composition, 100) : "insufficient_evidence",
      color_mood: photoAnalyzed ? compact(photo.color_mood, 60) : "insufficient_evidence",
      symbolic_elements: photoAnalyzed ? photo.symbolic_elements.slice(0, 6) : [],
      core_themes: photoAnalyzed ? photo.psychological_interpretation.core_themes.slice(0, 6) : [],
    } : undefined,
    theater: part2 ? {
      round_count: part2.act2_choices.length,
      selected_actions: part2.act2_choices.map((choice) => compact(choice.option_text ?? choice.selected, 80)).slice(0, 4),
    } : undefined,
  };
}

function buildSamplingGaps(signals: BenyuanBehaviorProfileSignal[]) {
  const byKey = new Map(signals.map((signal) => [signal.key, signal]));
  const preferredOrder: BenyuanPsycheSignalKey[] = [
    "action_entry",
    "object_distance",
    "relationship_mirror_need",
    "desire_structure",
    "boundary_integrity",
    "defense_style",
    "time_gravity",
    "meaning_orientation",
  ];
  return preferredOrder.map((key, index): BenyuanTheaterSamplingGap | null => {
    const signal = byKey.get(key);
    if (!signal) return { signal: key, reason: "missing", priority: 100 - index };
    if (signal.state === "conflicted") return { signal: key, reason: "conflicted", priority: 95 - index };
    if (signal.state === "current_state") return { signal: key, reason: "current_state_only", priority: 85 - index };
    if (signal.source_diversity < 2) return { signal: key, reason: "single_source", priority: 75 - index };
    return null;
  }).filter((item): item is BenyuanTheaterSamplingGap => Boolean(item)).sort((left, right) => right.priority - left.priority);
}

function signedSignalStrength(signal: BenyuanBehaviorProfileSignal) {
  const support = signal.support_evidence.length;
  const counter = signal.counter_evidence.length;
  if (support === 0 && counter === 0) return 0;
  return ((support - counter) / Math.max(1, support + counter)) * signal.confidence;
}

export function scoreShadowArchetypes(signals: BenyuanBehaviorProfileSignal[]): BenyuanShadowArchetypeResult {
  const byKey = new Map(signals.map((signal) => [signal.key, signal]));
  const ranked = (Object.entries(SHADOW_ARCHETYPE_WEIGHTS) as Array<[BenyuanShadowArchetypeKey, Partial<Record<BenyuanPsycheSignalKey, number>>]>).map(
    ([archetype, weights]) => {
      const score = Object.entries(weights).reduce((sum, [key, weight]) => {
        const signal = byKey.get(key as BenyuanPsycheSignalKey);
        return sum + (signal ? signedSignalStrength(signal) * (weight ?? 0) : 0);
      }, 0);
      return { archetype, score: Number(score.toFixed(4)) };
    },
  ).sort((left, right) => right.score - left.score || left.archetype.localeCompare(right.archetype));
  const primary = ranked[0] ?? { archetype: "lone_seeker" as const, score: 0 };
  const secondary = ranked[1] ?? primary;
  const margin = Math.max(0, primary.score - secondary.score);
  const evidenceCoverage = Math.min(1, signals.filter((signal) => signal.state === "stable" || signal.state === "conflicted").length / 5);
  const confidence = clamp01(0.25 + Math.min(0.4, Math.max(0, primary.score) / 4) + Math.min(0.25, margin / 2) + evidenceCoverage * 0.1);
  const decisiveSignals = Object.entries(SHADOW_ARCHETYPE_WEIGHTS[primary.archetype])
    .filter(([key, weight]) => {
      const signal = byKey.get(key as BenyuanPsycheSignalKey);
      return (weight ?? 0) > 0 && Boolean(signal && signedSignalStrength(signal) > 0);
    })
    .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))
    .slice(0, 4)
    .map(([key]) => key as BenyuanPsycheSignalKey);
  return {
    mode: "shadow_only",
    primary: primary.archetype,
    secondary: secondary.archetype,
    margin: Number(margin.toFixed(4)),
    confidence: Number(confidence.toFixed(2)),
    decisive_signals: decisiveSignals,
    conflicting_signals: signals.filter((signal) => signal.state === "conflicted").map((signal) => signal.key),
    scores: ranked,
  };
}

export function buildBehaviorProfileV2(part1: Part1Record, part2?: Part2Record): BenyuanBehaviorProfileV2 {
  const metadata = buildPsycheMetadataProfile(part1, part2);
  const signals = metadata.selectedSignals.map((entry): BenyuanBehaviorProfileSignal => {
    const state = resolveSignalState(entry);
    const supportEvidence = evidenceRefs(entry, "support");
    const counterEvidence = evidenceRefs(entry, "counter");
    return {
      key: entry.key,
      name: entry.zhName,
      state,
      confidence: Number(signalConfidence(entry, state).toFixed(2)),
      source_diversity: entry.source_kind_count,
      support_evidence_ids: supportEvidence.map((item) => item.evidence_id),
      counter_evidence_ids: counterEvidence.map((item) => item.evidence_id),
      support_evidence: supportEvidence,
      counter_evidence: counterEvidence,
      alternative_explanations: [...new Set(entry.evidence_records.map((record) => record.alternative_explanation).filter((item): item is string => Boolean(item)))].slice(0, 4),
    };
  });
  const sourceRevision = [part1.part1_id, part1.updated_at, part2?.part2_id ?? "no-part2", part2?.created_at ?? "no-part2-time"].join(":");
  const revisionPayload = signals.map((signal) => ({
    key: signal.key,
    state: signal.state,
    confidence: signal.confidence,
    support: signal.support_evidence_ids,
    counter: signal.counter_evidence_ids,
  }));
  const sourceContext = buildSourceContext(part1, part2);
  return {
    schema_version: BENYUAN_BEHAVIOR_PROFILE_SCHEMA_VERSION,
    revision: `bp2_${stableHash(JSON.stringify({ sourceRevision, sourceContext, revisionPayload }))}`,
    source_revision: sourceRevision,
    source_context: sourceContext,
    signals,
    dominant_tensions: metadata.dominantTensions,
    theater_sampling_gaps: buildSamplingGaps(signals),
    shadow_archetype: scoreShadowArchetypes(signals),
  };
}

export function formatBehaviorProfileV2Dossier(profile: BenyuanBehaviorProfileV2, options: { maxSignals?: number; evidencePerPolarity?: number } = {}) {
  const maxSignals = options.maxSignals ?? 9;
  const evidencePerPolarity = options.evidencePerPolarity ?? 2;
  const signalLines = profile.signals.slice(0, maxSignals).map((signal) => {
    const support = signal.support_evidence.slice(0, evidencePerPolarity).map((item) => `${item.evidence_id}:${item.source_kind}/${item.source_id}:${item.preview}`).join("；") || "无";
    const counter = signal.counter_evidence.slice(0, evidencePerPolarity).map((item) => `${item.evidence_id}:${item.source_kind}/${item.source_id}:${item.preview}`).join("；") || "无";
    const alternative = signal.alternative_explanations.length > 0 ? `；备选解释 ${signal.alternative_explanations.join(" / ")}` : "";
    return `- ${signal.key}/${signal.name}：${signal.state}，置信 ${signal.confidence.toFixed(2)}，来源类型 ${signal.source_diversity}；支持 ${support}；反证 ${counter}${alternative}`;
  });
  const gapLines = profile.theater_sampling_gaps.slice(0, 6).map((gap) => `${gap.signal}:${gap.reason}`);
  const music = profile.source_context.music;
  const social = profile.source_context.social;
  const photo = profile.source_context.photo;
  const theater = profile.source_context.theater;
  return `行为档案 ${profile.schema_version}（内部结构化承接；revision ${profile.revision}）
状态语义：current_state 只描述当下；candidate 仍待交叉验证；stable 才可写较稳定倾向；conflicted 必须写成张力，不得强行归类。
受控来源上下文（只用于叙事转译和证据核验，不得逐项搬进可见文案）：
- 音乐：${music ? `${music.analysis_status}/${music.evidence_quality}；${music.genres.join(" / ") || "unknown"}；${music.emotional_tone}；公开风格 ${music.public_genres.join(" / ") || "none"}；公开情绪 ${music.public_moods.join(" / ") || "none"}` : "未提供"}
- 社交：${social ? `${social.analysis_status}/${social.evidence_quality}；${social.dominant_emotion}；${social.themes.join(" / ") || "unknown"}；表达 ${social.expression_style.join(" / ") || "unknown"}；样本 ${social.expression_samples.join(" | ") || "none"}` : "未提供"}
- 照片：${photo ? `${photo.analysis_status}/${photo.evidence_quality}；${photo.visual_motif}；${photo.composition}；${photo.color_mood}；${photo.symbolic_elements.join(" / ") || "unknown"}；${photo.core_themes.join(" / ") || "unknown"}` : "未提供"}
- 剧场：${theater ? `${theater.round_count} 轮；${theater.selected_actions.join(" / ") || "无可读动作"}` : "尚未开始"}
${signalLines.join("\n") || "- 暂无足够行为证据"}
核心张力：${profile.dominant_tensions.slice(0, 3).join(" / ") || "待剧场验证"}
剧场补采样：${gapLines.join(" / ") || "按行动、关系、欲望、边界与时间感交叉验证"}
影子评分只用于离线校准，不得出现在用户文案，不得覆盖正式十类主星体。`;
}
