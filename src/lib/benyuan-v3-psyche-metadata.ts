import { benyuanQuestionsById, getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { legacyIsolationPromptBlock } from "@/lib/benyuan-v3-legacy-isolation";
import { getTheaterAct2ChoiceText } from "@/lib/benyuan-v3-theater-labels";
import type { Part1Record, Part2Record } from "@/lib/benyuan-v3-types";

type PsycheSignalKey =
  | "meaning_orientation"
  | "object_distance"
  | "boundary_integrity"
  | "desire_structure"
  | "defense_style"
  | "projection_symbolic_sensitivity"
  | "repression_container"
  | "relationship_mirror_need"
  | "shadow_material"
  | "repetition_loop"
  | "solitude_capacity"
  | "action_entry"
  | "time_gravity"
  | "transitional_space";

type SignalEntry = {
  key: PsycheSignalKey;
  zhName: string;
  description: string;
  evidence: string[];
};

const SIGNAL_DEFINITIONS: Record<PsycheSignalKey, Omit<SignalEntry, "key" | "evidence">> = {
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
  { key: "boundary_integrity", pattern: /boundary|strong_boundary|engulf|边界|门|窗|岸|不会太快/u },
  { key: "desire_structure", pattern: /desire|want|attraction|risk_taking|想要|欲望|靠近/u },
  { key: "defense_style", pattern: /defense|observe|delay|avoidant|systematic|repressive|先|观察|压|放到一边/u },
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

function addEvidence(map: Map<PsycheSignalKey, Set<string>>, key: PsycheSignalKey, evidence: string) {
  const text = compact(evidence);
  if (!text) return;
  const bucket = map.get(key) ?? new Set<string>();
  bucket.add(text);
  map.set(key, bucket);
}

function addSignalsFromText(map: Map<PsycheSignalKey, Set<string>>, source: string, evidence: string) {
  for (const item of SIGNAL_PATTERNS) {
    if (item.pattern.test(source)) {
      addEvidence(map, item.key, evidence);
    }
  }
}

function optionEvidence(part1: Part1Record) {
  const rows: string[] = [];
  const map = new Map<PsycheSignalKey, Set<string>>();

  for (const [questionId, rawValue] of Object.entries(part1.answers)) {
    const question = benyuanQuestionsById[questionId];
    if (!question) continue;
    if (question.kind === "distribution" && rawValue && typeof rawValue === "object") {
      const time = rawValue as Record<string, unknown>;
      const evidence = `${question.title}：过去 ${compact(time.past)} / 现在 ${compact(time.present)} / 未来 ${compact(time.future)}`;
      rows.push(evidence);
      addEvidence(map, "time_gravity", evidence);
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
      addSignalsFromText(map, signalPayload + " " + option.text, evidence);
    }
  }

  return { rows, map };
}

function addMultimodalEvidence(map: Map<PsycheSignalKey, Set<string>>, part1: Part1Record) {
  const music = part1.part1_data.aesthetics.music_analysis;
  if (music) {
    const musicPayload = [
      music.primary_genres.join(" "),
      music.emotional_tone,
      music.language_diversity.join(" "),
      Object.entries(music.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join(" "),
    ].join(" ");
    addSignalsFromText(map, musicPayload, `音乐/歌单解析：声音气候 ${compact(music.emotional_tone)}，信号 ${compact(Object.entries(music.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join(" / "), 120)}`);
    addEvidence(map, "transitional_space", "音乐作为情绪容器和过渡空间参与后续剧场");
  }

  const posts = part1.part1_data.narrative.social_posts_analysis ?? [];
  for (const post of posts.slice(0, 3)) {
    const postPayload = [
      post.text_content,
      post.emotional_tone,
      post.themes.join(" "),
      post.expression_style,
      post.self_presentation,
      post.psychological_signals.join(" "),
    ].join(" ");
    addSignalsFromText(map, postPayload, `社交文字解析：${compact(post.expression_style)} / ${compact(post.emotional_tone)} / ${compact(post.psychological_signals.join("、"), 120)}`);
  }

  const overall = part1.part1_data.narrative.social_posts_overall_pattern;
  if (overall) {
    addSignalsFromText(
      map,
      [overall.dominant_emotion, overall.core_themes.join(" "), overall.expression_authenticity].join(" "),
      `社交总体姿态：${compact(overall.dominant_emotion)} / ${compact(overall.core_themes.join("、"))}`,
    );
  }

  const photo = part1.part1_data.narrative.precious_photo_analysis;
  if (photo) {
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
    addSignalsFromText(map, photoPayload, `照片/珍视物解析：${compact(photo.composition)} / ${compact(photo.lighting)} / ${compact(photo.psychological_interpretation.core_themes.join("、"), 120)}`);
    addEvidence(map, "projection_symbolic_sensitivity", "珍视照片被视作自我投射、关系位置和时间感的显影入口");
  }
}

function addTheaterEvidence(map: Map<PsycheSignalKey, Set<string>>, part2?: Part2Record) {
  if (!part2) return;
  for (const item of part2.act2_choices) {
    const text = getTheaterAct2ChoiceText(item.selected) ?? item.selected;
    addSignalsFromText(map, text, `剧场第 ${item.choice_id} 轮选择：${text}`);
  }
}

function buildEntries(map: Map<PsycheSignalKey, Set<string>>) {
  return [...map.entries()]
    .map(([key, evidence]) => ({
      key,
      ...SIGNAL_DEFINITIONS[key],
      evidence: [...evidence].slice(0, 4),
    }))
    .sort((left, right) => right.evidence.length - left.evidence.length || left.key.localeCompare(right.key));
}

function strengthLabel(count: number) {
  if (count >= 3) return "strong_signal";
  if (count >= 2) return "medium_signal";
  return "weak_signal";
}

function dominantTensions(entries: SignalEntry[]) {
  const keys = new Set(entries.slice(0, 8).map((item) => item.key));
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
  const evidenceCount = new Map(entries.map((item) => [item.key, item.evidence.length]));
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
  const weak = desiredOrder.filter((key) => (evidenceCount.get(key) ?? 0) < 2);
  const fallback = desiredOrder.filter((key) => evidenceCount.has(key)).slice(0, 4);
  return (weak.length > 0 ? weak : fallback).slice(0, 4).map((key, index) => {
    const definition = SIGNAL_DEFINITIONS[key];
    const role = ["行动入口", "关系距离", "欲望与边界", "动机/时间感/潜在防御"][index] ?? "补采样";
    return `${role}：${key} / ${definition.zhName}。前 13 题与多模态尚未采足这一层，需要在小说选择里让用户用具体行动补充。`;
  });
}

function narrativeInstruction(entries: SignalEntry[]) {
  const top = entries.slice(0, 5).map((item) => `${item.key}/${item.zhName}`).join("、") || "meaning_orientation/意义取向";
  return [
    "剧场生成指令：小说情节必须从精神元数据生长，而不是从原始素材清单生长。",
    `优先围绕这些核心信号建立短篇小说处境：${top}。`,
    "剧场四轮的核心任务不是重复 13 题，而是补足前 13 题和多模态之后仍不够清楚的精神向量。",
    "开场长文要把这些信号转成一个可进入的处境：空间、动作、关系距离、声音气候、核心物件和未完成问题。",
    "四轮选择分别采样行动入口、关系距离、欲望与边界、动机/时间感/潜在防御。",
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
    const evidence = item.evidence.map((row) => `    · ${row}`).join("\n");
    return `- ${item.key} / ${item.zhName} / ${strengthLabel(item.evidence.length)}：${item.description}\n${evidence}`;
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
