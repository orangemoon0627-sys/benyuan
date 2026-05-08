import { benyuanQuestionsById, getQuestionOption, getQuestionOptionTags } from "@/lib/benyuan-v3-schema";
import { getBenyuanArchetypeProfile } from "@/lib/benyuan-v3-report-profile";
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

export function generateDeterministicTheaterScript(record: Part1Record): TheaterScript {
  const coreImage = getSelectedText("A1_core_image", record.part1_data.aesthetics.core_desire_image);
  const cinema = getSelectedText("A4_cinema", record.part1_data.aesthetics.cinema);
  const scene = getSelectedText("A5_inspiration_scene", record.part1_data.aesthetics.inspiration_scene);
  const decision = getSelectedText("B2_decision_style", record.part1_data.philosophy.decision_style);
  const emotion = getSelectedText("B3_emotion_pattern", record.part1_data.philosophy.emotion_pattern);
  const relation = getSelectedText("B5_relationship_philosophy", record.part1_data.philosophy.relationship_philosophy);
  const themes = record.aggregated_traits.core_themes;
  const archetype = getCoreArchetype(record);
  const visibleArchetype = getBenyuanArchetypeProfile(archetype).archetype.name;

  return {
    user_id: record.user_id,
    generated_at: new Date().toISOString(),
    personalization_summary: {
      core_archetype: visibleArchetype,
      aesthetic_style: cinema.includes("林奇") ? "surrealist_melancholic" : cinema.includes("塔可夫斯基") ? "poetic_spiritual" : "introspective_cinematic",
      emotional_tone: emotion.includes("深海") ? "introspective_poetic" : "reflective_symbolic",
      key_themes: themes,
    },
    act1: {
      scene_description: `你醒来时，发现自己站在一处只属于你的边界空间。眼前的景象像是从“${coreImage}”里生长出来，又被“${cinema}”的镜头重新照亮。远处有风，近处有水汽，空气里带着一种介于现实与梦之间的静默。你能感觉到，这里并不是某个需要解释的地方，而是你内心那些长期没有被完整命名的部分，终于获得了场景。\n\n身后仿佛延伸着“${scene}”的气味与节律，像一条你熟悉的精神通道；前方却有更深的召唤，缓慢、神秘、不可回避。它不逼迫你，却要求你真正做出选择。你意识到，自己此刻所面对的，不只是一个去向，而是你对未知、关系和核心渴望的真实反应。`,
      visual_prompt: `A solitary figure standing inside a symbolic threshold landscape inspired by ${cinema}, derived from the image of ${coreImage}, cinematic atmosphere, mist, horizon, poetic darkness, melancholic but luminous, subtle surrealism, tactile wind and water, immersive mood, ultra wide frame, 16:9`,
      ambient_sound: coreImage.includes("海") ? "ocean_waves_distant" : coreImage.includes("雨") ? "rain_soft" : "silence_deep",
      duration: 30,
    },
    act2: {
      choices: [
        {
          choice_id: 1,
          scene: `迷雾深处传来一个近乎熟悉的召唤，它像在等待你立刻回应，也像在考验你如何面对未知。考虑到你平时更倾向于“${decision}”，而你的情绪节律又接近“${emotion}”，这一刻显得尤其真实。`,
          options: [
            { id: "1A", text: "立即循声而去，哪怕前方仍未被看清", trait_signal: "action_oriented + intuitive + risk_taking", response: "你选择先走一步，再让答案在路上成形。迷雾并没有立刻散开，但你开始听见自己的脚步声，这让未知不再只是威胁，而像某种被你主动迎接的命运。" },
            { id: "1B", text: "停下来，先判断声音真正来自哪里", trait_signal: "analytical + cautious + risk_aware", response: "你没有把第一感受当成唯一凭据，而是给自己留出辨认的时间。对你来说，谨慎不是退缩，而是为真正重要的选择建立秩序。" },
            { id: "1C", text: "向迷雾回应，等待对方也向你靠近", trait_signal: "relationship_oriented + openness + trust_tendency", response: "你没有单方面追逐，而是先发出自己的信号。你知道连接需要双向发生，而不是永远由你独自承担全部风险。" },
            { id: "1D", text: "假装没听见，继续沿着自己的路径前行", trait_signal: "independent + self_protective + avoidant_attachment", response: "你选择把边界放在前面。不是因为你什么都不在意，而是因为你很清楚，某些未知只有在你愿意的时候，才配进入你的世界。" },
          ],
        },
        {
          choice_id: 2,
          scene: `前方出现了一个人影。TA 并不靠近，只是站在光线与阴影交界的位置，像在等待你定义距离。这一幕更像对“${relation}”的镜像测试。`,
          options: [
            { id: "2A", text: "先保持距离，观察对方是否值得靠近", trait_signal: "boundary + selective_social + discernment", response: "你把靠近的速度交还给判断，而不是交给冲动。关系在你这里从来不是数量问题，而是是否足够真实。" },
            { id: "2B", text: "主动走近，试着发起一场真正的对话", trait_signal: "deep_connection + vulnerability + connection_need", response: "你愿意承担被看见的风险，因为你知道，真正的理解从来不是自动发生的，而是有人先打开一道门。" },
            { id: "2C", text: "并肩沉默地走一段，不急着交换任何解释", trait_signal: "quiet_intimacy + reflective_attachment + emotional_depth", response: "你选择了一种更适合自己的连接方式。不是所有关系都要从语言开始，有些理解先发生在共享的节奏里。" },
            { id: "2D", text: "转身离开，把这一刻留在未完成里", trait_signal: "avoidant_attachment + self_preservation + autonomy", response: "你把未完成保留为一种自由。你知道，并非所有相遇都必须发展成关系，有时转身本身就是一种诚实。" },
          ],
        },
        {
          choice_id: 3,
          scene: `道路尽头出现两种同时成立的召唤：一种指向安稳、清晰与归属，另一种指向更辽阔但也更不确定的边界。它逼近的，是你真正的核心渴望。`,
          options: [
            { id: "3A", text: "选择安全与清晰，先让内心安定下来", trait_signal: "security_need + stabilization + emotional_regulation", response: "你没有把稳定看成庸常，而是把它视为继续探索的地基。某些灵魂不是不需要远方，而是先需要一个能安放自己的地方。" },
            { id: "3B", text: "选择未知与自由，即使答案仍然模糊", trait_signal: "freedom_desire + openness + exploration", response: "你愿意把不确定当成现实的一部分，而不是非得马上消除的噪音。你知道，真正重要的东西，常常不会在绝对确定中诞生。" },
            { id: "3C", text: "停在两者之间，继续感受这股拉扯本身", trait_signal: "tension_tolerance + introspection + ambiguity_capacity", response: "你没有仓促地把张力解决掉。对你来说，理解矛盾本身，有时比立刻做出单一选择更接近真实。" },
            { id: "3D", text: "寻找第三条隐秘的路径，不接受二选一", trait_signal: "creative_reframing + independence + non_linear_thinking", response: "你 instinctively 开始寻找结构之外的可能。你不愿被现成框架定义，总想为自己重新发明一条更贴身的道路。" },
          ],
        },
      ],
    },
    act3: {
      scene_description: "门后是一面巨大的镜子，占据了整个墙面。镜中的你既熟悉又陌生，像是那些一直被你延后解释的感受，终于找到了能直视你的形状。TA 开口时，声音和你相同，但语气更安静，也更锋利。",
      mirror_questions: [
        {
          question_id: 1,
          dialogue: "“你一直在寻找什么？” 镜中的你问道，像是在替你把多年未说出的句子缓慢说完。",
          question: "选择最接近你内心真实答案的选项：",
          options: [
            { id: "3A-1", text: "一个真正理解我的人", trait_signal: "relationship_need + being_understood_desire" },
            { id: "3A-2", text: "我自己都不知道的答案", trait_signal: "self_exploration + existential_anxiety" },
            { id: "3A-3", text: "一种确定性和安全感", trait_signal: "security_need + anxiety_tendency" },
            { id: "3A-4", text: "逃离某种束缚的自由", trait_signal: "freedom_desire + rebelliousness" },
            { id: "3A-5", text: "生命的意义和价值", trait_signal: "meaning_seeking + philosophical" },
            { id: "3A-6", text: "内心的平静", trait_signal: "peace_need + emotional_regulation" },
            { id: "3A-7", text: "我不知道，也许什么都不是", trait_signal: "nihilism_tendency + confusion" },
          ],
        },
        {
          question_id: 2,
          dialogue: "镜中的你沉默片刻，目光像穿过你此刻的样子，直接落向更深处。",
          question: "如果可以改变一件事，你会选择：",
          options: [
            { id: "3B-1", text: "改变过去的某个决定", trait_signal: "regret_tendency + past_oriented" },
            { id: "3B-2", text: "改变现在的某种状态", trait_signal: "present_dissatisfaction + action_willingness" },
            { id: "3B-3", text: "改变未来的某种可能", trait_signal: "anxiety_tendency + future_oriented" },
            { id: "3B-4", text: "改变他人对我的看法", trait_signal: "external_validation_need + social_anxiety" },
            { id: "3B-5", text: "改变我对自己的看法", trait_signal: "self_acceptance_difficulty + inner_conflict" },
            { id: "3B-6", text: "什么都不想改变", trait_signal: "acceptance_tendency + present_satisfaction" },
          ],
        },
      ],
      mirror_final_words: "镜子开始被雾气覆盖。\"你已经知道答案了，\"镜中的你说，\"只是你终于愿意让它被看见。\"",
    },
    epilogue: {
      scene_description: "镜子消失后，场景渐渐退去。你重新回到最初的边界，但此刻它不再只是迷雾，而像一张刚被点亮了轮廓的地图。你明白，这场旅程不是为了交出唯一正确的答案，而是让你看到自己如何面对问题本身。",
      closing_text: "你的旅程结束了，但理解才刚刚开始。现在，让我们一起看看，你在这场旅程中揭示了什么……",
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
    meaning_seeking: clampScore((bigFive.openness + bigFive.neuroticism) / 2 + (selectedMirror.includes("3A-5") ? 10 : selectedMirror.includes("3A-2") ? 8 : 0)),
    aesthetic_sensitivity: clampScore(bigFive.openness + (record.part1_data.narrative.precious_photo_analysis ? 8 : 0)),
    action_tendency: clampScore(42 + selectedChoices.reduce((sum, current) => sum + choiceWeight(current), 0) - (record.part1_data.philosophy.decision_style === "B2-4" ? 6 : 0)),
    relationship_need: clampScore(bigFive.agreeableness + (selectedChoices.includes("2B") ? 9 : 0) + (selectedMirror.includes("3A-1") ? 8 : 0)),
  };
}

function dimensionInterpretation(label: string, score: number, text: string) {
  return `${label}${score >= 75 ? "很高" : score >= 55 ? "处于中高段" : score >= 40 ? "处于中段" : "偏低"}。${text}`;
}

function buildDeterministicCoreTensions(
  archetypeHint: string,
  selectedRelationshipPhilosophy: string,
): PsycheConstellation["core_tensions"] {
  if (archetypeHint === "rational_builder") {
    return [
      {
        tension_id: 1,
        name: "结构秩序与情绪流动的张力",
        description: `你很擅长用结构、方法和节律来稳定自己，这让你在复杂情境中保持清醒；但同一套能力也可能让你先整理感受，再真正进入感受。关系哲学“${selectedRelationshipPhilosophy}”说明你珍视清晰边界，却也会因此延后某些更直接的情绪交换。`,
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
        description: `你需要流动、变化和未被过早定义的空间，但关系哲学“${selectedRelationshipPhilosophy}”又说明你并没有放弃被理解、被接住和被记住的需要。`,
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
        description: `你会把感受保留得很深，所以关系哲学“${selectedRelationshipPhilosophy}”并不只是边界选择，也是在说明你需要更长的时间，才愿意把真实交出来。`,
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
      description: `你习惯沿着自己的精神路径往深处走，也因此对关系质量有很高要求。关系哲学“${selectedRelationshipPhilosophy}”说明你不会轻易让任何人进入，但真正的孤独并不来自无人同行，而是来自很少有人能跟上你的内在密度。`,
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

function formatJoined(values: string[], fallback: string) {
  const next = values.filter((value) => value && value.trim().length > 0);
  return next.length > 0 ? next.join("、") : fallback;
}

function pickTopDimensionLabels(scores: Record<string, number>) {
  return Object.entries(scores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => dimensionLabelMap[key] ?? key)
    .join("、");
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
}) {
  const { profile, scores, themes, selectedA1, selectedB1, selectedB2, selectedB5, resonanceMoments } = params;
  const topDimensions = pickTopDimensionLabels(scores);
  const themeSummary = formatJoined(themes, "意义追寻、审美敏感与关系边界");
  const supportLine = scores.emotional_depth >= 78 && scores.meaning_seeking >= 74 && scores.action_tendency <= 58
    ? "如果最近这些感受已经持续压缩睡眠、食欲或日常节律，先把现实照料放到前面，联系可信任的人或本地专业支持，并不意味着你变得脆弱，只是说明你愿意让自己先被接住。"
    : "";

  return [
    `${profile.narrativeLead} 当你把“${selectedA1}”选为核心意象时，其实已经说明你会被边界、气氛和精神纵深吸引。${profile.narrativeFocus}`,
    `在思维方式上，你更靠近“${selectedB1}”与“${selectedB2}”。这说明你面对世界时，并不是只想迅速得到一个可执行答案，而是会先和问题本身共处，确认这件事是不是触到了更深层的意义。`,
    `你的关系观——“${selectedB5}”——让一条很清楚的线浮现出来：${profile.relationshipLens} 当共鸣时刻集中在${resonanceMoments}时，你已经说明自己真正要的不是更多连接，而是更真、更稳、更能保留自我的连接。`,
    `从整张精神星图来看，你的高分维度集中在${topDimensions}，核心主题则贴近${themeSummary}。这让你更容易被深层文本、象征画面、微妙氛围和难以一次说清的情绪击中。${profile.movementLens}`,
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

  return {
    user_id: part1.user_id,
    generated_at: new Date().toISOString(),
    archetype: profile.archetype,
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
    }),
    core_tensions: buildDeterministicCoreTensions(primaryArchetypeHint, selectedB5),
    growth_suggestions: profile.growthSuggestions,
    recommendations: profile.recommendations,
  };
}
