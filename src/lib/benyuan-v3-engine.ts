import { benyuanQuestionsById, getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { getBenyuanArchetypeProfile, isSupportedBenyuanArchetypeHint } from "@/lib/benyuan-v3-report-profile";
import { selectPsychoanalyticConceptsForPart1, summarizePsychoanalyticStarReading, type SelectedPsychoanalyticConcept } from "@/lib/benyuan-v3-psychoanalytic-concepts";
import { getPart2ChoiceText, getPart2ChoiceTraitSignal } from "@/lib/benyuan-v3-theater-labels";
import { parseTraitSignalComponents } from "@/lib/benyuan-v3-trait-signals";
import type {
  AggregatedTraits,
  MusicAnalysis,
  Part1AnswerMap,
  Part1Data,
  Part1Record,
  Part2Record,
  PreciousPhotoAnalysis,
  PsycheConstellation,
  SevenDimensionKey,
  SocialPostAnalysis,
  SocialPostOverallPattern,
  TheaterScript,
} from "@/lib/benyuan-v3-types";

const BIG_FIVE_BASE: AggregatedTraits["big_five"] = {
  openness: 58,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
};

const TAG_WEIGHTS: Record<string, Partial<AggregatedTraits["big_five"]>> = {
  openness_high: { openness: 12 },
  transcendence: { openness: 8 },
  romanticism: { openness: 5 },
  exploration: { openness: 8 },
  mysticism: { openness: 7 },
  knowledge_seeking: { openness: 7, conscientiousness: 2 },
  intellectualism: { openness: 6 },
  imagination: { openness: 8 },
  poetic: { openness: 6 },
  surrealism: { openness: 8 },
  dream_logic: { openness: 6 },
  spirituality: { openness: 6 },
  philosophical: { openness: 5 },
  cosmic: { openness: 4 },
  independence: { extraversion: -5, conscientiousness: 2 },
  introversion: { extraversion: -8 },
  loneliness: { extraversion: -4, neuroticism: 5 },
  existential_anxiety: { neuroticism: 10, openness: 4 },
  nostalgia: { neuroticism: 3, openness: 2 },
  emotional_restraint: { agreeableness: -1, extraversion: -2 },
  security_need: { neuroticism: 4, conscientiousness: 2 },
  warmth_seeking: { agreeableness: 5 },
  boundary: { conscientiousness: 2, extraversion: -1 },
  radicalism: { openness: 4, conscientiousness: -2 },
  change_seeking: { openness: 4 },
  nihilism: { neuroticism: 6 },
  rebellion: { openness: 3, conscientiousness: -2 },
  rational: { conscientiousness: 7, openness: -1 },
  systematic: { conscientiousness: 8 },
  intuitive: { openness: 5 },
  emotion_guided: { neuroticism: 2 },
  relationship_oriented: { agreeableness: 6, extraversion: 2 },
  avoidant: { conscientiousness: -4, neuroticism: 5 },
  decision_anxiety: { neuroticism: 6 },
  risk_taking: { openness: 3, conscientiousness: -1 },
  perfectionism: { conscientiousness: 6, neuroticism: 5 },
  emotional_stability: { neuroticism: -10 },
  repressive: { neuroticism: 4, extraversion: -1 },
  implicit_emotion: { neuroticism: 3 },
  depressive_tendency: { neuroticism: 8 },
  emotional_instability: { neuroticism: 10 },
  positive_baseline: { neuroticism: -6, agreeableness: 2 },
  past_oriented: { neuroticism: 3 },
  future_oriented: { conscientiousness: 2, neuroticism: 4 },
  present_oriented: { neuroticism: -3 },
  independent: { extraversion: -5, conscientiousness: 2 },
  selective_social: { extraversion: -4 },
  deep_connection: { agreeableness: 5 },
  extroverted: { extraversion: 12 },
  group_oriented: { extraversion: 8, agreeableness: 3 },
  attachment_anxiety: { neuroticism: 8 },
  avoidant_attachment: { extraversion: -4, agreeableness: -2 },
  strong_boundary: { conscientiousness: 2 },
  multifaceted: { openness: 3 },
  adaptive: { agreeableness: 2, openness: 2 },
  emotional_resonance: { openness: 3, agreeableness: 2 },
  solitary_comfort: { extraversion: -3 },
  cognitive_resonance: { openness: 3 },
  connection_need: { agreeableness: 4, extraversion: 2 },
  aesthetic_resonance: { openness: 5 },
  existential_resonance: { openness: 4, neuroticism: 2 },
  creative_resonance: { openness: 5 },
  resonance_difficulty: { agreeableness: -2, neuroticism: 3 },
};

const THEME_LABELS: Record<string, string> = {
  transcendence: "transcendence",
  romanticism: "romanticism",
  existential_anxiety: "existentialism",
  self_exploration: "self_exploration",
  philosophical: "philosophy",
  abstract_thinking: "abstract_thinking",
  loneliness: "solitude",
  introversion: "solitude",
  solitary_comfort: "solitude",
  emotional_resonance: "emotional_resonance",
  aesthetic_resonance: "aesthetic_sensitivity",
  visual_sensitivity: "aesthetic_sensitivity",
  knowledge_seeking: "meaning_seeking",
  quest: "meaning_seeking",
  spirituality: "meaning_seeking",
  existential_resonance: "meaning_seeking",
  cognitive_resonance: "meaning_seeking",
  nostalgia: "nostalgia",
  youth_nostalgia: "nostalgia",
  change_seeking: "change",
  deep_connection: "connection",
  connection_need: "connection",
  warmth: "warmth",
  family: "warmth",
  surrealism: "dream_logic",
  dream_logic: "dream_logic",
};

const VISIBLE_THEME_LABELS: Record<string, string> = {
  meaning_seeking: "意义追问",
  solitude: "独处重力",
  moon: "月光意象",
  transcendence: "辽阔感",
  romanticism: "浪漫底色",
  aesthetic_sensitivity: "象征感受力",
  emotional_resonance: "情绪共振",
  connection: "深层连接",
  warmth: "温度与归属",
  nostalgia: "记忆回潮",
  dream_logic: "梦境逻辑",
  existentialism: "存在清醒",
  self_exploration: "自我辨认",
  philosophy: "哲学追问",
  abstract_thinking: "抽象思辨",
  change: "变化欲望",
  reflection: "安静回望",
  daily_life: "日常纹理",
  nature: "自然感应",
  time: "时间感",
  love: "关系回声",
  loneliness: "孤独感",
  boundary: "边界意识",
  strong_boundary: "边界完整度",
  independence: "自主位置",
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasUsableMusicAnalysis(value: MusicAnalysis | null | undefined): value is MusicAnalysis {
  return value?.analysis_status === "analyzed";
}

function hasUsableSocialAnalysis(part1Data: Part1Data) {
  const overall = part1Data.narrative.social_posts_overall_pattern;
  return Boolean(
    part1Data.narrative.social_posts_analysis?.length &&
    overall?.analysis_status === "analyzed",
  );
}

function hasUsablePhotoAnalysis(value: PreciousPhotoAnalysis | null | undefined): value is PreciousPhotoAnalysis {
  return value?.analysis_status === "analyzed";
}

function collectSelectedTags(answers: Part1AnswerMap) {
  const tags: string[] = [];

  for (const [questionId, rawValue] of Object.entries(answers)) {
    const question = benyuanQuestionsById[questionId];
    if (!question) continue;

    if (question.kind === "single" && typeof rawValue === "string") {
      tags.push(...getQuestionOptionTags(questionId, rawValue));
    }

    if (question.kind === "multi" && Array.isArray(rawValue)) {
      for (const optionId of rawValue) {
        if (typeof optionId === "string") tags.push(...getQuestionOptionTags(questionId, optionId));
      }
    }
  }

  return tags;
}

function countByValue(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function toSentenceCase(value: string) {
  return value.replace(/_/g, " ");
}

export function buildPart1DataFromAnswers(answers: Part1AnswerMap, existing?: Part1Data): Part1Data {
  const time = answers.B4_time_philosophy as { past?: number; present?: number; future?: number } | undefined;

  return {
    aesthetics: {
      core_desire_image: typeof answers.A1_core_image === "string" ? answers.A1_core_image : existing?.aesthetics.core_desire_image,
      music_analysis: existing?.aesthetics.music_analysis ?? null,
      literature: Array.isArray(answers.A3_literature) ? answers.A3_literature.filter((value): value is string => typeof value === "string") : existing?.aesthetics.literature,
      cinema: typeof answers.A4_cinema === "string" ? answers.A4_cinema : existing?.aesthetics.cinema,
      inspiration_scene: typeof answers.A5_inspiration_scene === "string" ? answers.A5_inspiration_scene : existing?.aesthetics.inspiration_scene,
    },
    philosophy: {
      night_thoughts: typeof answers.B1_night_thoughts === "string" ? answers.B1_night_thoughts : existing?.philosophy.night_thoughts,
      decision_style: typeof answers.B2_decision_style === "string" ? answers.B2_decision_style : existing?.philosophy.decision_style,
      emotion_pattern: typeof answers.B3_emotion_pattern === "string" ? answers.B3_emotion_pattern : existing?.philosophy.emotion_pattern,
      time_orientation: time && typeof time.past === "number" && typeof time.present === "number" && typeof time.future === "number"
        ? { past: time.past, present: time.present, future: time.future }
        : existing?.philosophy.time_orientation,
      relationship_philosophy: typeof answers.B5_relationship_philosophy === "string" ? answers.B5_relationship_philosophy : existing?.philosophy.relationship_philosophy,
    },
    narrative: {
      social_posts_analysis: existing?.narrative.social_posts_analysis ?? null,
      social_posts_overall_pattern: existing?.narrative.social_posts_overall_pattern ?? null,
      precious_photo_analysis: existing?.narrative.precious_photo_analysis ?? null,
      resonance_moments: Array.isArray(answers.C3_resonance_moments)
        ? answers.C3_resonance_moments.filter((value): value is string => typeof value === "string")
        : existing?.narrative.resonance_moments,
    },
  };
}

export function aggregateTraitsFromPart1(answers: Part1AnswerMap, part1Data: Part1Data): AggregatedTraits {
  const tags = collectSelectedTags(answers);
  const totals = { ...BIG_FIVE_BASE };

  for (const tag of tags) {
    const weights = TAG_WEIGHTS[tag];
    if (!weights) continue;
    for (const [key, value] of Object.entries(weights) as Array<[keyof typeof totals, number]>) {
      totals[key] += value;
    }
  }

  const musicSignals = hasUsableMusicAnalysis(part1Data.aesthetics.music_analysis)
    ? part1Data.aesthetics.music_analysis?.personality_signals
    : undefined;
  if (musicSignals) {
    if (musicSignals.openness === "high") totals.openness += 8;
    if (musicSignals.introversion === "medium_high") totals.extraversion -= 5;
    if (musicSignals.emotional_depth === "high") totals.neuroticism += 4;
    if (musicSignals.nostalgia === "medium") totals.neuroticism += 2;
  }

  const photoTraits = hasUsablePhotoAnalysis(part1Data.narrative.precious_photo_analysis)
    ? part1Data.narrative.precious_photo_analysis?.psychological_interpretation?.traits ?? []
    : [];
  if (photoTraits.includes("high_openness")) totals.openness += 6;
  if (photoTraits.includes("introversion")) totals.extraversion -= 5;
  if (photoTraits.includes("meaning_seeking")) totals.openness += 4;

  const postSignals = hasUsableSocialAnalysis(part1Data)
    ? part1Data.narrative.social_posts_analysis?.flatMap((item) => item.psychological_signals) ?? []
    : [];
  if (postSignals.includes("high_sensitivity")) totals.neuroticism += 5;
  if (postSignals.includes("emotional_depth")) totals.openness += 3;
  if (postSignals.includes("solitary_reflection")) totals.extraversion -= 4;

  const themeCounts = countByValue(tags.map((tag) => THEME_LABELS[tag]).filter((value): value is string => Boolean(value)));
  const timeOrientation = part1Data.philosophy.time_orientation;
  const timeTheme = timeOrientation && Math.max(timeOrientation.past, timeOrientation.present, timeOrientation.future) >= 45
    ? timeOrientation.past > timeOrientation.present && timeOrientation.past > timeOrientation.future
      ? "nostalgia"
      : timeOrientation.future > timeOrientation.past && timeOrientation.future > timeOrientation.present
        ? "change"
        : "daily_life"
    : undefined;
  const themePool = [
    timeTheme,
    ...Object.entries(themeCounts)
      .sort((left, right) => right[1] - left[1])
      .map(([theme]) => theme),
    ...(hasUsableSocialAnalysis(part1Data) ? part1Data.narrative.social_posts_overall_pattern?.core_themes ?? [] : []),
    ...(hasUsablePhotoAnalysis(part1Data.narrative.precious_photo_analysis) ? part1Data.narrative.precious_photo_analysis?.psychological_interpretation?.core_themes ?? [] : []),
  ];

  const uniqueThemes = [...new Set(themePool.filter((value): value is string => Boolean(value)))].slice(0, 4);
  const bigFive = {
    openness: clampScore(totals.openness),
    conscientiousness: clampScore(totals.conscientiousness),
    extraversion: clampScore(totals.extraversion),
    agreeableness: clampScore(totals.agreeableness),
    neuroticism: clampScore(totals.neuroticism),
  };

  const coreImage = typeof answers.A1_core_image === "string" ? answers.A1_core_image : "";
  const inspirationScene = typeof answers.A5_inspiration_scene === "string" ? answers.A5_inspiration_scene : "";
  const decisionStyle = typeof answers.B2_decision_style === "string" ? answers.B2_decision_style : "";
  const emotionPattern = typeof answers.B3_emotion_pattern === "string" ? answers.B3_emotion_pattern : "";
  const relationshipPhilosophy = typeof answers.B5_relationship_philosophy === "string" ? answers.B5_relationship_philosophy : "";
  const pastDominant = Boolean(timeOrientation && timeOrientation.past >= 45 && timeOrientation.past > timeOrientation.future);
  const presentDominant = Boolean(timeOrientation && timeOrientation.present >= 45);
  const futureDominant = Boolean(timeOrientation && timeOrientation.future >= 45 && timeOrientation.future > timeOrientation.past);
  const tagSet = new Set(tags);
  const hasTag = (...values: string[]) => values.some((value) => tagSet.has(value));

  const archetypeScores = {
    lone_seeker:
      (bigFive.openness >= 76 ? 2.2 : 0) +
      (bigFive.extraversion <= 45 ? 1.8 : 0) +
      (["A1-1", "A1-2"].includes(coreImage) ? 1.3 : 0) +
      (decisionStyle === "B2-2" ? 1 : 0) +
      (emotionPattern === "B3-2" ? 1 : 0) +
      (relationshipPhilosophy === "B5-1" ? 0.8 : 0) +
      (pastDominant ? 0.35 : 0) +
      (uniqueThemes.includes("meaning_seeking") ? 0.8 : 0),
    melancholic_poet:
      (bigFive.neuroticism >= 68 ? 2 : 0) +
      (uniqueThemes.includes("aesthetic_sensitivity") ? 1.1 : 0) +
      (emotionPattern === "B3-2" ? 0.8 : 0) +
      (pastDominant ? 0.7 : 0) +
      (["A1-1", "A1-6"].includes(coreImage) ? 0.7 : 0),
    existential_wanderer:
      (uniqueThemes.includes("meaning_seeking") ? 1.5 : 0) +
      (uniqueThemes.includes("existentialism") ? 1.3 : 0) +
      (bigFive.openness >= 72 ? 0.7 : 0) +
      (futureDominant ? 0.55 : 0) +
      (decisionStyle === "B2-2" ? 0.4 : 0),
    rational_builder:
      (bigFive.conscientiousness >= 68 ? 2.4 : 0) +
      (bigFive.neuroticism <= 48 ? 1.8 : 0) +
      (coreImage === "A1-3" ? 1.4 : 0) +
      (inspirationScene === "A5-2" ? 1 : 0) +
      (presentDominant ? 0.5 : 0) +
      (decisionStyle === "B2-1" ? 1.4 : 0) +
      (emotionPattern === "B3-1" ? 0.8 : 0) +
      (relationshipPhilosophy === "B5-5" ? 0.8 : 0),
    gentle_guardian:
      (bigFive.agreeableness >= 65 ? 2.2 : 0) +
      (uniqueThemes.includes("connection") ? 1.4 : 0) +
      (coreImage === "A1-5" ? 1.4 : 0) +
      (inspirationScene === "A5-3" ? 0.8 : 0) +
      (decisionStyle === "B2-3" ? 1 : 0) +
      (emotionPattern === "B3-7" ? 1 : 0) +
      (relationshipPhilosophy === "B5-2" ? 1.2 : 0),
    black_hole_event_horizon:
      (bigFive.neuroticism >= 66 ? 1.6 : 0) +
      (bigFive.extraversion <= 42 ? 1 : 0) +
      (hasTag("abyss", "alienation", "existential_anxiety", "resonance_difficulty") ? 1.6 : 0) +
      (hasTag("low_mood", "persistent", "avoidant", "decision_anxiety") ? 1.2 : 0) +
      (coreImage === "A1-6" ? 1.2 : 0) +
      (inspirationScene === "A5-5" ? 0.8 : 0) +
      (decisionStyle === "B2-4" ? 1 : 0) +
      (pastDominant ? 0.45 : 0) +
      (emotionPattern === "B3-4" ? 1 : 0) +
      (relationshipPhilosophy === "B5-5" ? 0.8 : 0),
    nebula_weaver:
      (bigFive.openness >= 76 ? 1.4 : 0) +
      (hasTag("surrealism", "dream_logic", "imagination", "poetic", "creative_resonance") ? 1.8 : 0) +
      (hasTag("aesthetic_resonance", "visual_sensitivity", "art_immersion", "aesthetic_absorption") ? 1.2 : 0) +
      (["A1-7", "A1-4"].includes(coreImage) ? 0.9 : 0) +
      (inspirationScene === "A5-7" ? 1 : 0) +
      (decisionStyle === "B2-2" ? 0.6 : 0) +
      (relationshipPhilosophy === "B5-6" ? 0.7 : 0),
    solar_corona:
      (bigFive.extraversion >= 58 ? 1.2 : 0) +
      (bigFive.neuroticism <= 50 ? 1 : 0) +
      (hasTag("positive_baseline", "action_oriented", "risk_taking", "cosmic", "nature") ? 1.7 : 0) +
      (hasTag("extroverted", "group_oriented", "creative_resonance") ? 1 : 0) +
      (coreImage === "A1-1" ? 0.9 : 0) +
      (inspirationScene === "A5-3" ? 0.8 : 0) +
      (decisionStyle === "B2-5" ? 1.1 : 0) +
      (futureDominant || presentDominant ? 0.45 : 0) +
      (emotionPattern === "B3-7" ? 1.2 : 0) +
      (relationshipPhilosophy === "B5-3" ? 0.9 : 0),
    terrestrial_planet:
      (bigFive.conscientiousness >= 58 ? 1.1 : 0) +
      (bigFive.agreeableness >= 58 ? 1 : 0) +
      (bigFive.neuroticism <= 52 ? 0.8 : 0) +
      (hasTag("security_need", "warmth_seeking", "nature", "tranquility", "realism", "deep_connection") ? 1.8 : 0) +
      (coreImage === "A1-5" ? 1 : 0) +
      (inspirationScene === "A5-3" ? 0.8 : 0) +
      (presentDominant ? 0.65 : 0) +
      (decisionStyle === "B2-1" ? 0.8 : 0) +
      (emotionPattern === "B3-1" ? 1 : 0) +
      (relationshipPhilosophy === "B5-2" ? 1 : 0),
    deep_space_anchor:
      (bigFive.extraversion <= 42 ? 1.2 : 0) +
      (bigFive.conscientiousness >= 56 ? 0.8 : 0) +
      (hasTag("independence", "boundary", "strong_boundary", "selective_social", "solitude", "knowledge") ? 1.8 : 0) +
      (hasTag("perfectionism", "decision_paralysis", "emotional_restraint") ? 0.8 : 0) +
      (["A1-2", "A1-3"].includes(coreImage) ? 1 : 0) +
      (inspirationScene === "A5-1" ? 0.9 : 0) +
      (["B2-1", "B2-6"].includes(decisionStyle) ? 0.7 : 0) +
      (["B5-1", "B5-5"].includes(relationshipPhilosophy) ? 0.9 : 0),
  } satisfies Record<string, number>;

  const archetypeHints = Object.entries(archetypeScores)
    .sort((left, right) => right[1] - left[1])
    .filter(([, score]) => score >= 2.4)
    .map(([key]) => key)
    .slice(0, 3);

  return {
    big_five: bigFive,
    core_themes: uniqueThemes,
    archetype_hints: archetypeHints.length > 0 ? archetypeHints : ["lone_seeker"],
  };
}

export function analyzeMusicInputs(inputs: Array<{ visible_text?: string; source?: string; description?: string }> = []): MusicAnalysis {
  void inputs;
  return {
    analysis_status: "insufficient_evidence",
    evidence_quality: "none",
    primary_genres: [],
    emotional_tone: "insufficient_evidence",
    era_distribution: {},
    language_diversity: [],
    personality_signals: {},
    recognized_tracks: [],
  };
}

export function analyzeSocialPostInputs(inputs: Array<{ visible_text?: string; source?: string; description?: string }> = []) {
  void inputs;
  return {
    posts: [] as SocialPostAnalysis[],
    overallPattern: {
      analysis_status: "insufficient_evidence",
      evidence_quality: "none",
      dominant_emotion: "insufficient_evidence",
      core_themes: [],
      expression_authenticity: "insufficient_evidence",
    } satisfies SocialPostOverallPattern,
  };
}

export function analyzePreciousPhotoInput(input?: { description?: string }): PreciousPhotoAnalysis {
  void input;
  return {
    analysis_status: "insufficient_evidence",
    evidence_quality: "none",
    visual_content: "insufficient_evidence",
    composition: "insufficient_evidence",
    lighting: "insufficient_evidence",
    color_mood: "insufficient_evidence",
    symbolic_elements: [],
    psychological_interpretation: {
      core_themes: [],
      emotional_tone: "insufficient_evidence",
      self_concept: "insufficient_evidence",
      existential_stance: "insufficient_evidence",
      traits: [],
    },
  };
}

function getSelectedText(questionId: string | undefined, optionId: string | undefined) {
  if (!questionId || !optionId) return optionId ?? "";
  return getQuestionOption(questionId, optionId)?.text ?? optionId;
}

function uncertaintyResponseLens(optionId: string | undefined) {
  const lenses: Record<string, string> = {
    "B1-1": "先整理已有信息，寻找可控判断",
    "B1-2": "先退开一点，等牵动感降低",
    "B1-3": "向可信的人确认自己的判断",
    "B1-4": "用一个现实动作抵消等待",
    "B1-5": "先把感受写下来，为它留出位置",
    "B1-6": "先追问这件事会把自己带向哪里",
    "B1-7": "先让身体休息，再重新判断",
  };
  return optionId ? lenses[optionId] ?? "先为不确定留出辨认空间" : "先为不确定留出辨认空间";
}

function desireResponseLens(optionId: string | undefined) {
  const lenses: Record<string, string> = {
    "B2-1": "先压低欲望的音量，观察它会不会退去",
    "B2-2": "先理解欲望为何出现，再决定是否靠近",
    "B2-3": "借可信关系检查自己是否漏看了什么",
    "B2-4": "先给欲望一个很小、可撤回的位置",
    "B2-5": "允许自己为强烈愿望承担一次小风险",
    "B2-6": "等待一个足够完整的理由再行动",
  };
  return optionId ? lenses[optionId] ?? "先确认愿望的真实方向" : "先确认愿望的真实方向";
}

function relationshipResponseLens(optionId: string | undefined) {
  const lenses: Record<string, string> = {
    "B5-1": "先留意回应和语气是否仍然稳定",
    "B5-2": "先觉察自己是否开始收紧表达",
    "B5-3": "先确认共同期待是否正在减少",
    "B5-4": "先判断这段关系是否仍值得投入",
    "B5-5": "先确认靠近不会占满自己的空间",
    "B5-6": "尝试换一种表达，确认彼此还能否听懂",
  };
  return optionId ? lenses[optionId] ?? "先辨认关系里的真实距离" : "先辨认关系里的真实距离";
}

function resonanceMomentLens(optionId: string) {
  const lenses: Record<string, string> = {
    "C3-1": "深夜音乐替情绪留出位置",
    "C3-2": "被一句话准确写中",
    "C3-3": "在作品里认出想靠近又退后的自己",
    "C3-4": "被一个画面突然击中",
    "C3-5": "在行走或移动中重新听见自己",
    "C3-6": "通过创作把感受释放出来",
    "C3-7": "隔着距离观察尚未靠近的共鸣",
  };
  return lenses[optionId] ?? trimTerminalPunctuation(getSelectedText("C3_resonance_moments", optionId));
}

export function resolvePart1ArchetypeHints(record: Part1Record) {
  const storedHints = record.aggregated_traits.archetype_hints.filter(isSupportedBenyuanArchetypeHint);
  if (storedHints.length > 0) return storedHints;

  const recomputed = aggregateTraitsFromPart1(record.answers, record.part1_data)
    .archetype_hints
    .filter(isSupportedBenyuanArchetypeHint);
  return recomputed.length > 0 ? recomputed : ["lone_seeker"];
}

function getCoreArchetype(record: Part1Record) {
  return resolvePart1ArchetypeHints(record)[0];
}

const PART2_ARCHETYPE_SIGNAL_RULES: Array<{ archetype: string; pattern: RegExp; weight: number }> = [
  { archetype: "lone_seeker", pattern: /solitude|reflective|introspect|independen/u, weight: 0.8 },
  { archetype: "melancholic_poet", pattern: /emotion|nostalgia|repress|withheld|vulnerab/u, weight: 0.95 },
  { archetype: "existential_wanderer", pattern: /meaning|existential|freedom|uncertainty|explor/u, weight: 0.9 },
  { archetype: "rational_builder", pattern: /analytical|systematic|order|structure|discernment/u, weight: 1 },
  { archetype: "gentle_guardian", pattern: /relationship|connection|trust|intimacy|being_understood/u, weight: 1 },
  { archetype: "black_hole_event_horizon", pattern: /shadow|avoid|withdraw|alienation|abyss|repress/u, weight: 0.9 },
  { archetype: "nebula_weaver", pattern: /creative|symbol|ambigu|non_linear|imagination/u, weight: 1 },
  { archetype: "solar_corona", pattern: /action|agency|risk_taking|movement|approach/u, weight: 1 },
  { archetype: "terrestrial_planet", pattern: /security|stabili|grounded|warmth|regulation/u, weight: 1 },
  { archetype: "deep_space_anchor", pattern: /boundary|autonomy|self_preserv|self_protect|independen/u, weight: 1 },
];

function selectConstellationArchetype(record: Part1Record, part2?: Part2Record) {
  const baseHints = resolvePart1ArchetypeHints(record);
  const base = baseHints[0];
  if (!part2?.act2_choices.length) return base;

  const scores = new Map<string, number>();
  const supportingRounds = new Map<string, Set<number>>();
  baseHints.slice(0, 3).forEach((hint, index) => scores.set(hint, 3.2 - index * 1.2));

  const signals = resolvedTheaterTraitSignals(part2);
  signals.forEach((signal, index) => {
    const components = parseTraitSignalComponents(signal).map((component) => ({
      ...component,
      semantic: component.semantic.toLocaleLowerCase("en-US"),
    }));
    for (const rule of PART2_ARCHETYPE_SIGNAL_RULES) {
      const netDirection = components.reduce((total, component) => {
        if (!rule.pattern.test(component.semantic)) return total;
        return total + (component.polarity === "counter" ? -1 : 1);
      }, 0);
      if (netDirection === 0) continue;
      scores.set(rule.archetype, (scores.get(rule.archetype) ?? 0) + Math.sign(netDirection) * rule.weight);
      if (netDirection < 0) continue;
      const rounds = supportingRounds.get(rule.archetype) ?? new Set<number>();
      rounds.add(index + 1);
      supportingRounds.set(rule.archetype, rounds);
    }
  });

  const [candidate, candidateScore] = [...scores.entries()].sort((left, right) => right[1] - left[1])[0] ?? [base, scores.get(base) ?? 0];
  const baseScore = scores.get(base) ?? 0;
  const supportCount = supportingRounds.get(candidate)?.size ?? 0;
  return candidate !== base && supportCount >= 2 && candidateScore >= baseScore + 0.7 ? candidate : base;
}

function firstSocialPostText(record: Part1Record) {
  return record.part1_data.narrative.social_posts_analysis?.[0]?.text_content || "那句你曾经留下的话";
}

function photoMotif(record: Part1Record) {
  const photo = record.part1_data.narrative.precious_photo_analysis;
  if (!hasUsablePhotoAnalysis(photo)) return "一张尚未显影的照片";
  const visual = visiblePhotoTerm(photo.visual_content) ?? "一张带着远景与留白的照片";
  const symbols = [...new Set(photo.symbolic_elements.map((item) => visiblePhotoTerm(item)).filter((item): item is string => Boolean(item)))];
  return `${visual}，并保留${symbols.length > 0 ? symbols.filter((item) => item !== visual).slice(0, 3).join("、") : "光、距离与未说出口的时间"}`;
}

const MUSIC_GENRE_LABELS: Record<string, string> = {
  "post-rock": "后摇般的低频回声",
  postrock: "后摇般的低频回声",
  ambient: "氛围声场",
  indie: "独立旋律",
  classical: "古典余韵",
  electronic: "电子微光",
  instrumental: "无词旋律",
};

const MUSIC_TONE_LABELS: Record<string, string> = {
  melancholic_introspective: "带着安静内省的暗光",
  reflective_open: "带着清醒而敞开的回声",
  melancholic_nostalgic: "带着记忆回潮后的微微低光",
  warm_hopeful: "带着温暖而仍愿意向前的亮度",
  complex_reflective: "带着复杂又克制的沉思",
  quiet: "带着安静的呼吸感",
  medium: "带着平稳的底色",
  high: "带着更深的情绪密度",
};

const PHOTO_TERM_LABELS: Record<string, string> = {
  "moon over sea": "海面上方的月影",
  lone_figure_seascape_sunset: "暮色海边的独行身影",
  morning_bicycle_tree_shadow: "清晨树影里的骑行身影",
  symbolic_landscape: "带有象征感的风景",
  moon: "月光",
  sea: "海面",
  ocean: "海面",
  shore: "岸线",
  sunset: "日落",
  horizon: "地平线",
  solitude: "独处感",
  vastness: "辽阔感",
  bicycle: "自行车",
  tree_shadow: "树影",
  open_path: "开阔路径",
  morning: "清晨",
  renewal: "重新开始",
};

function normalizeVisibleToken(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN").replace(/\s+/g, " ");
}

function isUnreadableVisibleToken(value: string) {
  const normalized = normalizeVisibleToken(value);
  return (
    !normalized ||
    normalized.includes("undetermined") ||
    normalized.includes("no_visible") ||
    normalized.includes("no visible") ||
    normalized.includes("ocr") ||
    normalized === "n/a" ||
    normalized === "none" ||
    normalized === "unknown"
  );
}

function visiblePhotoTerm(value: string | null | undefined) {
  const normalized = normalizeVisibleToken(value ?? "");
  if (isUnreadableVisibleToken(normalized)) return null;
  const exact = PHOTO_TERM_LABELS[normalized];
  if (exact) return exact;
  if (/日落|sunset|橙红|暮色/u.test(normalized) && /海|岸|浪|ocean|sea|shore/u.test(normalized)) return "暮色海岸与逆光背影";
  if (/日落/u.test(normalized)) return "日落与时间收束";
  if (/独处|背影/u.test(normalized)) return "独处的背影";
  if (/海岸|波浪/u.test(normalized)) return "海岸与过渡边界";
  if (/逆光/u.test(normalized)) return "逆光下的主体距离";
  if (/清晨|morning/u.test(normalized) && /骑|自行车|bicycle|树影/u.test(normalized)) return "清晨树影里的骑行身影";
  if (/窗|window|房间|room/u.test(normalized)) return "窗边低光与未完成的房间";
  const raw = (value ?? "").trim();
  return /[一-龥]/u.test(raw) && raw.length <= 28 ? raw : null;
}

function visibleMusicGenre(value: string) {
  const normalized = normalizeVisibleToken(value).replace(/\s+raw$/u, "");
  if (isUnreadableVisibleToken(normalized)) return null;
  if (normalized.includes("post-rock")) return MUSIC_GENRE_LABELS["post-rock"];
  return MUSIC_GENRE_LABELS[normalized] ?? (/[一-龥]/u.test(value) ? value.trim() : null);
}

function visibleMusicTone(value: string | null | undefined) {
  const normalized = normalizeVisibleToken(value ?? "");
  if (isUnreadableVisibleToken(normalized)) return null;
  return MUSIC_TONE_LABELS[normalized] ?? (/[一-龥]/u.test(value ?? "") ? (value ?? "").trim() : null);
}

function musicMotif(record: Part1Record) {
  const music = record.part1_data.aesthetics.music_analysis;
  if (!hasUsableMusicAnalysis(music)) return "一段尚未显影的声音线索";
  const genres = [...new Set(music.primary_genres.map(visibleMusicGenre).filter((item): item is string => Boolean(item)))];
  const tone = visibleMusicTone(music.emotional_tone) ?? "带着尚未完全显影的情绪底色";
  if (genres.length === 0) return `一段辨认不清却仍有温度的声音线索，${tone}`;
  return `${genres.slice(0, 3).join("、")}交织成一条声音线，${tone}`;
}

function deriveMusicPsycheReading(record: Part1Record) {
  const music = record.part1_data.aesthetics.music_analysis;
  const source = evidenceFingerprint(record);
  if (!hasUsableMusicAnalysis(music)) {
    return "";
  }

  if (hasEvidenceCue(source, /post-rock|postrock|ambient|instrumental|melancholic|introspective|nostalgic|后摇|氛围|低频/u)) {
    return "你选择的声音更偏低频、无词或缓慢铺陈。它们像一个安全容器，先替你承接情绪，再把是否开口的决定留给你。";
  }

  if (hasEvidenceCue(source, /warm|hopeful|electronic|indie|morning|renewal|温暖|电子|独立|清晨|重新开始/u)) {
    return "温暖脉冲和身体节律反复出现，潜在欲望正在转向重新启动：你想把一个新方向带回现实。";
  }

  return "你的歌单形成了一张情绪气候图，保留着可退可进的距离，让真实状态逐渐清晰。";
}

function derivePhotoPsycheReading(record: Part1Record) {
  const photo = record.part1_data.narrative.precious_photo_analysis;
  if (!hasUsablePhotoAnalysis(photo)) {
    return "";
  }

  const source = evidenceFingerprint(record);
  if (hasEvidenceCue(source, /sea|ocean|shore|horizon|海|岸|潮|lonefigure|seascape|solitude|辽阔/u)) {
    return "你珍视的画面更像一处可退守的远景：辽阔、低光、人与世界保持距离。你在寻找一个不会立刻侵入自我位置的空间，让情绪慢慢显形。";
  }

  if (hasEvidenceCue(source, /morning|bicycle|tree|renewal|openpath|清晨|骑|树影|重新开始/u)) {
    return "你珍视的画面带有路径、移动和重新开始的意味。它替你保存着一个尚未兑现的自我投射：由自己重新踩住生活的节奏。";
  }

  if (hasEvidenceCue(source, /window|rain|room|interior|窗|雨|房间/u)) {
    return "你珍视的画面更接近窗、雨或房间一类半开放空间。它背后隐藏的是边界动机：你想被世界看见一点，但仍需要一层玻璃，让真实不至于过早暴露。";
  }

  return "你把难以直接说出的关系位置、时间感和未完成愿望，交给光线、构图和物件保存；图像由此成为一块投射屏。";
}

function deriveSocialPsycheReading(record: Part1Record) {
  const social = record.part1_data.narrative.social_posts_analysis?.[0];
  const overall = record.part1_data.narrative.social_posts_overall_pattern;
  if (!hasUsableSocialAnalysis(record.part1_data) || (!social && !overall)) {
    return "";
  }

  const style = social?.expression_style ?? "";
  const presentation = social?.self_presentation ?? "";
  const themes = new Set([...(social?.themes ?? []), ...(overall?.core_themes ?? [])]);
  if (style.includes("poetic") || themes.has("unsent_words")) {
    return "你的社交文字把真实折进隐喻里，诗性表面下藏着低强度的回应愿望。你会控制它的亮度，避免需要显得过于直接。";
  }

  if (presentation.includes("vulnerable") || social?.psychological_signals?.includes("emotional_depth")) {
    return "你的文字里有真实袒露的痕迹，但它通常不会完全摊开。它显示的社交状态是：愿意让别人靠近，却会保留解释权，避免自己的情绪被别人过快命名。";
  }

  if (themes.has("movement") || themes.has("renewal") || themes.has("daily_life")) {
    return "你的社交文字把更新愿望放进日常动作里，而不是直接宣布改变。它背后的心理动机更像在测试现实是否仍可重新开始，同时保留自己随时调整方向的自由。";
  }

  return "你的社交表达在管理别人能看见的部分：既留下线索，也保留边界，客体距离因此始终清晰。";
}

function materialFingerprintForTheater(record: Part1Record) {
  const music = hasUsableMusicAnalysis(record.part1_data.aesthetics.music_analysis) ? record.part1_data.aesthetics.music_analysis : undefined;
  const photo = hasUsablePhotoAnalysis(record.part1_data.narrative.precious_photo_analysis) ? record.part1_data.narrative.precious_photo_analysis : undefined;
  const social = hasUsableSocialAnalysis(record.part1_data) ? record.part1_data.narrative.social_posts_analysis ?? [] : [];
  return [
    record.part1_data.aesthetics.core_desire_image,
    record.part1_data.aesthetics.inspiration_scene,
    record.part1_data.philosophy.decision_style,
    record.part1_data.philosophy.emotion_pattern,
    record.part1_data.philosophy.relationship_philosophy,
    music?.primary_genres.join("|"),
    music?.emotional_tone,
    Object.entries(music?.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join("|"),
    photo?.visual_content,
    photo?.composition,
    photo?.lighting,
    photo?.color_mood,
    photo?.symbolic_elements.join("|"),
    photo?.psychological_interpretation.core_themes.join("|"),
    social.map((item) => `${item.emotional_tone}:${item.themes.join("|")}:${item.expression_style}:${item.psychological_signals.join("|")}`).join("||"),
  ].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
}

function hasTheaterCue(source: string, pattern: RegExp) {
  return pattern.test(source);
}

function deriveTheaterMaterialReading(record: Part1Record) {
  const source = materialFingerprintForTheater(record);
  const social = record.part1_data.narrative.social_posts_analysis?.[0];
  const socialThemes = new Set([...(social?.themes ?? []), ...(record.part1_data.narrative.social_posts_overall_pattern?.core_themes ?? [])]);
  const socialSignals = new Set(social?.psychological_signals ?? []);
  const music = record.part1_data.aesthetics.music_analysis;
  const musicSignals = music?.personality_signals ?? {};

  const seaLike = hasTheaterCue(source, /sea|ocean|shore|horizon|海|岸|潮|lonefigure|seascape/u);
  const morningLike = hasTheaterCue(source, /morning|bicycle|tree|renewal|openpath|清晨|骑|树影|重新开始/u);
  const windowLike = hasTheaterCue(source, /window|rain|room|interior|窗|雨|房间/u);
  const structureLike = hasTheaterCue(source, /grid|architecture|city|order|map|building|秩序|城市|几何|坐标/u);
  const lowFrequency = hasTheaterCue(source, /post-rock|postrock|ambient|instrumental|melancholic|introspective|nostalgic|低频|后摇|氛围/u);
  const warmPulse = hasTheaterCue(source, /warm|hopeful|electronic|indie|morning|renewal|温暖|电子|独立/u);
  const explicitConnection = socialThemes.has("love") || socialThemes.has("connection") || socialSignals.has("emotional_depth");

  const visualMotive = seaLike
    ? "远处海面和一条被潮水反复擦亮的边线"
    : morningLike
      ? "清晨树影里一段刚被照亮的路"
      : windowLike
        ? "一扇有雨痕的窗，窗后有一间没有完全点亮的房间"
        : structureLike
          ? "一组排列得很清楚、却在边缘轻微错位的坐标"
          : "一块尚未完全显影的影像，边缘保留着光和距离";

  const entranceSpace = seaLike
    ? "一条被黑色潮水覆盖的长廊"
    : morningLike
      ? "一段悬在清晨与夜色之间的窄路"
      : windowLike
        ? "一间靠近窗边的暗房"
        : structureLike
          ? "一座安静旋转的星图房间"
          : "一片低光浮动的深场";

  const centralObject = seaLike
    ? "一封被潮水托起、迟迟没有寄出的信"
    : morningLike
      ? "一把挂着微光的车钥匙"
      : windowLike
        ? "一页贴在窗上的薄纸"
        : structureLike
          ? "一枚刻着细线的黑色坐标盘"
          : "一件被光擦亮边缘的旧物";

  const soundWeather = lowFrequency
    ? "很低的无词声场从墙后推来，像情绪先替你试探空气"
    : warmPulse
      ? "细小的脉冲在地面下亮起，像身体在提醒你仍可以往前"
      : "一段辨认不清的声音贴着深处流动，像某种尚未开口的情绪";

  const hiddenWish = explicitConnection
    ? "想被真正听见，却不想被立刻解释"
    : musicSignals.emotional_depth === "high"
      ? "想让深处的情绪被承认，但仍保留自己的速度"
      : "想确认这条路真的属于自己，而不是被外界推着走";

  const defenseGesture = record.part1_data.philosophy.decision_style === "B2-1" || structureLike
    ? "先整理轮廓，再决定是否进入"
    : record.part1_data.philosophy.decision_style === "B2-4"
      ? "先保留退路，避免被过早的后果拖住"
      : "先观察光源，等它稳定后再靠近";

  const relationDistance = record.part1_data.philosophy.relationship_philosophy === "B5-1"
    ? "你会先读空气里最细微的变化，确认回应是否仍然稳定"
    : record.part1_data.philosophy.relationship_philosophy === "B5-5"
      ? "你会先判断这段靠近是否值得继续投入"
      : "你靠近时仍会保留一小段让自己呼吸的距离";

  const transformedSentence = social?.expression_style?.includes("poetic") || socialThemes.has("unsent_words")
    ? "一句被写下却没有完全交出去的话"
    : social?.self_presentation?.includes("vulnerable")
      ? "一段没有完全收回去的真实"
      : "一句在夜里反复返回的短句";

  const storySetting = seaLike
    ? "临海旧城区一间即将清空的照相馆"
    : morningLike
      ? "清晨开门前的一间旧修车铺"
      : windowLike
        ? "雨夜里即将退租的一间旧公寓"
        : structureLike
          ? "闭馆后的城市档案室"
          : "打烊前的一间旧物寄存店";
  const storyTime = morningLike ? "早上六点二十分" : windowLike ? "晚上十一点零七分" : "晚上十点四十分";
  const storyObject = seaLike
    ? "一只写着你名字的牛皮纸袋"
    : morningLike
      ? "一只挂着旧钥匙的帆布包"
      : windowLike
        ? "一只从窗台夹层取出的铁盒"
        : structureLike
          ? "一只封存多年、登记在你名下的档案盒"
          : "一只没有寄件人姓名的寄存箱";
  const storyCounterpart = explicitConnection ? "那个很久没有联系、却曾和你共同保管它的人" : "曾经和你一起处理过这件东西的人";
  const storyDeadline = morningLike ? "第一位客人到店前" : "清运人员到达前的二十分钟内";
  const storySound = lowFrequency
    ? "后屋的旧音箱正循环一段没有人声的低频音乐"
    : warmPulse
      ? "门框上的风铃和远处车辆声组成了很轻的节拍"
      : "隔壁房间传来断断续续的水管声";

  return {
    entranceSpace,
    visualMotive,
    centralObject,
    soundWeather,
    hiddenWish,
    defenseGesture,
    relationDistance,
    transformedSentence,
    storySetting,
    storyTime,
    storyObject,
    storyCounterpart,
    storyDeadline,
    storySound,
    visualPromptFragment: seaLike
      ? "black tidal corridor, distant sea horizon, unsent letter, antique gold rim light"
      : morningLike
        ? "liminal morning path, tree shadow, small glowing key, deep black cosmic field"
        : windowLike
          ? "rain window room, translucent paper, dark violet interior, silver glow"
          : structureLike
            ? "quiet star-map chamber, black coordinate disk, subtle geometric lines"
            : "deep black symbolic chamber, edge-lit keepsake, silver and antique gold glow",
  };
}

function evidenceFingerprint(record: Part1Record, part2?: Part2Record) {
  const music = hasUsableMusicAnalysis(record.part1_data.aesthetics.music_analysis) ? record.part1_data.aesthetics.music_analysis : undefined;
  const social = hasUsableSocialAnalysis(record.part1_data) ? record.part1_data.narrative.social_posts_analysis ?? [] : [];
  const photo = hasUsablePhotoAnalysis(record.part1_data.narrative.precious_photo_analysis) ? record.part1_data.narrative.precious_photo_analysis : undefined;
  return [
    record.part1_data.aesthetics.core_desire_image,
    music?.primary_genres.join("|"),
    music?.emotional_tone,
    Object.entries(music?.personality_signals ?? {}).map(([key, value]) => `${key}:${value}`).join("|"),
    social.map((item) => `${item.text_content}:${item.emotional_tone}:${item.themes.join("|")}`).join("||"),
    photo?.visual_content,
    photo?.composition,
    photo?.lighting,
    photo?.color_mood,
    photo?.symbolic_elements.join("|"),
    photo?.psychological_interpretation.core_themes.join("|"),
    part2?.act2_choices.map((item) => {
      const text = getPart2ChoiceText(item);
      const signal = getPart2ChoiceTraitSignal(item);
      return text || signal ? `${text}:${signal}` : "";
    }).filter(Boolean).join("|"),
  ].filter(Boolean).join("::").toLocaleLowerCase("zh-CN");
}

function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickRotated<T>(items: T[], offset: number, count = 3) {
  if (items.length <= count) return items;
  const next: T[] = [];
  for (let index = 0; index < count; index += 1) {
    next.push(items[(offset + index) % items.length]);
  }
  return next;
}

function uniqueRecommendationItems<T extends { title?: string; author?: string; director?: string; artist?: string; album?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.title, item.author, item.director, item.artist, item.album].filter(Boolean).join("::").toLocaleLowerCase("zh-CN");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasEvidenceCue(source: string, pattern: RegExp) {
  return pattern.test(source);
}

function buildRecommendationEvidenceContext(record: Part1Record, part2?: Part2Record) {
  const source = evidenceFingerprint(record, part2);
  const music = musicMotif(record);
  const photo = photoMotif(record);
  const social = firstSocialPostText(record);
  const act2 = part2?.act2_choices.map(getPart2ChoiceText).filter(Boolean) ?? [];
  return {
    source,
    music,
    photo,
    social,
    act2Text: act2.join("、"),
    hasMusic: hasUsableMusicAnalysis(record.part1_data.aesthetics.music_analysis),
    hasPhoto: hasUsablePhotoAnalysis(record.part1_data.narrative.precious_photo_analysis),
    hash: hashString(source),
  };
}

function contextualReason(
  kind: "books" | "films" | "music",
  reason: string,
  context: ReturnType<typeof buildRecommendationEvidenceContext>,
) {
  const base = reason.replace(/。?$/u, "。");
  if (kind === "music") {
    return context.hasMusic
      ? `${base}它能承接${context.music}，适合在情绪需要慢慢归位时靠近。`
      : `${base}它适合在情绪需要慢慢归位时靠近。`;
  }
  if (kind === "films") {
    return context.hasPhoto
      ? `${base}其中的空间与距离会映照${context.photo}留下的观看方式。`
      : `${base}其中的空间与距离会映照你对边界的感受。`;
  }
  if (context.act2Text) {
    return `${base}它会把你在剧场里反复出现的靠近、停留与回望，延伸到更长的思想线上。`;
  }
  return `${base}它会延伸你对意义、时间与关系边界的追问。`;
}

export function personalizeConstellationRecommendations(
  base: PsycheConstellation["recommendations"],
  record: Part1Record,
  part2?: Part2Record,
): PsycheConstellation["recommendations"] {
  const context = buildRecommendationEvidenceContext(record, part2);
  const bookCandidates = [...base.books];
  const filmCandidates = [...base.films];
  const musicCandidates = [...base.music];

  if (hasEvidenceCue(context.source, /清晨|morning|骑车|bicycle|树影|tree|重新开始|renewal|open_path|warm_hopeful|electronic|电子|indie|独立/u)) {
    bookCandidates.unshift(
      { title: "《当下的力量》", author: "埃克哈特·托利", reason: "它把注意力从反复沉潜带回身体和当下，很适合有清晨、骑行与重新开始线索的星图。" },
      { title: "《心流》", author: "米哈里·契克森米哈赖", reason: "它能把行动、节律和专注重新接起来，回应你这次材料里更明显的现实推进感。" },
    );
    filmCandidates.unshift(
      { title: "《白日梦想家》", director: "本·斯蒂勒", reason: "它会映照从内在想象走向现实旅程的动作，贴近清晨道路和重新开始的母题。" },
      { title: "《日日是好日》", director: "大森立嗣", reason: "它把节律、身体和日常练习放在一起，适合承接这次更温暖的行动线。" },
    );
    musicCandidates.unshift(
      { artist: "Jon Hopkins", album: "Immunity", reason: "电子纹理、推进感和身体节律能承接这次歌单里更向前的能量。" },
      { artist: "Four Tet", album: "Rounds", reason: "它的颗粒感和轻盈循环会回应树影、骑行与重新开始的日常光线。" },
    );
  }

  if (hasEvidenceCue(context.source, /海|sea|ocean|夜|深夜|低光|旧|nostalgia|melancholic|post-rock|后摇|ambient|氛围|孤独|solitude/u)) {
    bookCandidates.unshift(
      { title: "《看不见的城市》", author: "伊塔洛·卡尔维诺", reason: "它把城市写成记忆、欲望和自我投射的容器，适合低光、海面与未说出口的材料。" },
      { title: "《地下室手记》", author: "陀思妥耶夫斯基", reason: "它能照见过度自省如何形成回声，也提醒你把清醒带回生活表面。" },
    );
    filmCandidates.unshift(
      { title: "《潜行者》", director: "安德烈·塔可夫斯基", reason: "它像一次缓慢进入内在禁区的长镜头，贴近海、低光和边界确认的母题。" },
      { title: "《星际穿越》", director: "克里斯托弗·诺兰", reason: "事件视界、时间和牵挂共同构成与你这次材料相近的引力语言。" },
    );
    musicCandidates.unshift(
      { artist: "Sigur Ros", album: "Agaetis byrjun", reason: "广阔、低频和微光感能承接后摇与氛围声场里的深层回响。" },
      { artist: "Jóhann Jóhannsson", album: "Orphee", reason: "它像一条从黑暗里慢慢返回的声线，适合低光、记忆和边界感更强的星图。" },
    );
  }

  const bookOffset = context.hash % Math.max(1, bookCandidates.length);
  const filmOffset = Math.floor(context.hash / 7) % Math.max(1, filmCandidates.length);
  const musicOffset = Math.floor(context.hash / 13) % Math.max(1, musicCandidates.length);

  return {
    books: pickRotated(uniqueRecommendationItems(bookCandidates), bookOffset, 3).map((item) => ({
      ...item,
      reason: contextualReason("books", item.reason, context),
    })),
    films: pickRotated(uniqueRecommendationItems(filmCandidates), filmOffset, 3).map((item) => ({
      ...item,
      reason: contextualReason("films", item.reason, context),
    })),
    music: pickRotated(uniqueRecommendationItems(musicCandidates), musicOffset, 3).map((item) => ({
      ...item,
      reason: contextualReason("music", item.reason, context),
    })),
  };
}

function visibleTheme(value: string) {
  return VISIBLE_THEME_LABELS[value] ?? (/[一-龥]/u.test(value) ? value : "未命名的内在主题");
}

export function generateDeterministicTheaterScript(record: Part1Record): TheaterScript {
  const cinema = getSelectedText("A4_cinema", record.part1_data.aesthetics.cinema);
  const themes = record.aggregated_traits.core_themes;
  const archetype = getCoreArchetype(record);
  const visibleArchetype = getBenyuanArchetypeProfile(archetype).archetype.name;
  const material = deriveTheaterMaterialReading(record);

  return {
    user_id: record.user_id,
    generated_at: new Date().toISOString(),
    personalization_summary: {
      core_archetype: visibleArchetype,
      aesthetic_style: cinema.includes("林奇") ? "梦境化的幽暗诗意" : cinema.includes("塔可夫斯基") ? "诗性的精神影像" : "内省的电影感",
      emotional_tone: record.part1_data.philosophy.emotion_pattern === "B3-2" ? "平静表面下的深流" : "象征性的沉思底色",
      key_themes: themes.map(visibleTheme),
    },
    act1: {
      scene_description: `${material.storyTime}，你赶到${material.storySetting}。这里明天就会被清空，店主半小时前给你发来消息：整理最后一批物件时，他找到${material.storyObject}，登记日期很早，领取人却一直写着你的名字。他只等到${material.storyDeadline}，之后门锁和剩下的东西都会交给清运人员。\n\n门虚掩着，街面的积水映着远处的灯。${material.storySound}。柜台上压着一张手写便条：“里面有两样东西，其中一件不该由我替你决定。”便条下面还留着一串电话号码。你认得最后四位，它属于${material.storyCounterpart}。\n\n你刚把纸袋拿起来，手机就亮了。对方没有打电话，只发来一句：“我在街对面。你先看，决定要不要见我。”与此同时，后巷传来推车碰到铁门的声音。店主提醒你，清运人员已经提前到了。\n\n你现在有二十分钟。要先弄清纸袋为什么会留在这里，也要决定今晚是否让另一个人进入这件事。门、电话和柜台上的登记簿都在你伸手可及的地方；故事从你的第一个动作开始。`,
      visual_prompt: `cinematic night at ${material.visualPromptFragment}, old shop interior, rain reflections, paper parcel on wooden counter, distant human silhouette, restrained deep black and antique gold palette, realistic photography, 16:9`,
      ambient_sound: material.visualPromptFragment.includes("sea") ? "ocean_waves_distant" : material.visualPromptFragment.includes("rain") ? "rain_soft" : "silence_deep",
      duration: 30,
    },
    act2: {
      choices: [
        {
          choice_id: 1,
          scene: `店主去后屋找封存单，门口只剩你和${material.storyObject}。街对面的人影没有移动，手机上的那句话也没有撤回。后巷的推车声越来越近，你必须先决定从哪里弄清这件事。`,
          options: [
            { id: "1A", text: "先回电话，确认是谁留下了寄存物", trait_signal: "action_entry + direct_approach", response: "店主接起电话，告诉你寄存人没有留姓名，只反复确认你会亲自来取。" },
            { id: "1B", text: "推门进去，查看柜台上的登记簿", trait_signal: "action_entry + information_first", response: "登记簿最后一页有两种笔迹，其中一行被划掉，却还看得出原来的日期。" },
            { id: "1C", text: "把地址发给朋友，请他在门外等你", trait_signal: "action_entry + relational_support", response: "朋友回了一个定位，并说十分钟后到。你不再需要独自处理现场。" },
            { id: "1D", text: "绕到侧门，确认屋里是否还有人", trait_signal: "action_entry + cautious_scan", response: "侧门没有上锁，门后放着一把湿伞，说明有人比你更早进过这里。" },
          ],
        },
        {
          choice_id: 2,
          scene: `纸袋里装着一张旧照片和一把小钥匙。照片背面写着今天的日期，钥匙则能打开柜台下方的抽屉。街对面的人又发来一句：“照片是我放进去的，钥匙不是。”你抬头时，TA 已经走到门外，但停在雨棚边，没有自行进来。`,
          options: [
            { id: "2A", text: "请对方进来，当面把事情说清", trait_signal: "object_distance + direct_contact", response: "TA 进门后先把湿伞放远，没有碰桌上的东西，只解释了照片的来处。" },
            { id: "2B", text: "走到街对面，只先问一个问题", trait_signal: "object_distance + bounded_contact", response: "你们隔着一张空桌坐下。对方回答了那个问题，没有顺势要求更多。" },
            { id: "2C", text: "发一张现场照片，等对方先开口", trait_signal: "relationship_mirror_need + reciprocal_signal", response: "对方看完照片，发来一段短语音。TA 先说了自己隐瞒的部分。" },
            { id: "2D", text: "暂时不回复，先看完纸袋里的东西", trait_signal: "object_distance + delayed_contact", response: "门外的人没有催促。纸袋底部还有一张折过两次的收据，地点离这里很远。" },
          ],
        },
        {
          choice_id: 3,
          scene: `钥匙打开了抽屉。里面有两只同样大小的盒子：一只贴着你的名字，另一只属于门外的人。清运人员开始敲后门，店主说只能再留十分钟。两只盒子可以一起带走，也可以在这里分开，但今晚之后不会再有这个中立的保管处。`,
          options: [
            { id: "3A", text: "带走两只盒子，明天再逐一归还", trait_signal: "desire_structure + temporary_control", response: "店主把两只盒子装进同一个袋子。门外的人看见了，但没有阻止你。" },
            { id: "3B", text: "只拿属于你的，把另一只留在柜台", trait_signal: "boundary_integrity + separate_ownership", response: "你的盒子比想象中轻。另一只留在原处，等待它的主人自己伸手。" },
            { id: "3C", text: "请对方进来，你们一起决定归属", trait_signal: "desire_structure + joint_decision", response: "你们第一次同时站到抽屉前。店主把清单推过来，让两个人各自签名。" },
            { id: "3D", text: "拍下现状后全部放回，今晚先离开", trait_signal: "boundary_integrity + defer_commitment", response: "照片保存了盒子的位置和封条。店主同意把抽屉单独锁到明早。" },
          ],
        },
        {
          choice_id: 4,
          scene: `清运车的灯照进门口，最后五分钟开始倒数。对方终于说，盒子里真正需要处理的不是旧物，而是一份当年没有共同签下的决定。现在你们都在场，店主也愿意作证；你必须给今晚一个明确的收尾。`,
          options: [
            { id: "4A", text: "把那份决定交给对方，当面说出实情", trait_signal: "defense_style + direct_expression", response: "对方接过文件，没有立即回答。至少这一次，事情停在了两个人都看得见的地方。" },
            { id: "4B", text: "带走自己的部分，约定明晚再谈", trait_signal: "time_gravity + planned_reentry", response: "你们在同一张便条上写下时间。延期不再是消失，而是一段有尽头的等待。" },
            { id: "4C", text: "请店主继续保管，并写下回复日期", trait_signal: "defense_style + structured_delay", response: "店主封好抽屉，把日期写在两张收据上。决定被推迟，但没有被抹去。" },
            { id: "4D", text: "先把所有物品转到安全处，停止争论", trait_signal: "meaning_orientation + practical_containment", response: "你们一起把箱子搬离门口。今晚先保住事实，剩下的话留到不必争抢时间的时候。" },
          ],
        },
      ],
    },
    act3: {
      scene_description: "清运人员停在门外，店主把最后一页登记簿推到你面前。刚才的行动已经留下清楚记录，等待你辨认其中最真实的原因。",
      mirror_questions: [
        {
          question_id: 1,
          dialogue: `${material.transformedSentence}还留在便条背面。它不要求你解释，只帮你辨认：刚才你保留或靠近时，最接近哪一种原因？`,
          question: "刚才的选择，更像是因为什么？",
          options: [
            { id: "3A-1", text: "我想被真正听懂，但不想被急着解释", trait_signal: "relationship_need + being_understood_desire" },
            { id: "3A-2", text: "我需要先确认自己的感受，再决定怎么说", trait_signal: "self_exploration + existential_anxiety" },
            { id: "3A-3", text: "我想先确认这件事不会打乱我的边界", trait_signal: "security_need + anxiety_tendency" },
            { id: "3A-4", text: "我更想保留一点自由，不被任何答案固定住", trait_signal: "freedom_desire + rebelliousness" },
            { id: "3A-5", text: "我在意它是否真的有意义，而不只是情绪", trait_signal: "meaning_seeking + philosophical" },
            { id: "3A-6", text: "我需要先把心里的波动放稳，再继续靠近", trait_signal: "peace_need + emotional_regulation" },
            { id: "3A-7", text: "我还不确定，只能先承认它确实影响了我", trait_signal: "uncertainty_tolerance + confusion" },
          ],
        },
        {
          question_id: 2,
          dialogue: "照片翻到背面，细小裂纹把时间分成几层。过去、现在、未来，还有别人看你的方式，都在轻轻拉住你。",
          question: "此刻最牵动你的，是哪一部分？",
          options: [
            { id: "3B-1", text: "先看我总会回头想起的那部分过去", trait_signal: "regret_tendency + past_oriented" },
            { id: "3B-2", text: "先看我现在真正想改变的现实处境", trait_signal: "present_dissatisfaction + action_willingness" },
            { id: "3B-3", text: "先看我对未来最放不下的不确定感", trait_signal: "anxiety_tendency + future_oriented" },
            { id: "3B-4", text: "先看我为什么会在意别人怎么看我", trait_signal: "external_validation_need + social_anxiety" },
            { id: "3B-5", text: "先看我对自己最难放松的那一面", trait_signal: "self_acceptance_difficulty + inner_conflict" },
            { id: "3B-6", text: "先看我怎样在矛盾里仍然保持平静", trait_signal: "acceptance_tendency + present_satisfaction" },
          ],
        },
      ],
      mirror_final_words: "店主合上登记簿。刚才的选择已经成为一条可以继续追踪的记录。",
    },
    epilogue: {
      scene_description: "卷帘门落下之前，你带着自己的决定走回街上。照片、钥匙、盒子和那段对话没有消失，它们只是从一桩旧事，变成了接下来可以继续处理的现实。",
      closing_text: "故事在这里停笔，你刚才留下的行动将进入精神星图。",
      transition_prompt: "正在绘制你的精神星图...",
      transition_animation: "stars_converging",
    },
  };
}

function resolvedTheaterTraitSignals(part2?: Part2Record) {
  if (!part2) return [];
  return part2.act2_choices
    .map((choice) => getPart2ChoiceTraitSignal(choice))
    .filter(Boolean);
}

function semanticSignalScore(signals: string[], positive: RegExp, weight: number, negative?: RegExp, negativeWeight = weight) {
  return signals.reduce((score, signal) => {
    let positiveDirection = 0;
    let negativeDirection = 0;
    for (const component of parseTraitSignalComponents(signal)) {
      const normalized = component.semantic.toLocaleLowerCase("en-US");
      const direction = component.polarity === "counter" ? -1 : 1;
      if (positive.test(normalized)) positiveDirection += direction;
      if (negative?.test(normalized)) negativeDirection += direction;
    }
    return score + Math.sign(positiveDirection) * weight - Math.sign(negativeDirection) * negativeWeight;
  }, 0);
}

function buildSevenDimensionScores(record: Part1Record, part2?: Part2Record) {
  const bigFive = record.aggregated_traits.big_five;
  const signals = resolvedTheaterTraitSignals(part2);
  const time = record.part1_data.philosophy.time_orientation;
  const timeGravity = time ? Math.max(time.past, time.present, time.future) - 34 : 0;
  const pastWeight = time?.past ?? 0;
  const presentWeight = time?.present ?? 0;
  const futureWeight = time?.future ?? 0;

  return {
    openness: clampScore(bigFive.openness + futureWeight * 0.05 + semanticSignalScore(signals, /open|explor|curios|ambigu|creative|non_linear|uncertainty/u, 3)),
    independence: clampScore(100 - bigFive.extraversion + semanticSignalScore(signals, /independen|autonomy|boundary|self_preserv|self_protect|freedom/u, 4)),
    emotional_depth: clampScore(bigFive.neuroticism + pastWeight * 0.05 + (hasUsableSocialAnalysis(record.part1_data) ? 6 : 0) + semanticSignalScore(signals, /emotion|vulnerab|introspect|nostalgia|repress|tension/u, 3)),
    meaning_seeking: clampScore((bigFive.openness + bigFive.neuroticism) / 2 + Math.max(0, timeGravity) * 0.12 + semanticSignalScore(signals, /meaning|existential|philosoph|self_narrative|time_orientation|past_integration/u, 4)),
    aesthetic_sensitivity: clampScore(bigFive.openness + (hasUsablePhotoAnalysis(record.part1_data.narrative.precious_photo_analysis) ? 8 : 0) + semanticSignalScore(signals, /aesthetic|symbol|projection|image|music|creative/u, 3)),
    action_tendency: clampScore(42 + presentWeight * 0.045 + futureWeight * 0.025 + semanticSignalScore(signals, /action|agency|risk_taking|explor|approach|movement|meaning_to_action/u, 5, /avoid|withdraw|delay|hesitation|self_preserv|cautious/u, 3) - (record.part1_data.philosophy.decision_style === "B2-4" ? 6 : 0)),
    relationship_need: clampScore(bigFive.agreeableness + semanticSignalScore(signals, /relationship|connection|vulnerab|attachment|trust|understood|intimacy|being_seen/u, 5)),
  };
}

function dimensionIntensity(score: number) {
  if (score >= 78) return "强";
  if (score >= 60) return "稳定";
  if (score >= 44) return "中等";
  return "低显影";
}

function dimensionInterpretation(key: SevenDimensionKey, label: string, score: number) {
  const intensity = dimensionIntensity(score);
  const templates: Record<SevenDimensionKey, { conclusion: string; intention: string; blindSpot: string }> = {
    openness: {
      conclusion: "你会被尚未命名的经验吸引，尤其是能让旧自我松动的画面、作品和关系处境。",
      intention: "你潜意识里会确认新的东西能否让自己更接近真实，再决定是否进入。",
      blindSpot: "你可能把“继续理解”当成安全距离，迟迟不让某个选择真正进入现实。",
    },
    independence: {
      conclusion: "你靠近世界之前，会先检查自己还在不在自己的位置上。",
      intention: "你的防御会先保住边界，避免过快的关系或期待占满自我位置。",
      blindSpot: "你有时会把可协商的靠近误读成入侵，于是让真正合适的人也等在门外。",
    },
    emotional_depth: {
      conclusion: "你的情绪常常先沉到深处，再以一句话、一首歌或一张图的形式浮上来。",
      intention: "你潜在意图是给复杂感受找容器，不让它们粗糙地外溢，也不让别人太早定义它们。",
      blindSpot: "当你维持平静太久，别人可能只看见冷静，而看不见底下已经很重的潮汐。",
    },
    meaning_seeking: {
      conclusion: "你做选择时不只问有没有用，更问它能否让生活变得更准确。",
      intention: "你的欲望结构里有很强的“意义过滤”：没有内在理由的靠近，很难真正说服你。",
      blindSpot: "你可能把意义门槛设得太高，让一些本可以先试试的小路被过早排除。",
    },
    aesthetic_sensitivity: {
      conclusion: "你会用光线、语气、构图和氛围判断一件事是否真实。",
      intention: "这像一种投射能力：你把难以直说的内在经验放到画面和声音里，再从它们那里读回自己。",
      blindSpot: "美感会帮你保存真实，也可能替现实延后命名，让你停在“感到很对”却不行动的位置。",
    },
    action_tendency: {
      conclusion: "你会在确认轨道后，用一个小动作打破等待。",
      intention: "你的潜在意图是用可控行动抵消空白，不让不确定性长期占据身体。",
      blindSpot: "如果动作只是为了缓解焦虑，它会很快失去方向；你需要确认这一步服务的是愿望，而不只是逃离等待。",
    },
    relationship_need: {
      conclusion: "你看重能理解边界、慢速和未说出口部分的回应。",
      intention: "在客体关系层面，你反复确认靠近能否保留自己的完整性。",
      blindSpot: "你可能太擅长把需要藏成独立，让别人误以为你并不期待被回应。",
    },
  };
  const template = templates[key];
  return `结论：${label}${intensity}显影，${template.conclusion} 潜在防御：${template.intention} 盲点：${template.blindSpot}`;
}

function buildDeterministicCoreTensions(
  archetypeHint: string,
  selectedRelationshipPhilosophy: string,
): PsycheConstellation["core_tensions"] {
  const relationshipTrace = `你在关系里会${selectedRelationshipPhilosophy}`;

  if (archetypeHint === "rational_builder") {
    return [
      {
        tension_id: 1,
        name: "结构秩序与情绪流动的张力",
        description: `你很擅长用结构、方法和节律来稳定自己，这让你在复杂情境中保持清醒；但同一套能力也可能让你先整理感受，再真正进入感受。${relationshipTrace}，说明你珍视清晰边界，却也会因此延后某些更直接的情绪交换。`,
        growth_direction: "给情绪保留不必立刻被解释的空间，让秩序成为承接体验的容器，而不是体验本身的替代品。",
      },
      {
        tension_id: 2,
        name: "远景规划与当下弹性的张力",
        description: "你天然会把很多事放进更长的时间轴里思考，这带来方向感，也可能让现在的试错显得不够完美。于是你容易在框架还没完全成形前，暂时按下行动。",
        growth_direction: "把长期意义拆成可实验的小单位，让未来导向继续存在，但不再压缩当下的灵活性。",
      },
    ];
  }

  if (archetypeHint === "gentle_guardian") {
    return [
      {
        tension_id: 1,
        name: "照顾他人与自我保全的张力",
        description: `你很容易感知他人的需要，也愿意提供温度与托举；但当你习惯于${selectedRelationshipPhilosophy}时，可能会把自己的疲惫和真实需求放到更后面。`,
        growth_direction: "把照顾建立在自我可持续之上，先确认自己的容量，再决定愿意给予多少。",
      },
      {
        tension_id: 2,
        name: "稳定安全与真实表达的张力",
        description: "你珍惜安稳、熟悉和低冲突的关系环境，这使你能创造安全感；可一旦太在意维持平衡，某些真正尖锐的感受就容易被你温柔地包起来，而不是直接说出来。",
        growth_direction: "把真实表达视为更深层的稳定来源，而不是对稳定的破坏。",
      },
    ];
  }

  if (archetypeHint === "existential_wanderer") {
    return [
      {
        tension_id: 1,
        name: "自由移动与稳定归属的张力",
        description: `你需要流动、变化和未被过早定义的空间，但${relationshipTrace}，又说明你并没有放弃被理解、被接住和被记住的需要。`,
        growth_direction: "把归属感理解为可以被协商的现实经验，而不是会立刻把你固定住的牢笼。",
      },
      {
        tension_id: 2,
        name: "意义追问与现实承重的张力",
        description: "你很难满足于表面答案，总会继续追问事情真正意味着什么；可一旦长期停在追问里，现实节律、身体感和具体推进就容易被压缩。",
        growth_direction: "让提问继续存在，同时为它安排现实落点，让生活先稳住，再继续往深处走。",
      },
    ];
  }

  if (archetypeHint === "melancholic_poet") {
    return [
      {
        tension_id: 1,
        name: "情绪密度与现实节律的张力",
        description: `你会把感受保留得很深，所以${relationshipTrace}，并不只是边界选择，也是在说明你需要更长的时间，才愿意把真实交出来。`,
        growth_direction: "不要把情绪深度当成行动的对立面，而是给它一个能进入现实日程的出口。",
      },
      {
        tension_id: 2,
        name: "诗意表达与自我保护的张力",
        description: "你能把复杂感受转成细腻语言，但也会因此更清楚暴露真实有多冒险，于是表达常常比感受晚一步。",
        growth_direction: "练习半成品表达，让真实先出现一点，而不是等完全定稿后再开口。",
      },
    ];
  }

  return [
    {
      tension_id: 1,
      name: "精神独行与被理解渴望的张力",
      description: `你习惯沿着自己的精神路径往深处走，也因此对关系质量有很高要求。${relationshipTrace}，说明你不会轻易让任何人进入，但真正的孤独并不来自无人同行，而是来自很少有人能跟上你的内在密度。`,
      growth_direction: "尝试把内在世界打开一小部分给值得的人，让理解通过具体表达发生，而不只停留在期待里。",
    },
    {
      tension_id: 2,
      name: "自我沉潜与现实落地的张力",
      description: "你天生会被意义、象征、夜晚和无法立刻说清的感受吸引，这让你拥有稀有的精神纵深；但如果长期停留在内在沉潜，现实中的节奏、推进与行动就可能变得迟缓。",
      growth_direction: "把深度感受转译成现实中的微小动作，让精神世界和现实生活之间形成来回流动。",
    },
  ];
}

const dimensionLabelMap: Record<string, string> = {
  openness: "潜意识开放度",
  independence: "边界完整度",
  emotional_depth: "情绪沉潜度",
  meaning_seeking: "意义欲望",
  aesthetic_sensitivity: "象征感受力",
  action_tendency: "现实落地力",
  relationship_need: "客体联结需求",
};

function formatJoined(values: string[], fallback: string) {
  const next = values.filter((value) => value && value.trim().length > 0);
  return next.length > 0 ? next.join("、") : fallback;
}

function formatThemeSummary(values: string[]) {
  return formatJoined(values.map(visibleTheme), "意义欲望、象征感受力与关系边界");
}

function trimTerminalPunctuation(value: string) {
  return value.trim().replace(/[。！？!?；;，,、\s]+$/gu, "");
}

function pickTopDimensionLabels(scores: Record<string, number>) {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => dimensionLabelMap[key] ?? key)
    .join("、");
}

const personalizedNameByArchetype: Record<string, string[]> = {
  lone_seeker: ["未寄之信的守夜人", "远潮边的回声体", "暗金潮汐的携信者"],
  melancholic_poet: ["雨窗后的译梦者", "低光诗页的保存者", "旧潮声里的抄写人"],
  existential_wanderer: ["无名路口的追问者", "漂移星路的问渡人", "远方裂隙的行旅者"],
  rational_builder: ["冷星图上的筑序者", "银线结构的校准者", "长夜秩序的制图人"],
  gentle_guardian: ["月港灯下的留守者", "柔光岸线的护灯人", "安静潮汐的容器"],
  black_hole_event_horizon: ["事件视界的潜行者", "黑潮边缘的凝望者", "暗引力里的守界人"],
  nebula_weaver: ["星云褶皱的织梦者", "碎光之间的造形者", "梦尘轨道的编织人"],
  solar_corona: ["日冕边界的引燃者", "白金火环的唤醒者", "暗日光冠的行进者"],
  terrestrial_planet: ["可栖地表的守望者", "暖窗行星的筑居者", "潮湿森林的安放者"],
  deep_space_anchor: ["深空坐标的锚定者", "沉默星域的定向者", "银白边界的守航人"],
};

function pickPersonalizedName(archetypeHint: string, scores: Record<string, number>, themes: string[], part2?: Part2Record) {
  const candidates = personalizedNameByArchetype[archetypeHint] ?? personalizedNameByArchetype.lone_seeker;
  const longestPause = Math.max(
    0,
    ...(part2?.act2_choices.map((item) => item.hesitation_time ?? 0) ?? []),
  );
  const index =
    (scores.meaning_seeking >= 76 ? 1 : 0) +
    (scores.emotional_depth >= 72 ? 1 : 0) +
    (themes.includes("aesthetic_sensitivity") ? 1 : 0) +
    (longestPause >= 8 ? 1 : 0);
  return candidates[index % candidates.length];
}

function buildPersonalizedSubtitle(params: {
  scores: Record<string, number>;
  themes: string[];
  socialText: string;
  photo: string;
  music: string;
  act2Path: string[];
}) {
  const topDimension = pickTopDimensionLabels(params.scores).split("、")[0] ?? "意义欲望";
  const actTrace = params.act2Path[params.act2Path.length - 1] ?? params.act2Path[0] ?? "那次慢下来的选择";
  const socialFragment = params.socialText.length > 14 ? `${params.socialText.slice(0, 14)}...` : params.socialText;
  const photoFragment = params.photo.split("，")[0] || "一张未显影的照片";
  const actionFragment = actTrace.length > 10 ? `${actTrace.slice(0, 10)}...` : actTrace;

  return `把“${socialFragment}”与${photoFragment}收进${actionFragment}的人，核心轨道落在${topDimension}。`;
}

function buildDeterministicNarrativeOverview(params: {
  profile: ReturnType<typeof getBenyuanArchetypeProfile>;
  scores: Record<string, number>;
  themes: string[];
  selectedA1: string;
  selectedB1: string;
  selectedB2: string;
  selectedB5: string;
  resonanceMoments: string;
  socialText: string;
  photo: string;
  music: string;
  musicReading: string;
  photoReading: string;
  socialReading: string;
  act2Path: string[];
  longestPause: number;
  psychoanalyticConcepts: SelectedPsychoanalyticConcept[];
}) {
  const { profile, scores, themes, selectedA1, selectedB1, selectedB2, selectedB5, resonanceMoments, socialText, photo, music, musicReading, photoReading, socialReading, act2Path, longestPause, psychoanalyticConcepts } = params;
  const topDimensions = pickTopDimensionLabels(scores);
  const themeSummary = formatThemeSummary(themes);
  const act2PathText = formatJoined(act2Path.map(trimTerminalPunctuation), "靠近、停留与回望之间的路径");
  const supportedConcepts = psychoanalyticConcepts.filter((item) => item.evidenceBasis === "user_evidence" && item.evidence.length > 0);
  const starReading = summarizePsychoanalyticStarReading(supportedConcepts);
  const pauseTexture = longestPause >= 10
    ? "那一次停留明显慢了下来，像你在让身体先确认轨道是否真的贴合自己。"
    : longestPause >= 6
      ? "几次短暂迟疑让这条路径多了一层辨认感：你没有急着按下答案，而是在看它是否会回应你。"
      : "你的选择节奏比较连贯，像是先让直觉带路，再回头理解它。";
  const supportLine = scores.emotional_depth >= 78 && scores.meaning_seeking >= 74 && scores.action_tendency <= 58
    ? "如果这些感受已经持续压缩睡眠、食欲或日常节律，先联系可信任的人或本地专业支持，让现实生活重新变得可承受。"
    : "";

  const imageAndSoundEvidence = [
    `你把“${selectedA1}”放在核心位置。`,
    photoReading ? `${photo}也沿着同一方向留下痕迹。${photoReading}` : "",
    musicReading ? `${music}。${musicReading}` : "",
  ].filter(Boolean).join(" ");
  const socialEvidence = socialReading
    ? `“${socialText}”保留了你的表达姿态。${socialReading}`
    : "";
  const conceptParagraph = supportedConcepts.length > 0
    ? `你站在${starReading.primaryConcept}与${starReading.secondaryConcept}的交界处。你在关系里会${selectedB5}，剧场动作也持续确认边界；这条轨道更接近${starReading.starMetaphor}。${starReading.safeLine}你反复保护的是一个不愿被过早占用的自我位置；客体联结只有在保留完整性的前提下，才会真正稳定。`
    : `你在关系里会${selectedB5}，剧场动作也持续确认边界。你反复保护的是一个不愿被过早占用的自我位置；客体联结只有在保留完整性的前提下，才会真正稳定。`;

  return [
    `${imageAndSoundEvidence} 未完成、未说尽和仍在显形的部分，对你有持久的吸力。你想找到一个能容纳暗面、又把解释权留在自己手里的位置。温尼科特所说的“过渡空间”，在你这里更像由声音、图像或独处撑起的一小块缓冲地带：真实可以先在那里停留，不必立刻接受外界命名。${profile.narrativeFocus}`,
    `${socialEvidence ? `${socialEvidence} ` : ""}不确定出现时，你会${selectedB1}；欲望打乱节奏时，你会${selectedB2}。你会先用距离、克制或审美争取时间，再决定真实愿望可以出现到什么程度。这份保护守住了你的节奏，也可能让重要的需要比你预想得更晚被看见。`,
    `剧场里，你的四个动作连成了一条路径：${act2PathText}。${pauseTexture} 你会先确认光源、边界和空间形状，再让自己出现。物件、声音与距离经常先替你发言；你不自知地把“能否安全地保留自己”放在了靠近之前。`,
    conceptParagraph,
    `最有引力的轨道集中在${topDimensions}，核心主题贴近${themeSummary}。你提到的共鸣时刻是：${resonanceMoments} 你更看重连接的真实、稳定与精神密度。卡尔维诺式的城市和博尔赫斯式的迷宫，可以照亮你对时间、欲望与边界的辨认。${profile.archetype.name}落在这样的精神姿态上：靠近深处，辨认边界，再把意义带回现实。${profile.movementLens}${supportLine ? ` ${supportLine}` : ""}`,
  ].join("\n\n");
}

export function generateDeterministicConstellation(part1: Part1Record, part2?: Part2Record): PsycheConstellation {
  const scores = buildSevenDimensionScores(part1, part2);
  const themes = part1.aggregated_traits.core_themes;
  const primaryArchetypeHint = selectConstellationArchetype(part1, part2);
  const profile = getBenyuanArchetypeProfile(primaryArchetypeHint);

  const selectedA1 = getSelectedText("A1_core_image", part1.part1_data.aesthetics.core_desire_image);
  const selectedB1 = uncertaintyResponseLens(part1.part1_data.philosophy.night_thoughts);
  const selectedB2 = desireResponseLens(part1.part1_data.philosophy.decision_style);
  const selectedB5 = relationshipResponseLens(part1.part1_data.philosophy.relationship_philosophy);
  const selectedC3 = (part1.part1_data.narrative.resonance_moments ?? [])
    .map(resonanceMomentLens);
  const resonanceMoments = selectedC3.length > 0 ? selectedC3.join("、") : "独处与审美瞬间";
  const socialText = firstSocialPostText(part1);
  const photo = photoMotif(part1);
  const music = musicMotif(part1);
  const musicReading = deriveMusicPsycheReading(part1);
  const photoReading = derivePhotoPsycheReading(part1);
  const socialReading = deriveSocialPsycheReading(part1);
  const act2Path = part2?.act2_choices.map(getPart2ChoiceText).filter(Boolean) ?? [];
  const longestPause = Math.max(
    0,
    ...(part2?.act2_choices.map((item) => item.hesitation_time ?? 0) ?? []),
  );
  const personalizedName = pickPersonalizedName(primaryArchetypeHint, scores, themes, part2);
  const personalizedSubtitle = buildPersonalizedSubtitle({
    scores,
    themes,
    socialText,
    photo,
    music,
    act2Path,
  });
  const psychoanalyticConcepts = selectPsychoanalyticConceptsForPart1(part1, part2);
  const recommendations = personalizeConstellationRecommendations(profile.recommendations, part1, part2);

  return {
    user_id: part1.user_id,
    generated_at: new Date().toISOString(),
    archetype: {
      ...profile.archetype,
      personalized_name: personalizedName,
      personalized_subtitle: personalizedSubtitle,
    },
    seven_dimensions: {
      openness: {
        score: scores.openness,
        interpretation: dimensionInterpretation("openness", "潜意识开放度", scores.openness),
      },
      independence: {
        score: scores.independence,
        interpretation: dimensionInterpretation("independence", "边界完整度", scores.independence),
      },
      emotional_depth: {
        score: scores.emotional_depth,
        interpretation: dimensionInterpretation("emotional_depth", "情绪沉潜度", scores.emotional_depth),
      },
      meaning_seeking: {
        score: scores.meaning_seeking,
        interpretation: dimensionInterpretation("meaning_seeking", "意义欲望", scores.meaning_seeking),
      },
      aesthetic_sensitivity: {
        score: scores.aesthetic_sensitivity,
        interpretation: dimensionInterpretation("aesthetic_sensitivity", "象征感受力", scores.aesthetic_sensitivity),
      },
      action_tendency: {
        score: scores.action_tendency,
        interpretation: dimensionInterpretation("action_tendency", "现实落地力", scores.action_tendency),
      },
      relationship_need: {
        score: scores.relationship_need,
        interpretation: dimensionInterpretation("relationship_need", "客体联结需求", scores.relationship_need),
      },
    },
    narrative_overview: buildDeterministicNarrativeOverview({
      profile,
      scores,
      themes,
      selectedA1,
      selectedB1,
      selectedB2,
      selectedB5,
      resonanceMoments,
      socialText,
      photo,
      music,
      musicReading,
      photoReading,
      socialReading,
      act2Path,
      longestPause,
      psychoanalyticConcepts,
    }),
    core_tensions: buildDeterministicCoreTensions(primaryArchetypeHint, selectedB5),
    growth_suggestions: profile.growthSuggestions,
    recommendations,
  };
}
