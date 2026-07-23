import { benyuanQuestionsById, getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { legacyIsolationPromptBlock } from "@/lib/benyuan-v3-legacy-isolation";
import { getPart2ChoiceText } from "@/lib/benyuan-v3-theater-labels";
import { parseTraitSignalComponents } from "@/lib/benyuan-v3-trait-signals";
import type { BenyuanPsycheSignalKey as PsycheSignalKey } from "@/lib/benyuan-v3-trait-signals";
import type { MultimodalBehaviorSignal, Part1Record, Part2Record } from "@/lib/benyuan-v3-types";

type EvidenceSourceKind = "question" | "music" | "social_post" | "photo" | "theater";
type EvidencePolarity = "support" | "counter";

type EvidenceRecord = {
  evidence: string;
  source_kind: EvidenceSourceKind;
  source_id: string;
  temporal_scope: string;
  polarity: EvidencePolarity;
  confidence: number;
  independence_group: string;
  alternative_explanation?: string;
};

type EvidenceMetadata = Omit<EvidenceRecord, "evidence">;
type EvidenceMap = Map<PsycheSignalKey, EvidenceRecord[]>;

type SignalEntry = {
  key: PsycheSignalKey;
  zhName: string;
  description: string;
  evidence: string[];
  evidence_records: EvidenceRecord[];
  independent_source_count: number;
  source_kind_count: number;
  support_count: number;
  counter_count: number;
  temporal_scope: string[];
};

type SignalDefinition = Pick<SignalEntry, "zhName" | "description">;

const SIGNAL_DEFINITIONS: Record<PsycheSignalKey, SignalDefinition> = {
  meaning_orientation: {
    zhName: "意义取向",
    description: "用户会先追问一件事是否真的有内在理由，而不是只看它是否有效或好看。",
  },
  object_distance: {
    zhName: "客体距离",
    description: "用户在靠近关系、作品或愿望时，会调节距离，避免过快暴露或被对方解释。",
  },
  boundary_integrity: {
    zhName: "边界完整度",
    description: "用户需要保留自我位置、节奏和精神领地，让靠近变得可持续。",
  },
  desire_structure: {
    zhName: "欲望结构",
    description: "用户真正被什么吸引，以及他如何压住、试探、安放或点燃这种想要。",
  },
  defense_style: {
    zhName: "防御方式",
    description: "用户面对不确定、失控或过度刺激时，会先采取哪种保护连续性的动作。",
  },
  projection_symbolic_sensitivity: {
    zhName: "投射与象征感受力",
    description: "用户会把难以直说的经验投射到图像、声音、句子、作品和空间里再读回自己。",
  },
  repression_container: {
    zhName: "压抑与容器",
    description: "用户会把暂时难以承受的情绪或表达放到更深处，等待更安全的容器。",
  },
  relationship_mirror_need: {
    zhName: "关系镜像需求",
    description: "用户需要被看见、被听懂、被稳定回应，但不一定愿意把需要说得很直接。",
  },
  shadow_material: {
    zhName: "阴影材料",
    description: "用户绕开、迟疑或尚未承认的部分，可能正保存着仍未整合的生命力。",
  },
  repetition_loop: {
    zhName: "重复回路",
    description: "用户反复回到相似画面、关系姿态或选择方式里，试图给未完成的东西找新结局。",
  },
  solitude_capacity: {
    zhName: "孤独能力",
    description: "用户在低噪音、独处或远景里恢复自我连续性，而不是单纯远离世界。",
  },
  action_entry: {
    zhName: "行动入口",
    description: "用户把理解转成行动时，通常需要先找到足够小、足够真实的一步。",
  },
  time_gravity: {
    zhName: "时间重力",
    description: "用户的过去、现在和未来如何分配注意力，以及哪一层最容易牵动他。",
  },
  transitional_space: {
    zhName: "过渡空间",
    description: "作品、音乐、照片、文字或剧场成为内在经验与现实之间的安全中介。",
  },
};

const SIGNAL_PATTERNS: Array<{ key: PsycheSignalKey; pattern: RegExp }> = [
  { key: "meaning_orientation", pattern: /meaning|意义|philosophical|existential|方向|追问|quest/u },
  { key: "object_distance", pattern: /object_distance|distance|slow_disclosure|靠近|距离|房间|保留/u },
  { key: "boundary_integrity", pattern: /boundary|strong_boundary|engulf|self_preserv|self_protect|边界|门|窗|岸|不会太快/u },
  { key: "desire_structure", pattern: /desire|want|attraction|risk_taking|想要|欲望|靠近/u },
  { key: "defense_style", pattern: /defense|observe|delay|avoid(?:ant|ance)?|withdraw|systematic|repressive|先|观察|压|放到一边/u },
  { key: "projection_symbolic_sensitivity", pattern: /projection|aesthetic|visual|symbol|resonance|画面|句子|作品|光|构图/u },
  { key: "repression_container", pattern: /repression|repressive|withheld|unsaid|implicit|没说出口|压抑|平静|容器/u },
  { key: "relationship_mirror_need", pattern: /mirror|relationship|attachment|reply|response|understood|回应|语气|被看见|可信的人/u },
  { key: "shadow_material", pattern: /shadow|dark|low light|empty|暗|低光|空|绕开|还没上场/u },
  { key: "repetition_loop", pattern: /repetition|cycle|return|again|反复|旧|过去|回望|回来/u },
  { key: "solitude_capacity", pattern: /solitude|introversion|alone|独处|一个人|低噪音|远处/u },
  { key: "action_entry", pattern: /action|movement|risk|step|小险|行动|前行|试一小步/u },
  { key: "time_gravity", pattern: /time|past|present|future|时间|过去|未来|现在/u },
  { key: "transitional_space", pattern: /transitional|art_space|music|photo|theater|作品|照片|歌|音乐|剧场|写/u },
];

const MULTIMODAL_SIGNAL_KEYS = [
  "desire_structure",
  "defense_style",
  "projection_symbolic_sensitivity",
  "object_distance",
  "boundary_integrity",
  "meaning_orientation",
  "relationship_mirror_need",
  "repression_container",
  "repetition_loop",
  "solitude_capacity",
  "transitional_space",
];

function compact(value: unknown, maxLength = 90) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function evidenceConfidence(quality: unknown, fallback = 0.72) {
  if (quality === "high") return 0.9;
  if (quality === "medium") return 0.72;
  if (quality === "low") return 0.5;
  if (quality === "none") return 0.2;
  return fallback;
}

function addEvidence(map: EvidenceMap, key: PsycheSignalKey, evidence: string, metadata: EvidenceMetadata) {
  const text = compact(evidence);
  if (!text) return;
  const bucket = map.get(key) ?? [];
  const duplicate = bucket.find(
    (record) =>
      record.evidence === text &&
      record.source_id === metadata.source_id &&
      record.polarity === metadata.polarity &&
      record.independence_group === metadata.independence_group,
  );
  if (duplicate) {
    duplicate.confidence = Math.max(duplicate.confidence, metadata.confidence);
    return;
  }
  bucket.push({ evidence: text, ...metadata });
  map.set(key, bucket);
}

function addSignalsFromText(map: EvidenceMap, source: string, evidence: string, metadata: EvidenceMetadata) {
  let matchedCount = 0;
  for (const item of SIGNAL_PATTERNS) {
    if (item.pattern.test(source)) {
      addEvidence(map, item.key, evidence, metadata);
      matchedCount += 1;
    }
  }
  return matchedCount;
}

function addStructuredBehaviorSignals(
  map: EvidenceMap,
  signals: MultimodalBehaviorSignal[] | undefined,
  evidencePrefix: string,
  metadata: EvidenceMetadata,
) {
  if (!signals?.length) return false;
  let addedCount = 0;
  for (const signal of signals) {
    const evidence = signal.evidence.map((item) => compact(item, 80)).filter(Boolean).join("；");
    if (!evidence) continue;
    addEvidence(map, signal.signal, `${evidencePrefix}：${evidence}`, {
      ...metadata,
      polarity: signal.polarity,
      confidence: Math.min(metadata.confidence, signal.confidence),
      temporal_scope: signal.temporal_scope === "unknown" ? metadata.temporal_scope : signal.temporal_scope,
      alternative_explanation: compact(signal.alternative_explanation, 100) || undefined,
    });
    addedCount += 1;
  }
  return addedCount > 0;
}

function optionEvidence(part1: Part1Record) {
  const rows: string[] = [];
  const map: EvidenceMap = new Map();

  for (const [questionId, rawValue] of Object.entries(part1.answers)) {
    const question = benyuanQuestionsById[questionId];
    if (!question) continue;
    const independenceGroup = `${part1.part1_id}:question:${questionId}`;
    if (question.kind === "distribution" && rawValue && typeof rawValue === "object") {
      const time = rawValue as Record<string, unknown>;
      const evidence = `${question.title}：过去 ${compact(time.past)} / 现在 ${compact(time.present)} / 未来 ${compact(time.future)}`;
      rows.push(evidence);
      addEvidence(map, "time_gravity", evidence, {
        source_kind: "question",
        source_id: `${independenceGroup}:distribution`,
        temporal_scope: "current_self_report",
        polarity: "support",
        confidence: 0.95,
        independence_group: independenceGroup,
      });
      continue;
    }

    const optionIds = Array.isArray(rawValue) ? rawValue : typeof rawValue === "string" ? [rawValue] : [];
    for (const optionId of optionIds) {
      if (typeof optionId !== "string") continue;
      const option = getQuestionOption(questionId, optionId);
      if (!option) continue;
      const signalPayload = [option.psychologicalSignal, ...getQuestionOptionTags(questionId, optionId)].filter(Boolean).join(" ");
      const evidence = `${question.title}：${option.text}`;
      rows.push(evidence);
      addSignalsFromText(map, signalPayload + " " + option.text, evidence, {
        source_kind: "question",
        source_id: `${independenceGroup}:option:${optionId}`,
        temporal_scope: "current_self_report",
        polarity: "support",
        confidence: 0.9,
        independence_group: independenceGroup,
      });
    }
  }

  return { rows, map };
}

function hasAnalyzedEvidence<T extends { analysis_status?: unknown }>(
  value: T | null | undefined,
): value is T & { analysis_status: "analyzed" } {
  return value?.analysis_status === "analyzed";
}

function analysisEvidenceQuality(value: unknown) {
  return value && typeof value === "object" ? (value as { evidence_quality?: unknown }).evidence_quality : undefined;
}

function addMultimodalEvidence(map: EvidenceMap, part1: Part1Record) {
  const music = part1.part1_data.aesthetics.music_analysis;
  if (hasAnalyzedEvidence(music)) {
    const musicSourceId = `${part1.part1_id}:music_playlist`;
    const musicMetadata: EvidenceMetadata = {
      source_kind: "music",
      source_id: musicSourceId,
      temporal_scope: "long_term_preference",
      polarity: "support",
      confidence: evidenceConfidence(analysisEvidenceQuality(music)),
      independence_group: musicSourceId,
    };
    const musicPayload = [
      music.primary_genres.join(" "),
      music.emotional_tone,
      music.language_diversity.join(" "),
      Object.entries(music.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join(" "),
    ].join(" ");
    const hasStructuredSignals = addStructuredBehaviorSignals(map, music.behavioral_signals, "音乐/歌单行为线索", musicMetadata);
    if (!hasStructuredSignals) {
      addSignalsFromText(
        map,
        musicPayload,
        `音乐/歌单解析：声音气候 ${compact(music.emotional_tone)}，信号 ${compact(Object.entries(music.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join(" / "), 120)}`,
        musicMetadata,
      );
      addEvidence(map, "transitional_space", "音乐作为情绪容器和过渡空间参与后续剧场", musicMetadata);
    }
  }

  const socialOverall = part1.part1_data.narrative.social_posts_overall_pattern;
  const socialAnalyzed = hasAnalyzedEvidence(socialOverall);
  const socialGroup = `${part1.part1_id}:social_posts`;
  const socialConfidence = evidenceConfidence(analysisEvidenceQuality(socialOverall), 0.68);
  const posts = part1.part1_data.narrative.social_posts_analysis ?? [];
  for (const post of socialAnalyzed ? posts.slice(0, 3) : []) {
    const postPayload = [
      post.text_content,
      post.emotional_tone,
      post.themes.join(" "),
      post.expression_style,
      post.self_presentation,
      post.psychological_signals.join(" "),
    ].join(" ");
    const postMetadata: EvidenceMetadata = {
      source_kind: "social_post",
      source_id: `${socialGroup}:post:${post.post_id}`,
      temporal_scope: "historical_or_current_expression",
      polarity: "support",
      confidence: socialConfidence,
      independence_group: socialGroup,
    };
    const hasStructuredSignals = addStructuredBehaviorSignals(
      map,
      post.behavioral_signals,
      `社交动态 ${post.post_id} 行为线索`,
      postMetadata,
    );
    if (!hasStructuredSignals) {
      addSignalsFromText(
        map,
        postPayload,
        `社交文字解析：${compact(post.expression_style)} / ${compact(post.emotional_tone)} / ${compact(post.psychological_signals.join("、"), 120)}`,
        postMetadata,
      );
    }
  }

  if (socialOverall && socialAnalyzed) {
    const overallMetadata: EvidenceMetadata = {
      source_kind: "social_post",
      source_id: `${socialGroup}:overall`,
      temporal_scope: "historical_or_current_expression",
      polarity: "support",
      confidence: socialConfidence,
      independence_group: socialGroup,
    };
    const hasStructuredSignals = addStructuredBehaviorSignals(
      map,
      socialOverall.behavioral_signals,
      "社交总体行为线索",
      overallMetadata,
    );
    if (!hasStructuredSignals) {
      addSignalsFromText(
        map,
        [socialOverall.dominant_emotion, socialOverall.core_themes.join(" "), socialOverall.expression_authenticity].join(" "),
        `社交总体姿态：${compact(socialOverall.dominant_emotion)} / ${compact(socialOverall.core_themes.join("、"))}`,
        overallMetadata,
      );
    }
  }

  const photo = part1.part1_data.narrative.precious_photo_analysis;
  if (hasAnalyzedEvidence(photo)) {
    const photoSourceId = `${part1.part1_id}:precious_photo`;
    const photoMetadata: EvidenceMetadata = {
      source_kind: "photo",
      source_id: photoSourceId,
      temporal_scope: "remembered_or_symbolic_material",
      polarity: "support",
      confidence: evidenceConfidence(analysisEvidenceQuality(photo)),
      independence_group: photoSourceId,
    };
    const photoPayload = [
      photo.visual_content,
      photo.composition,
      photo.lighting,
      photo.color_mood,
      photo.symbolic_elements.join(" "),
      photo.psychological_interpretation.core_themes.join(" "),
      photo.psychological_interpretation.self_concept,
      photo.psychological_interpretation.existential_stance,
      photo.psychological_interpretation.traits.join(" "),
    ].join(" ");
    const hasStructuredSignals = addStructuredBehaviorSignals(map, photo.behavioral_signals, "照片/珍视物行为线索", photoMetadata);
    if (!hasStructuredSignals) {
      addSignalsFromText(
        map,
        photoPayload,
        `照片/珍视物解析：${compact(photo.composition)} / ${compact(photo.lighting)} / ${compact(photo.psychological_interpretation.core_themes.join("、"), 120)}`,
        photoMetadata,
      );
      addEvidence(map, "projection_symbolic_sensitivity", "珍视照片被视作自我投射、关系位置和时间感的显影入口", photoMetadata);
    }
  }
}

function addTheaterEvidence(map: EvidenceMap, part2?: Part2Record) {
  if (!part2) return;
  for (const item of part2.act2_choices) {
    const choice = item as typeof item & { option_text?: string; trait_signal?: string };
    const text = getPart2ChoiceText(choice);
    const traitSignal = compact(choice.trait_signal, 160);
    const sourceId = `${part2.part2_id}:act2_choice:${item.choice_id}`;
    const evidence = `剧场第 ${item.choice_id} 轮选择：${text}`;
    const components = parseTraitSignalComponents(traitSignal);
    let matchedCount = 0;
    for (const component of components) {
      matchedCount += addSignalsFromText(map, component.semantic, evidence, {
        source_kind: "theater",
        source_id: sourceId,
        temporal_scope: "current_theater_session",
        polarity: component.polarity,
        confidence: 0.9,
        independence_group: sourceId,
      });
    }
    if (matchedCount === 0) {
      addSignalsFromText(map, text, evidence, {
        source_kind: "theater",
        source_id: sourceId,
        temporal_scope: "current_theater_session",
        polarity: "support",
        confidence: 0.72,
        independence_group: sourceId,
      });
    }
  }
}

function distinctCount(records: EvidenceRecord[], select: (record: EvidenceRecord) => string) {
  return new Set(records.map(select)).size;
}

function independentPolarityCount(records: EvidenceRecord[], polarity: EvidencePolarity) {
  return new Set(records.filter((record) => record.polarity === polarity).map((record) => record.independence_group)).size;
}

function buildEntries(map: EvidenceMap): SignalEntry[] {
  return [...map.entries()]
    .map(([key, records]) => {
      const evidence = [...new Set(records.map((record) => record.evidence))].slice(0, 4);
      return {
        key,
        ...SIGNAL_DEFINITIONS[key],
        evidence,
        evidence_records: records,
        independent_source_count: distinctCount(records, (record) => record.independence_group),
        source_kind_count: distinctCount(records, (record) => record.source_kind),
        support_count: independentPolarityCount(records, "support"),
        counter_count: independentPolarityCount(records, "counter"),
        temporal_scope: [...new Set(records.map((record) => record.temporal_scope))],
      };
    })
    .sort((left, right) => {
      const leftNetSupport = left.support_count - left.counter_count;
      const rightNetSupport = right.support_count - right.counter_count;
      return (
        rightNetSupport - leftNetSupport ||
        right.support_count - left.support_count ||
        right.independent_source_count - left.independent_source_count ||
        left.counter_count - right.counter_count ||
        left.key.localeCompare(right.key)
      );
    });
}

function strengthLabel(entry: SignalEntry) {
  const netSupport = entry.support_count - entry.counter_count;
  if (entry.independent_source_count >= 3 && entry.support_count >= 3 && netSupport >= 2) return "strong_signal";
  if (entry.independent_source_count >= 2 && entry.support_count >= 2 && netSupport >= 1) return "medium_signal";
  return "weak_signal";
}

function dominantTensions(entries: SignalEntry[]) {
  const keys = new Set(
    entries
      .filter((item) => item.support_count > item.counter_count)
      .slice(0, 8)
      .map((item) => item.key),
  );
  const tensions: string[] = [];
  if (keys.has("object_distance") && keys.has("relationship_mirror_need")) {
    tensions.push("想被真正听见，但需要先确认靠近不会压缩自我边界");
  }
  if (keys.has("meaning_orientation") && keys.has("action_entry")) {
    tensions.push("强意义过滤与现实行动之间存在节奏差：方向要先显形，行动才会稳定");
  }
  if (keys.has("projection_symbolic_sensitivity") && keys.has("repression_container")) {
    tensions.push("用户习惯让图像、声音和作品先替自己保存难以直接说出的情绪");
  }
  if (keys.has("desire_structure") && keys.has("boundary_integrity")) {
    tensions.push("欲望不是没有出现，而是需要被放进一个不破坏生活边界的小位置");
  }
  return tensions.slice(0, 4);
}

function theaterSupplementTargets(entries: SignalEntry[]) {
  const entryByKey = new Map(entries.map((item) => [item.key, item]));
  const desiredOrder: PsycheSignalKey[] = [
    "desire_structure",
    "object_distance",
    "boundary_integrity",
    "relationship_mirror_need",
    "defense_style",
    "action_entry",
    "time_gravity",
    "shadow_material",
    "repetition_loop",
    "meaning_orientation",
  ];
  const candidates = desiredOrder
    .map((key, order) => {
      const entry = entryByKey.get(key);
      const priority = entry?.counter_count ? 0 : !entry || strengthLabel(entry) === "weak_signal" ? 1 : strengthLabel(entry) === "medium_signal" ? 2 : 3;
      return { key, order, entry, priority };
    })
    .sort((left, right) => left.priority - right.priority || left.order - right.order);
  const needsSampling = candidates.filter((candidate) => candidate.priority <= 1);
  const selected = (needsSampling.length > 0 ? needsSampling : candidates.filter((candidate) => candidate.entry)).slice(0, 4);
  const roleByKey: Partial<Record<PsycheSignalKey, string>> = {
    action_entry: "行动入口",
    object_distance: "关系距离",
    relationship_mirror_need: "关系距离",
    desire_structure: "欲望与边界",
    boundary_integrity: "欲望与边界",
    time_gravity: "动机与时间感",
    defense_style: "潜在防御",
  };

  return selected.map(({ key, entry }) => {
    const definition = SIGNAL_DEFINITIONS[key];
    const role = roleByKey[key] ?? "补采样";
    let reason = "尚无独立来源支持";
    if (entry?.support_count && entry.counter_count) {
      reason = `已有支持与反证（支持 ${entry.support_count} / 反证 ${entry.counter_count}）`;
    } else if (entry?.counter_count) {
      reason = `目前只有反证（反证 ${entry.counter_count}）`;
    } else if (entry) {
      reason = `目前只有 ${entry.independent_source_count} 个独立来源支持`;
    }
    return `${role}：${key} / ${definition.zhName}。前 13 题与多模态尚未采足或存在冲突：${reason}，需要在小说选择里用具体行动补充或交叉验证。`;
  });
}

function narrativeInstruction(entries: SignalEntry[]) {
  const top = entries
    .filter((item) => item.support_count > item.counter_count)
    .slice(0, 5)
    .map((item) => `${item.key}/${item.zhName}`)
    .join("、") || "meaning_orientation/意义取向";
  return [
    "剧场生成指令：小说情节必须从精神元数据生长，而不是从原始素材清单生长。",
    `优先围绕这些核心信号建立短篇小说处境：${top}。`,
    "剧场四轮的核心任务不是重复 13 题，而是补足前 13 题和多模态之后仍不够清楚的精神向量。",
    "开场长文要把这些信号转成一个可进入的处境：空间、动作、关系距离、声音气候、核心物件和未完成问题。",
    "四轮选择分别采样行动入口、关系距离、欲望与边界、动机/时间感/潜在防御。",
    "若某个信号已有反证或只有单一独立来源，剧场应优先交叉验证，不得把派生描述的数量当作确定性。",
    "不要把 13 题答案、歌单、社交文字或照片描述逐项搬进可见文本；只能把它们转译为物件、声音、天气、距离、路、窗、门、岸线或天体现象。",
    "旧版 Act3 / 镜面追问只作为历史兼容字段，不参与新版剧场生成，也不能作为精神信号证据。",
  ].join("\n");
}

export function buildPsycheMetadataProfile(part1: Part1Record, part2?: Part2Record) {
  const option = optionEvidence(part1);
  const map = option.map;
  addMultimodalEvidence(map, part1);
  addTheaterEvidence(map, part2);
  const entries = buildEntries(map);

  return {
    privacyBoundary: "13 题是第一层精神向量采集；音乐/歌单允许用公开作品元数据做联网补全；社交动态与私人照片不进行公网搜索，只基于用户上传可见内容做保守分析。",
    legacyIsolation: legacyIsolationPromptBlock(),
    note: "所有剧场与星图内容必须先从标准精神信号出发，再回到证据核验；不能把题目答案、歌单截图、社交文字或照片描述当作可见文案素材库。",
    selectedSignals: entries,
    rawAnswerCount: option.rows.length,
    dominantTensions: dominantTensions(entries),
    theaterSupplementTargets: theaterSupplementTargets(entries),
    multimodalSignalVocabulary: MULTIMODAL_SIGNAL_KEYS,
    narrativeInstruction: narrativeInstruction(entries),
  };
}

export function buildPsycheMetadataDossier(part1: Part1Record, part2?: Part2Record) {
  const profile = buildPsycheMetadataProfile(part1, part2);
  const entries = profile.selectedSignals.slice(0, 9);
  const signalLines = entries.map((item) => {
    const evidence = item.evidence_records
      .slice(0, 6)
      .map(
        (record) =>
          `    · [${record.polarity === "counter" ? "反证" : "支持"}；${record.source_kind}/${record.source_id}；独立组 ${record.independence_group}；置信 ${record.confidence.toFixed(2)}] ${record.evidence}${record.alternative_explanation ? `；备选解释：${record.alternative_explanation}` : ""}`,
      )
      .join("\n");
    const counts = `独立来源 ${item.independent_source_count}；来源类型 ${item.source_kind_count}；支持 ${item.support_count}；反证 ${item.counter_count}；时间范围 ${item.temporal_scope.join(" / ")}`;
    return `- ${item.key} / ${item.zhName} / ${strengthLabel(item)}：${item.description}（${counts}）\n${evidence}`;
  });
  const tensionLines = profile.dominantTensions.map((item) => `- ${item}`);
  const supplementLines = profile.theaterSupplementTargets.map((item) => `- ${item}`);

  return `精神元数据剖面（内部使用）
- 隐私与数据边界：${profile.privacyBoundary}
- ${profile.legacyIsolation}
- 13 题是第一层精神向量采集，不是剧场可见文本素材。
- ${profile.note}
- 标准化精神信号词表：${profile.multimodalSignalVocabulary.join(" / ")}
- 标准精神信号：
${signalLines.join("\n")}

核心张力候选：
${tensionLines.length > 0 ? tensionLines.join("\n") : "- 暂无明确冲突信号；以最高强度信号建立连续处境。"}

剧场补采样目标：
${supplementLines.length > 0 ? supplementLines.join("\n") : "- 前 13 题与多模态已经有足够信号；剧场四轮用于交叉验证行动、关系、欲望与时间感。"}

${profile.narrativeInstruction}

原始证据只用于核验，不允许直接拼贴成用户可见文案。`;
}
