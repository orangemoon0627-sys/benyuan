import { benyuanQuestionsById, getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { getBenyuanArchetypeProfile } from "@/lib/benyuan-v3-report-profile";
import { selectPsychoanalyticConceptsForPart1, summarizePsychoanalyticStarReading, type SelectedPsychoanalyticConcept } from "@/lib/benyuan-v3-psychoanalytic-concepts";
import { getTheaterAct2ChoiceText, getTheaterMirrorChoiceText } from "@/lib/benyuan-v3-theater-labels";
import type {
  AggregatedTraits,
  MusicAnalysis,
  Part1AnswerMap,
  Part1Data,
  Part1Record,
  Part2Record,
  PreciousPhotoAnalysis,
  PsycheConstellation,
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
  aesthetic_sensitivity: "审美敏感",
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
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
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

  const musicSignals = part1Data.aesthetics.music_analysis?.personality_signals;
  if (musicSignals) {
    if (musicSignals.openness === "high") totals.openness += 8;
    if (musicSignals.introversion === "medium_high") totals.extraversion -= 5;
    if (musicSignals.emotional_depth === "high") totals.neuroticism += 4;
    if (musicSignals.nostalgia === "medium") totals.neuroticism += 2;
  }

  const photoTraits = part1Data.narrative.precious_photo_analysis?.psychological_interpretation?.traits ?? [];
  if (photoTraits.includes("high_openness")) totals.openness += 6;
  if (photoTraits.includes("introversion")) totals.extraversion -= 5;
  if (photoTraits.includes("meaning_seeking")) totals.openness += 4;

  const postSignals = part1Data.narrative.social_posts_analysis?.flatMap((item) => item.psychological_signals) ?? [];
  if (postSignals.includes("high_sensitivity")) totals.neuroticism += 5;
  if (postSignals.includes("emotional_depth")) totals.openness += 3;
  if (postSignals.includes("solitary_reflection")) totals.extraversion -= 4;

  const themeCounts = countByValue(tags.map((tag) => THEME_LABELS[tag]).filter((value): value is string => Boolean(value)));
  const themePool = [
    ...Object.entries(themeCounts)
      .sort((left, right) => right[1] - left[1])
      .map(([theme]) => theme),
    ...(part1Data.narrative.social_posts_overall_pattern?.core_themes ?? []),
    ...(part1Data.narrative.precious_photo_analysis?.psychological_interpretation?.core_themes ?? []),
  ];

  const uniqueThemes = [...new Set(themePool)].slice(0, 4);
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
      (uniqueThemes.includes("meaning_seeking") ? 0.8 : 0),
    melancholic_poet:
      (bigFive.neuroticism >= 68 ? 2 : 0) +
      (uniqueThemes.includes("aesthetic_sensitivity") ? 1.1 : 0) +
      (emotionPattern === "B3-2" ? 0.8 : 0) +
      (["A1-1", "A1-6"].includes(coreImage) ? 0.7 : 0),
    existential_wanderer:
      (uniqueThemes.includes("meaning_seeking") ? 1.5 : 0) +
      (uniqueThemes.includes("existentialism") ? 1.3 : 0) +
      (bigFive.openness >= 72 ? 0.7 : 0) +
      (decisionStyle === "B2-2" ? 0.4 : 0),
    rational_builder:
      (bigFive.conscientiousness >= 68 ? 2.4 : 0) +
      (bigFive.neuroticism <= 48 ? 1.8 : 0) +
      (coreImage === "A1-3" ? 1.4 : 0) +
      (inspirationScene === "A5-2" ? 1 : 0) +
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
      (emotionPattern === "B3-7" ? 1.2 : 0) +
      (relationshipPhilosophy === "B5-3" ? 0.9 : 0),
    terrestrial_planet:
      (bigFive.conscientiousness >= 58 ? 1.1 : 0) +
      (bigFive.agreeableness >= 58 ? 1 : 0) +
      (bigFive.neuroticism <= 52 ? 0.8 : 0) +
      (hasTag("security_need", "warmth_seeking", "nature", "tranquility", "realism", "deep_connection") ? 1.8 : 0) +
      (coreImage === "A1-5" ? 1 : 0) +
      (inspirationScene === "A5-3" ? 0.8 : 0) +
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
  const corpus = inputs.map((item) => [item.visible_text, item.description, item.source].filter(Boolean).join(" ")).join(" ").toLowerCase();
  const genres = [
    corpus.includes("post-rock") || corpus.includes("后摇") ? "post-rock" : null,
    corpus.includes("ambient") || corpus.includes("氛围") ? "ambient" : null,
    corpus.includes("indie") || corpus.includes("独立") ? "indie" : null,
    corpus.includes("classical") || corpus.includes("古典") ? "classical" : null,
    corpus.includes("电子") || corpus.includes("electronic") ? "electronic" : null,
  ].filter((value): value is string => Boolean(value));

  const primary_genres = genres.length > 0 ? genres.slice(0, 3) : ["indie", "ambient", "post-rock"];
  const melancholicSignal = /(深夜|夜|雨|海|孤独|nostalgia|sad|blue|melancholy|quiet)/.test(corpus);
  const emotional_tone = melancholicSignal ? "melancholic_introspective" : "reflective_open";
  const language_diversity = [
    /(中文|mandarin|网易云)/.test(corpus) ? "chinese" : null,
    /(english|spotify|the 1975|radiohead)/.test(corpus) ? "english" : null,
    /(instrumental|纯音乐|ambient|post-rock)/.test(corpus) ? "instrumental" : null,
    /(japanese|日文)/.test(corpus) ? "japanese" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    primary_genres,
    emotional_tone,
    era_distribution: { "1990s": 20, "2000s": 35, "2010s": 45 },
    language_diversity: language_diversity.length > 0 ? language_diversity : ["chinese", "english"],
    personality_signals: {
      openness: primary_genres.includes("post-rock") || primary_genres.includes("ambient") ? "high" : "medium",
      introversion: melancholicSignal ? "medium_high" : "medium",
      emotional_depth: melancholicSignal ? "high" : "medium",
      nostalgia: /(怀旧|old|90s|2000s)/.test(corpus) ? "medium_high" : "medium",
    },
  };
}

function inferThemesFromText(text: string) {
  const source = text.toLowerCase();
  const themes = [
    /(孤独|alone|lonely)/.test(source) ? "loneliness" : null,
    /(雨|夏天|过去|曾经|记得|nostalgia)/.test(source) ? "nostalgia" : null,
    /(时间|time)/.test(source) ? "time" : null,
    /(爱|love|你)/.test(source) ? "love" : null,
    /(海|风景|树|山|自然)/.test(source) ? "nature" : null,
    /(意义|存在|为什么|exist)/.test(source) ? "meaning" : null,
  ].filter((value): value is string => Boolean(value));
  return themes.length > 0 ? themes : ["reflection", "daily_life"];
}

function inferEmotionTone(text: string) {
  if (/(雨|夜|失去|离开|旧|想起|孤独|nostalgia)/i.test(text)) return "melancholic_nostalgic";
  if (/(开心|阳光|明亮|hope|希望)/i.test(text)) return "warm_hopeful";
  return "complex_reflective";
}

export function analyzeSocialPostInputs(inputs: Array<{ visible_text?: string; source?: string; description?: string }> = []) {
  const list: SocialPostAnalysis[] = inputs.map((item, index) => {
    const text = item.visible_text?.trim() || item.description?.trim() || `第 ${index + 1} 条社交动态`;
    const themes = inferThemesFromText(text);
    return {
      post_id: index + 1,
      text_content: text,
      emotional_tone: inferEmotionTone(text),
      themes,
      expression_style: /(像|仿佛|也许|好像|雨声|夏天)/.test(text) ? "poetic_implicit" : "reflective_direct",
      self_presentation: /(我|自己|想起|真实)/.test(text) ? "authentic_vulnerable" : "curated_reflective",
      time_clue: /(深夜|凌晨|夜)/.test(text) ? "late_night_post" : "unspecified_time",
      psychological_signals: [
        themes.includes("loneliness") ? "high_sensitivity" : null,
        themes.includes("nostalgia") ? "nostalgia_tendency" : null,
        themes.includes("meaning") ? "solitary_reflection" : null,
        "emotional_depth",
      ].filter((value): value is string => Boolean(value)),
    };
  });

  const overallPattern: SocialPostOverallPattern = {
    dominant_emotion: list[0]?.emotional_tone?.split("_")[0] ?? "reflective",
    core_themes: [...new Set(list.flatMap((item) => item.themes))].slice(0, 4),
    expression_authenticity: list.some((item) => item.self_presentation === "authentic_vulnerable") ? "high" : "medium",
  };

  return { posts: list, overallPattern };
}

export function analyzePreciousPhotoInput(input?: { description?: string }): PreciousPhotoAnalysis {
  const description = input?.description?.toLowerCase() ?? "";
  const sea = /(海|sea|ocean|shore)/.test(description);
  const sunset = /(日落|sunset|橙|orange|golden)/.test(description);
  const backlit = /(逆光|backlit|silhouette|背影)/.test(description);
  const solitude = /(一个人|独自|lone|single figure)/.test(description);

  return {
    visual_content: sea && solitude ? "lone_figure_seascape_sunset" : "symbolic_landscape",
    composition: solitude ? "centered_figure_vast_background" : "balanced_symbolic_composition",
    lighting: backlit ? "backlit_silhouette" : "soft_atmospheric_light",
    color_mood: sunset ? "warm_melancholic" : "muted_contemplative",
    symbolic_elements: [sea ? "sea" : null, sunset ? "sunset" : null, /(天|sky|horizon)/.test(description) ? "horizon" : null, solitude ? "solitude" : null, "vastness"].filter((value): value is string => Boolean(value)),
    psychological_interpretation: {
      core_themes: [sea ? "solitude" : "reflection", sunset ? "freedom" : "contemplation", "meaning_seeking", "aesthetic_sensitivity"],
      emotional_tone: sunset ? "peaceful_yet_melancholic" : "quietly_reflective",
      self_concept: solitude ? "lone_seeker" : "sensitive_observer",
      existential_stance: sea ? "facing_infinity" : "standing_within_symbolic_space",
      traits: ["high_openness", solitude ? "introversion" : null, "aesthetic_sensitivity", "meaning_seeking", "comfortable_with_solitude"].filter((value): value is string => Boolean(value)),
    },
  };
}

function getSelectedText(questionId: string | undefined, optionId: string | undefined) {
  if (!questionId || !optionId) return optionId ?? "";
  return getQuestionOption(questionId, optionId)?.text ?? optionId;
}

function getCoreArchetype(record: Part1Record) {
  return record.aggregated_traits.archetype_hints[0] ?? "lone_seeker";
}

function firstSocialPostText(record: Part1Record) {
  return record.part1_data.narrative.social_posts_analysis?.[0]?.text_content || "那句你曾经留下的话";
}

function photoMotif(record: Part1Record) {
  const photo = record.part1_data.narrative.precious_photo_analysis;
  if (!photo) return "一张尚未显影的照片";
  const visual = visiblePhotoTerm(photo.visual_content) ?? "一张带着远景与留白的照片";
  const symbols = photo.symbolic_elements.map((item) => visiblePhotoTerm(item)).filter((item): item is string => Boolean(item));
  return `${visual}，里面有${symbols.length > 0 ? symbols.join("、") : "光、距离与未说出口的时间"}`;
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
  symbolic_landscape: "带有象征感的风景",
  moon: "月光",
  sea: "海面",
  ocean: "海面",
  shore: "岸线",
  sunset: "日落",
  horizon: "地平线",
  solitude: "独处感",
  vastness: "辽阔感",
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
  return PHOTO_TERM_LABELS[normalized] ?? (/[一-龥]/u.test(value ?? "") ? (value ?? "").trim() : null);
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
  if (!music) return "一段像从远处潮汐里浮起的低频回声";
  const genres = [...new Set(music.primary_genres.map(visibleMusicGenre).filter((item): item is string => Boolean(item)))];
  const tone = visibleMusicTone(music.emotional_tone) ?? "带着尚未完全显影的情绪底色";
  if (genres.length === 0) return `一段辨认不清却仍有温度的声音线索，${tone}`;
  return `${genres.slice(0, 3).join("、")}交织成一条声音线，${tone}`;
}

function visibleTheme(value: string) {
  return VISIBLE_THEME_LABELS[value] ?? (/[一-龥]/u.test(value) ? value : "未命名的内在主题");
}

export function generateDeterministicTheaterScript(record: Part1Record): TheaterScript {
  const coreImage = getSelectedText("A1_core_image", record.part1_data.aesthetics.core_desire_image);
  const cinema = getSelectedText("A4_cinema", record.part1_data.aesthetics.cinema);
  const scene = getSelectedText("A5_inspiration_scene", record.part1_data.aesthetics.inspiration_scene);
  const decision = getSelectedText("B2_decision_style", record.part1_data.philosophy.decision_style);
  const emotion = getSelectedText("B3_emotion_pattern", record.part1_data.philosophy.emotion_pattern);
  const relation = getSelectedText("B5_relationship_philosophy", record.part1_data.philosophy.relationship_philosophy);
  const socialText = firstSocialPostText(record);
  const photo = photoMotif(record);
  const music = musicMotif(record);
  const themes = record.aggregated_traits.core_themes;
  const archetype = getCoreArchetype(record);
  const visibleArchetype = getBenyuanArchetypeProfile(archetype).archetype.name;

  return {
    user_id: record.user_id,
    generated_at: new Date().toISOString(),
    personalization_summary: {
      core_archetype: visibleArchetype,
      aesthetic_style: cinema.includes("林奇") ? "梦境化的幽暗诗意" : cinema.includes("塔可夫斯基") ? "诗性的精神影像" : "内省的电影感",
      emotional_tone: emotion.includes("深海") ? "深海般的内省诗意" : "象征性的沉思底色",
      key_themes: themes.map(visibleTheme),
    },
    act1: {
      scene_description: `你醒来时，站在一片很深的月场边缘。远处的黑色天体缓慢转动，边缘有一圈暗金色的光，像从“${coreImage}”里抽出的引力。脚下不是地面，而是一层半透明的潮水；潮水下压着一张照片的轮廓：${photo}。\n\n空气里有${music}。它不是背景乐，更像这个空间自己的呼吸。某处传来一句低低的回声：“${socialText}” 这句话没有被解释，只是在你身边绕了一圈，落成一条通向前方的细线。\n\n你身后保留着“${scene}”的节律，前方则像被“${cinema}”的镜头慢慢推近。一封没有寄出的信浮在潮水上，信封背面有照片里的光，旁边还有几颗暗金粒子沿着同一个位置反复靠近。\n\n你意识到，这不是为了让你回答问题而临时搭出来的场景。它更像前面那些画面、声音、句子和停顿，被折成了一段只能由你继续往下走的小说。你只需要沿着第一条细线靠近，看看它会把你带到哪里。`,
      visual_prompt: `deep black moon field, dark celestial body with antique gold rim light, translucent tidal floor, photo trace motif ${photo}, cinematic atmosphere inspired by ${cinema}, quiet immersive iPhone app scene, low saturation, silver glow, 16:9`,
      ambient_sound: coreImage.includes("海") ? "ocean_waves_distant" : coreImage.includes("雨") ? "rain_soft" : "silence_deep",
      duration: 30,
    },
    act2: {
      choices: [
        {
          choice_id: 1,
          scene: `第一幕留下的那句话还在潮水上漂着。你往前走，发现它被折成一封没有寄出的信，信封背面有照片里的光。你的身体按照“${decision}”的方式先做出反应，而情绪像“${emotion}”一样在水下慢慢移动。`,
          options: [
            { id: "1A", text: "靠近那封信，让潮水先读出第一行", trait_signal: "action_oriented + intuitive + risk_taking", response: "信封没有打开，只是变得更轻。你听见里面有一小段声音，像答案还没准备好，却已经承认你来了。" },
            { id: "1B", text: "停下脚步，先看清信封背面的光", trait_signal: "analytical + cautious + risk_aware", response: "那束光没有催你。它沿着照片里的轮廓慢慢亮起，让你知道辨认本身也是一种靠近。" },
            { id: "1C", text: "沿着回声回应一句话，再等它回来", trait_signal: "relationship_oriented + openness + trust_tendency", response: "你的声音落进月场，过了一会儿才回来。它不是原样返回，而是多了一点像他人的温度。" },
            { id: "1D", text: "绕开信封，先把自己的影子带到前面", trait_signal: "independent + self_protective + avoidant_attachment", response: "影子比你先穿过那圈光。你没有丢下信，只是暂时不让它决定你的方向。" },
          ],
        },
        {
          choice_id: 2,
          scene: `信的纸面化成一条窄桥。桥的另一端站着一个模糊的人影，像从“${relation}”里显出来的距离。TA 没有说话，只把那张照片推到桥中央，等你决定要不要共享这段光。`,
          options: [
            { id: "2A", text: "停下脚步，看那个人如何对待照片", trait_signal: "boundary + selective_social + discernment", response: "TA 没有急着拿走它，只把照片转向月光。你发现，真正的距离不是远近，而是对方是否懂得轻放。" },
            { id: "2B", text: "走向桥中央，把照片推回一点点", trait_signal: "deep_connection + vulnerability + connection_need", response: "照片在你们之间停住。你没有交出全部，只交出一角；但这一角已经足够让桥下的潮声变浅。" },
            { id: "2C", text: "留在并肩的位置，让同一段声音流过你们", trait_signal: "quiet_intimacy + reflective_attachment + emotional_depth", response: "没有人解释那段声音。它从你们中间穿过时，反而让沉默变得可以共同承担。" },
            { id: "2D", text: "回望来路，把桥暂时留给月光", trait_signal: "avoidant_attachment + self_preservation + autonomy", response: "桥没有消失。你只是把它留在身后，像承认某些靠近需要晚一点，才不会变成失去自己。" },
          ],
        },
        {
          choice_id: 3,
          scene: `桥尽头出现一枚小小的黑色星体。它没有吞没任何东西，只把信、照片、声音和那个人影缓慢拉成同一条轨道。你能感觉到，这里逼近的不是答案，而是你一直怎样保存自己。`,
          options: [
            { id: "3A", text: "把信收进口袋，先让轨道稳定下来", trait_signal: "security_need + stabilization + emotional_regulation", response: "星体的光慢了一点。你把稳定当成容器，而不是退路；有些远方必须先有地方安放。" },
            { id: "3B", text: "伸手触碰星体边缘，允许未知靠近", trait_signal: "freedom_desire + openness + exploration", response: "你的手没有被吞没，只沾上一层银色的冷光。未知没有回答你，却让你更清楚自己仍愿意继续。" },
            { id: "3C", text: "留在两股引力之间，听它们同时说话", trait_signal: "tension_tolerance + introspection + ambiguity_capacity", response: "两股引力没有互相抵消。它们像两条潮线，提醒你有些真实本来就不只朝一个方向。" },
            { id: "3D", text: "沿着暗金轨道，寻找没有标出的出口", trait_signal: "creative_reframing + independence + non_linear_thinking", response: "轨道在你脚下分出第三条细线。它很窄，却贴合你的步子，像专门为不愿二选一的人留下。" },
          ],
        },
        {
          choice_id: 4,
          scene: `黑色星体把信、照片、声音和那个人影压成一枚很小的月。星图还没有开始命名你，它先停在最后一道门前：如果要把这些线索交给它，你更愿意让它先看见哪一层？`,
          options: [
            { id: "4A", text: "把那些总会回来的旧画面交给星图", trait_signal: "self_narrative + time_orientation + past_integration", response: "旧画面没有把你困住，它只是把你反复回望的方向照亮，让星图知道从哪里开始读你。" },
            { id: "4B", text: "把迟迟没有说出口的靠近放进月光里", trait_signal: "desire_structure + indirect_expression + vulnerable_wish", response: "那件事没有立刻变亮，却在暗处多了一圈清晰的边，像终于被允许拥有一个位置。" },
            { id: "4C", text: "把保护自己的边界放到暗金轨道上", trait_signal: "object_distance + boundary + self_preservation", response: "暗金轨道贴近了一点，像承认边界不是拒绝，而是让靠近可以持续的一种方式。" },
            { id: "4D", text: "把犹豫之后仍会前行的那一步交给桥", trait_signal: "action_after_hesitation + agency + meaning_to_action", response: "桥的尽头出现了下一步台阶，不宽，但足够让你带着迟疑继续前行。" },
          ],
        },
      ],
    },
    act3: {
      scene_description: "黑色星体慢慢展开，信、照片、那段声音和桥上的人影都停在同一圈暗金轨道里。接下来不是继续猜谜，而是把刚才的选择往里问一点：你为什么靠近、为什么停下，又在保护什么。",
      mirror_questions: [
        {
          question_id: 1,
          dialogue: `那句“${socialText}”被潮声重新送回来。它不要求你解释，只帮你辨认：刚才你保留或靠近时，最接近哪一种原因？`,
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
          question: "如果要更准确地理解你，星图应该先看哪一部分？",
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
      mirror_final_words: "追问没有替你下结论，只把刚才的选择收成一枚很小的月。它落进你掌心，像在说：你带走的不是标准答案，而是一条更接近自己的轨道。",
    },
    epilogue: {
      scene_description: "黑色星体退到更深处，桥、信、照片和声音一层层淡下去，只剩暗金轨道还在。你沿着它回到最初的月场，发现入口没有关闭，只是变成了一张正在生成的精神星图。",
      closing_text: "这一幕没有结束，它只是换成了星体的语言。现在，星图开始显影。",
      transition_prompt: "正在绘制你的精神星图...",
      transition_animation: "stars_converging",
    },
  };
}

function choiceWeight(choiceId: string | undefined) {
  if (!choiceId) return 0;
  if (/[AB]-1$/.test(choiceId) || choiceId.endsWith("A") || choiceId.endsWith("B")) return 6;
  return 3;
}

function buildSevenDimensionScores(record: Part1Record, part2?: Part2Record) {
  const bigFive = record.aggregated_traits.big_five;
  const selectedMirror = part2?.act3_responses.map((item) => item.selected) ?? [];
  const selectedChoices = part2?.act2_choices.map((item) => item.selected) ?? [];

  return {
    openness: clampScore(bigFive.openness + (selectedChoices.includes("3D") ? 5 : 0)),
    independence: clampScore(100 - bigFive.extraversion + (selectedChoices.includes("2D") ? 6 : 0)),
    emotional_depth: clampScore(bigFive.neuroticism + (record.part1_data.narrative.social_posts_analysis ? 6 : 0)),
    meaning_seeking: clampScore((bigFive.openness + bigFive.neuroticism) / 2 + (selectedChoices.includes("4A") ? 8 : 0) + (selectedChoices.includes("4D") ? 6 : 0) + (selectedMirror.includes("3A-5") ? 6 : selectedMirror.includes("3A-2") ? 4 : 0)),
    aesthetic_sensitivity: clampScore(bigFive.openness + (record.part1_data.narrative.precious_photo_analysis ? 8 : 0)),
    action_tendency: clampScore(42 + selectedChoices.reduce((sum, current) => sum + choiceWeight(current), 0) - (record.part1_data.philosophy.decision_style === "B2-4" ? 6 : 0)),
    relationship_need: clampScore(bigFive.agreeableness + (selectedChoices.includes("2B") ? 9 : 0) + (selectedChoices.includes("4B") ? 6 : 0) + (selectedChoices.includes("4C") ? 4 : 0) + (selectedMirror.includes("3A-1") ? 4 : 0)),
  };
}

function dimensionInterpretation(label: string, score: number, text: string) {
  return `${label}${score >= 75 ? "很高" : score >= 55 ? "处于中高段" : score >= 40 ? "处于中段" : "偏低"}。${text}`;
}

function buildDeterministicCoreTensions(
  archetypeHint: string,
  selectedRelationshipPhilosophy: string,
): PsycheConstellation["core_tensions"] {
  const relationshipTrace = `你在关系里选择“${selectedRelationshipPhilosophy}”这条距离线`;

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
        description: `你很容易感知他人的需要，也愿意提供温度与托举；但当“${selectedRelationshipPhilosophy}”成为默认姿态时，你可能会把自己的疲惫和真实需求放到更后面。`,
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
  openness: "开放性",
  independence: "独立性",
  emotional_depth: "情感深度",
  meaning_seeking: "意义追寻",
  aesthetic_sensitivity: "审美敏感",
  action_tendency: "行动力",
  relationship_need: "关系需求",
};

const themeLabelMap: Record<string, string> = {
  meaning_seeking: "意义追问",
  solitude: "独处重力",
  aesthetic_sensitivity: "审美感应",
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
};

function formatJoined(values: string[], fallback: string) {
  const next = values.filter((value) => value && value.trim().length > 0);
  return next.length > 0 ? next.join("、") : fallback;
}

function formatThemeSummary(values: string[]) {
  return formatJoined(values.map((value) => themeLabelMap[value] ?? value), "意义追寻、审美敏感与关系边界");
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
    ...(part2?.act3_responses.map((item) => item.hesitation_time ?? 0) ?? []),
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
  mirrorPath: string[];
}) {
  const topDimension = pickTopDimensionLabels(params.scores).split("、")[0] ?? "意义追寻";
  const actTrace = params.act2Path[params.act2Path.length - 1] ?? params.act2Path[0] ?? params.mirrorPath[0] ?? "那次慢下来的选择";
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
  act2Path: string[];
  mirrorPath: string[];
  longestPause: number;
  psychoanalyticConcepts: SelectedPsychoanalyticConcept[];
}) {
  const { profile, scores, themes, selectedA1, selectedB1, selectedB2, selectedB5, resonanceMoments, socialText, photo, music, act2Path, mirrorPath, longestPause, psychoanalyticConcepts } = params;
  const topDimensions = pickTopDimensionLabels(scores);
  const themeSummary = formatThemeSummary(themes);
  const act2PathText = formatJoined(act2Path, "靠近、停留与回望之间的路径");
  const finalAct2Choice = act2Path[3] ?? act2Path[act2Path.length - 1] ?? "";
  const mirrorPathText = formatJoined(mirrorPath, "把问题交还给自己");
  const starReading = summarizePsychoanalyticStarReading(psychoanalyticConcepts);
  const pauseTexture = longestPause >= 10
    ? "那一次停留明显慢了下来，像你在让身体先确认轨道是否真的贴合自己。"
    : longestPause >= 6
      ? "几次短暂迟疑让这条路径多了一层辨认感：你没有急着按下答案，而是在看它是否会回应你。"
      : "你的选择节奏比较连贯，像是先让直觉带路，再回头理解它。";
  const supportLine = scores.emotional_depth >= 78 && scores.meaning_seeking >= 74 && scores.action_tendency <= 58
    ? "如果最近这些感受已经持续压缩睡眠、食欲或日常节律，先把现实照料放到前面，联系可信任的人或本地专业支持，并不意味着你变得脆弱，只是说明你愿意让自己先被接住。"
    : "";

  return [
    `当你把“${selectedA1}”选为核心意象时，星图里最先亮起的是月相边缘：一半显露，一半保留。荣格会把这种反复辨认称作个体化的入口，不是变得特殊，而是把散落的自己慢慢收回同一条轨道。${profile.narrativeFocus}`,
    `你的证据并不抽象：那句“${socialText}”、${photo}，以及${music}，都像同一个黑色天体周围的碎光。它们说明你不是被宏大词语打动，而是会从一句话、一张图、一段声音里确认：这里有我的一部分。`,
    `在思维方式上，你更靠近“${selectedB1}”与“${selectedB2}”。这不是简单的直觉或犹豫，而像加缪式的清醒：先承认世界并不会自动给出意义，再用身体和时间去试探什么仍然值得靠近。`,
    `如果把这些线索放进精神分析式阅读里，它们更像${starReading.primaryConcept}与${starReading.secondaryConcept}交界处的运动，而不是一个固定标签。你在“${selectedB5}”里保留距离，在剧场里又先${act2PathText}，这让星图显出${starReading.starMetaphor}：${starReading.safeLine}这不是缺陷，也不是冷淡，而是你让靠近变得可持续的内在秩序。`,
    mirrorPath.length > 0
      ? `剧场里，你先${act2PathText}；历史追问里，又选择${mirrorPathText}。${pauseTexture} 这条行动轨迹把社交文本里的“没有寄出的信”、照片里的海与逆光、音乐里的低频深流接到一起：你不是只想被理解，也在寻找一种不会过早占有你的理解。`
      : `剧场四轮里，你先${act2PathText}${finalAct2Choice ? `；最后又把星图的入口交给“${finalAct2Choice}”` : ""}。${pauseTexture} 这条行动轨迹把社交文本里的“没有寄出的信”、照片里的海与逆光、音乐里的低频深流接到一起：它不是额外剧情，而是在补足你如何靠近、如何保留、又如何把迟疑折成下一步。`,
    `当你在关系里选择“${selectedB5}”，一条很清楚的轨道浮现出来：${profile.relationshipLens} 温尼科特谈过“能够独处”的能力，它不是冷漠，而是在有人或无人时都不急着背叛自己。当共鸣时刻集中在${resonanceMoments}时，你要的不是更多连接，而是更真、更稳、更能保留自我的连接。`,
    `从整张精神星图来看，你的高分维度集中在${topDimensions}，核心主题贴近${themeSummary}。这让你更容易被深层文本、象征画面、微妙氛围和难以一次说清的情绪击中；卡尔维诺式的城市、博尔赫斯式的迷宫，都会成为你辨认自己的文学参照。${profile.movementLens}`,
    `${profile.closingLens}${supportLine ? ` ${supportLine}` : ""}`,
  ].join("\n\n");
}

export function generateDeterministicConstellation(part1: Part1Record, part2?: Part2Record): PsycheConstellation {
  const scores = buildSevenDimensionScores(part1, part2);
  const themes = part1.aggregated_traits.core_themes;
  const primaryArchetypeHint = getCoreArchetype(part1);
  const profile = getBenyuanArchetypeProfile(primaryArchetypeHint);

  const selectedA1 = getSelectedText("A1_core_image", part1.part1_data.aesthetics.core_desire_image);
  const selectedB1 = getSelectedText("B1_night_thoughts", part1.part1_data.philosophy.night_thoughts);
  const selectedB2 = getSelectedText("B2_decision_style", part1.part1_data.philosophy.decision_style);
  const selectedB5 = getSelectedText("B5_relationship_philosophy", part1.part1_data.philosophy.relationship_philosophy);
  const selectedC3 = (part1.part1_data.narrative.resonance_moments ?? []).map((item) => getSelectedText("C3_resonance_moments", item));
  const resonanceMoments = selectedC3.length > 0 ? selectedC3.join("、") : "独处与审美瞬间";
  const socialText = firstSocialPostText(part1);
  const photo = photoMotif(part1);
  const music = musicMotif(part1);
  const act2Path = part2?.act2_choices.map((item) => getTheaterAct2ChoiceText(item.selected) ?? item.selected).filter(Boolean) ?? [];
  const mirrorPath = part2?.act3_responses.map((item) => getTheaterMirrorChoiceText(item.selected) ?? item.selected).filter(Boolean) ?? [];
  const longestPause = Math.max(
    0,
    ...(part2?.act2_choices.map((item) => item.hesitation_time ?? 0) ?? []),
    ...(part2?.act3_responses.map((item) => item.hesitation_time ?? 0) ?? []),
  );
  const personalizedName = pickPersonalizedName(primaryArchetypeHint, scores, themes, part2);
  const personalizedSubtitle = buildPersonalizedSubtitle({
    scores,
    themes,
    socialText,
    photo,
    music,
    act2Path,
    mirrorPath,
  });
  const psychoanalyticConcepts = selectPsychoanalyticConceptsForPart1(part1, part2);

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
        interpretation: dimensionInterpretation("你的开放性", scores.openness, "你愿意让抽象、复杂、矛盾与未完成在内心停留，因此会被更深层的艺术与思想吸引。"),
      },
      independence: {
        score: scores.independence,
        interpretation: dimensionInterpretation("你的独立性", scores.independence, "你需要自己的节奏、边界和独处空间，这并不等于拒绝关系，而是拒绝低质量连接。"),
      },
      emotional_depth: {
        score: scores.emotional_depth,
        interpretation: dimensionInterpretation("你的情感深度", scores.emotional_depth, "你的情绪不是表面的起伏，而更像会在体内缓慢流动的深层回声。"),
      },
      meaning_seeking: {
        score: scores.meaning_seeking,
        interpretation: dimensionInterpretation("你的意义追寻", scores.meaning_seeking, "你很难只停留在功能性答案上，总会继续问：这件事到底意味着什么。"),
      },
      aesthetic_sensitivity: {
        score: scores.aesthetic_sensitivity,
        interpretation: dimensionInterpretation("你的审美敏感", scores.aesthetic_sensitivity, "美对你不是表面装饰，而是一种理解世界、识别真实与保存感受的方式。"),
      },
      action_tendency: {
        score: scores.action_tendency,
        interpretation: dimensionInterpretation("你的行动力", scores.action_tendency, "你并非单纯的冲动派，更像是在理解足够充分后才愿意向前迈步。"),
      },
      relationship_need: {
        score: scores.relationship_need,
        interpretation: dimensionInterpretation("你的关系需求", scores.relationship_need, "你并不追求热闹本身，而是在意是否真的被理解、被接住，以及是否还能保留自己。"),
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
      act2Path,
      mirrorPath,
      longestPause,
      psychoanalyticConcepts,
    }),
    core_tensions: buildDeterministicCoreTensions(primaryArchetypeHint, selectedB5),
    growth_suggestions: profile.growthSuggestions,
    recommendations: profile.recommendations,
  };
}
