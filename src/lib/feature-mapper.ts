import type { AnalysisInput } from "@/lib/analysis/types";
import type { Answer, ConfidenceBand, FeatureVector, TestSession } from "@/lib/types";

const FEATURE_GROUPS = {
  aesthetic: [
    "aesthetic_literary_existential",
    "aesthetic_literary_tenderness",
    "aesthetic_music_intensity",
    "aesthetic_music_nocturnal",
    "aesthetic_visual_surreal",
    "aesthetic_visual_minimal",
    "aesthetic_niche_orientation",
  ],
  emotional: [
    "emotional_granularity",
    "emotional_depth",
    "emotional_rhythm_tidal",
    "emotional_rhythm_stable",
    "emotional_transformation",
  ],
  temporal: [
    "temporal_past_weight",
    "temporal_present_depth",
    "temporal_future_pull",
    "temporal_narrative_coherence",
    "temporal_change_openness",
    "temporal_meaning_density",
  ],
} as const;

const FEATURE_KEYS = [
  ...FEATURE_GROUPS.aesthetic,
  ...FEATURE_GROUPS.emotional,
  ...FEATURE_GROUPS.temporal,
] as const;

type FeatureKey = (typeof FEATURE_KEYS)[number];
type FeatureScores = Record<FeatureKey, number>;
type PartialFeatureScores = Partial<Record<FeatureKey, number>>;
type QuestionOptionMap = Record<string, PartialFeatureScores>;

const OPTION_MAPPINGS: Record<string, QuestionOptionMap> = {
  Q001: {
    "薄雾一样的恍惚": { emotional_depth: 0.6, temporal_present_depth: 0.3 },
    "持续低压的疲惫": { emotional_depth: 0.6, temporal_past_weight: 0.3 },
    "潮水起伏般的敏感": { emotional_rhythm_tidal: 1 },
    "短暂但明亮的希望": { temporal_future_pull: 0.6, temporal_change_openness: 0.3 },
    "说不清来由的急迫感": { temporal_future_pull: 0.6, emotional_depth: 0.3 },
    "难得的平稳与安静": { emotional_rhythm_stable: 1 },
  },
  Q002: {
    "在雾里慢慢辨认方向": { temporal_present_depth: 0.6 },
    "刚从旧路上拐弯，脚下还不稳": { temporal_past_weight: 0.6, temporal_change_openness: 0.3 },
    "在一条熟路上走得越来越熟练": { temporal_narrative_coherence: 0.6 },
    "快步朝一个很远的地方赶去": { temporal_future_pull: 1 },
    "暂时停在路边，想弄清自己为什么出发": { temporal_meaning_density: 0.6, temporal_present_depth: 0.3 },
  },
  Q003: {
    "一句像替我说出心事的话": { emotional_granularity: 0.6, aesthetic_literary_tenderness: 0.3 },
    "一个安静到几乎静止的画面": { aesthetic_visual_minimal: 0.6, temporal_present_depth: 0.3 },
    "一段情绪突然漫上来的旋律": { aesthetic_music_intensity: 0.6, emotional_depth: 0.3 },
    "一个让我想起很久以前的气味或场景": { temporal_past_weight: 0.6, temporal_meaning_density: 0.3 },
    "一个关于未来的微小想象": { temporal_future_pull: 0.6 },
  },
  Q004: {
    "骤雨，来得快也退得快": { emotional_rhythm_tidal: 0.6 },
    "连绵阴天，久久不散": { emotional_depth: 0.6 },
    "潮汐，有规律地反复涨落": { emotional_rhythm_tidal: 1 },
    "深海暗流，表面平静但里面很重": { emotional_depth: 1 },
    "晨雾，模糊却柔软": { emotional_depth: 0.6, emotional_granularity: 0.3 },
  },
  Q005: {
    "我知道自己在难过，只是不想解释": { emotional_depth: 0.6 },
    "我知道不对劲，但说不出具体是什么": { emotional_granularity: 0.3 },
    "我能分清楚很多细微感受，但讲出来太费力": { emotional_granularity: 1 },
    "我通常先说“没事”，等自己消化": { emotional_transformation: 0.3 },
    "我会希望有人继续问下去": { emotional_depth: 0.3, emotional_transformation: 0.3 },
  },
  Q006: {
    "写下来或转成某种表达": { emotional_transformation: 1, aesthetic_literary_tenderness: 0.3 },
    "去散步，让身体先带我走出去": { emotional_rhythm_stable: 0.6 },
    "先关起来，等它自己过去": { emotional_depth: 0.3 },
    "找一个可信的人说出来": { emotional_transformation: 0.6 },
    "沉进去，把它感受完整": { emotional_depth: 1 },
  },
  Q008: {
    "深夜，一切安静下来之后": { aesthetic_music_nocturnal: 0.3, emotional_depth: 0.6 },
    "事情结束以后回想时": { temporal_past_weight: 0.6, temporal_meaning_density: 0.3 },
    "关系里被忽略或误解时": { emotional_depth: 0.6 },
    "看到别人继续往前走时": { temporal_future_pull: 0.6 },
    "忽然被某个作品击中时": { aesthetic_music_intensity: 0.3, emotional_transformation: 0.3 },
  },
  Q009: {
    "脆弱是我不轻易示人的部分": { emotional_depth: 0.6 },
    "脆弱是我理解别人的入口": { emotional_transformation: 0.6 },
    "脆弱会让我失去秩序": { emotional_rhythm_stable: 0.3 },
    "脆弱往往和创作或洞察一起出现": { emotional_transformation: 1 },
    "我还不确定自己是否允许它存在": { emotional_granularity: 0.3 },
  },
  Q010: {
    "我终于把它说清楚了": { emotional_granularity: 0.6, emotional_transformation: 0.3 },
    "时间慢慢冲淡了它": { emotional_rhythm_stable: 0.6 },
    "我把它变成了某种作品或表达": { emotional_transformation: 1 },
    "现实事务把我拉回来了": { temporal_present_depth: 0.3 },
    "有人让我感到自己没有被丢下": { emotional_depth: 0.3 },
  },
  Q011: {
    "荒诞中的孤独与异化": { aesthetic_literary_existential: 1 },
    "绵长而潮湿的忧郁": { aesthetic_literary_tenderness: 0.6, aesthetic_music_nocturnal: 0.3 },
    "冷静、疏离、近乎透明的清醒": { aesthetic_literary_existential: 0.6, aesthetic_visual_minimal: 0.3 },
    "缓慢但坚定的灵魂追索": { temporal_meaning_density: 0.6, aesthetic_literary_existential: 0.3 },
    "精致、克制、带一点苍凉的情感": { aesthetic_literary_tenderness: 1 },
  },
  Q012: {
    "深夜独处的爵士钢琴": { aesthetic_music_nocturnal: 1 },
    "暴雨中的后摇器乐": { aesthetic_music_intensity: 1, emotional_depth: 0.3 },
    "清晨宏大的古典乐章": { temporal_future_pull: 0.3, temporal_meaning_density: 0.3 },
    "带一点冰冷荧光感的电子声场": { aesthetic_visual_surreal: 0.3, aesthetic_music_intensity: 0.6 },
    "轻微沙哑、贴近耳边的民谣低语": { aesthetic_literary_tenderness: 0.3, aesthetic_music_nocturnal: 0.6 },
  },
  Q013: {
    "光线克制、留白很多的房间": { aesthetic_visual_minimal: 1 },
    "旧物很多、带时间痕迹的空间": { temporal_past_weight: 0.3, aesthetic_literary_tenderness: 0.3 },
    "梦境感强、边界不清的场景": { aesthetic_visual_surreal: 1 },
    "秩序清晰、材质冷冽的建筑内部": { aesthetic_visual_minimal: 0.6 },
    "自然疯长、略带荒废感的院落": { aesthetic_visual_surreal: 0.6, temporal_meaning_density: 0.3 },
  },
  Q014: {
    "旧时代缓慢褪色的痕迹": { temporal_past_weight: 1 },
    "当下极短暂的一次发亮": { temporal_present_depth: 1 },
    "未来城市里有点孤独的光": { temporal_future_pull: 1 },
    "看不清年代、像神话又像梦的时空": { aesthetic_visual_surreal: 0.6, temporal_meaning_density: 0.6 },
    "四季更替中反复回来的熟悉感": { temporal_past_weight: 0.3, temporal_present_depth: 0.3 },
  },
  Q015: {
    废墟: { aesthetic_literary_existential: 0.6 },
    雾: { aesthetic_visual_surreal: 0.3, aesthetic_music_nocturnal: 0.3 },
    回声: { temporal_meaning_density: 0.3 },
    留白: { aesthetic_visual_minimal: 0.6 },
    微光: { temporal_present_depth: 0.3 },
    潮汐: { emotional_rhythm_tidal: 0.6 },
    密林: { aesthetic_visual_surreal: 0.6 },
    异乡: { aesthetic_niche_orientation: 0.6, temporal_future_pull: 0.3 },
  },
  Q016: {
    "更容易被打动": { aesthetic_literary_tenderness: 0.6 },
    "会先看它是否有结构支撑": { aesthetic_visual_minimal: 0.3 },
    "我偏爱完成度更高的东西": { aesthetic_visual_minimal: 0.6 },
    "要看它是否保留了真诚": { aesthetic_literary_tenderness: 0.6, emotional_transformation: 0.3 },
    "裂痕本身就是作品的核心": { aesthetic_literary_existential: 0.6, emotional_depth: 0.3 },
  },
  Q017: {
    "它是否替我说出了情绪": { emotional_granularity: 0.3, aesthetic_literary_tenderness: 0.6 },
    "它是否创造了一种能住进去的氛围": { aesthetic_visual_surreal: 0.3, aesthetic_music_nocturnal: 0.3 },
    "它是否让我感到更清醒": { aesthetic_literary_existential: 0.6 },
    "它是否把复杂体验处理得很克制": { aesthetic_visual_minimal: 0.3, emotional_granularity: 0.3 },
    "它是否让我对自己产生新的理解": { temporal_meaning_density: 0.3, emotional_transformation: 0.3 },
  },
  Q018: {
    "我会主动寻找少有人知但很像我的作品": { aesthetic_niche_orientation: 1 },
    "只要真有共鸣，热门或小众都无所谓": { aesthetic_niche_orientation: 0.3 },
    "我喜欢经过时间筛选后留下来的经典": { temporal_past_weight: 0.3 },
    "我常被朋友说审美有点偏门": { aesthetic_niche_orientation: 0.6 },
    "我更在意作品和我当下状态是否匹配": { temporal_present_depth: 0.3 },
  },
  Q019: {
    "不断回头看发生过什么": { temporal_past_weight: 1 },
    "努力守住此刻，不想被别的拉走": { temporal_present_depth: 1 },
    "经常被还没到来的事情牵引": { temporal_future_pull: 1 },
    "三个方向都会来，但轻重不同": { temporal_narrative_coherence: 0.6 },
    "我更像在时间外观察自己的生活": { temporal_meaning_density: 0.6 },
  },
  Q020: {
    "一部细节很多、经常倒带的电影": { temporal_past_weight: 1, temporal_narrative_coherence: 0.3 },
    "几个发亮或发痛的碎片": { emotional_depth: 0.3, temporal_past_weight: 0.6 },
    "一片已经模糊但有气味的雾": { aesthetic_music_nocturnal: 0.3, temporal_past_weight: 0.3 },
    "一条能解释今天的暗线": { temporal_narrative_coherence: 0.6, temporal_meaning_density: 0.3 },
    "我尽量不回头看": { temporal_future_pull: 0.3 },
  },
  Q022: {
    "先抗拒，等到不得不变": { temporal_change_openness: 0 },
    "一边不安，一边还是会往前试": { temporal_change_openness: 0.6 },
    "我会主动制造变化感": { temporal_change_openness: 1 },
    "如果变化有意义，我会接受它": { temporal_change_openness: 0.8, temporal_meaning_density: 0.3 },
    "我更想先理解变化在夺走什么": { temporal_meaning_density: 0.6 },
  },
};

const SCALE_MAPPINGS: Record<string, FeatureKey> = {
  Q007: "emotional_granularity",
  Q021: "temporal_narrative_coherence",
};

const TRAUMA_REGEX = /创伤|虐待|暴力|阴影|崩溃|噩梦|窒息|抛弃|遗弃|羞辱|伤害|失控/u;
const SELF_HARM_REGEX = /不想活|想消失|结束自己|自残|轻生|活着没意义/u;
const EXISTENTIAL_REGEX = /意义|虚无|存在|荒诞|空心|为什么活|为何存在/u;
const TIME_REFERENCE_REGEX = /半年前|以前|当时|后来|现在|那时|去年|从前|曾经/u;
const CHANGE_REGEX = /变化|离开|开始|重新|往前|转弯|新生活|改变/u;
const SELF_SOOTHING_REGEX = /慢一点|没关系|辛苦了|允许|接纳|理解自己|别怕|已经很好/u;
const EMOTION_WORD_REGEX = /孤独|难过|忧郁|平静|怀念|羞耻|失望|委屈|希望|疲惫|焦虑|痛苦/u;

function createEmptyScores(): FeatureScores {
  return Object.fromEntries(FEATURE_KEYS.map((feature) => [feature, 0])) as FeatureScores;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function addScores(target: FeatureScores, source: PartialFeatureScores, factor = 1) {
  Object.entries(source).forEach(([feature, value]) => {
    if (!feature || typeof value !== "number") return;
    const key = feature as FeatureKey;
    target[key] += value * factor;
  });
}

function normalizeScale(answer: Answer, questionMap: AnalysisInput["questionMap"], questionId: string) {
  const value = typeof answer.value === "number" ? answer.value : Number(answer.value);
  const question = questionMap.get(questionId);
  const min = question?.scaleMin ?? 1;
  const max = question?.scaleMax ?? 5;
  if (Number.isNaN(value) || max === min) return 0;
  return clamp((value - min) / (max - min));
}

function findAnswer(session: TestSession, questionId: string) {
  return session.answers.find((answer) => answer.questionId === questionId);
}

function getTextAnswer(session: TestSession, questionId: string) {
  const value = findAnswer(session, questionId)?.value;
  return typeof value === "string" ? value.trim() : "";
}

function getAnsweredRequiredCount(input: AnalysisInput) {
  const requiredQuestions = input.questionSet.filter((question) => !question.optional);
  const { session } = input;
  const answered = requiredQuestions.filter((question) => {
    const answer = findAnswer(session, question.questionId);
    if (!answer) return false;

    if (question.answerType === "multi") {
      return Array.isArray(answer.value) && answer.value.length >= (question.minSelections ?? 1);
    }

    if (question.answerType === "scale") {
      return typeof answer.value === "number";
    }

    return typeof answer.value === "string" && answer.value.trim().length > 0;
  }).length;

  return { answered, total: requiredQuestions.length };
}

function scoreTextSignals(input: AnalysisInput, rawScores: FeatureScores) {
  const [firstOpenTextId, secondOpenTextId] = input.openReflectionQuestionIds;
  const q023 = firstOpenTextId ? getTextAnswer(input.session, firstOpenTextId) : "";
  const q024 = secondOpenTextId ? getTextAnswer(input.session, secondOpenTextId) : "";
  const textLengths = [q023.length, q024.length];
  let confidenceBonus = 0;

  if (q023.length > 24 && /(书|歌|电影|句子|小说|专辑|诗|音乐|画面)/u.test(q023)) {
    confidenceBonus += 0.08;
  }

  if (EMOTION_WORD_REGEX.test(q023)) {
    rawScores.emotional_granularity += 0.1;
  }

  if (/(夜|深夜|凌晨|爵士|钢琴|后摇|雨|耳机)/u.test(q023)) {
    rawScores.aesthetic_music_nocturnal += 0.1;
  }

  if (/(雾|梦|留白|回声|密林|异乡|荧光|荒诞|神话)/u.test(q023)) {
    rawScores.aesthetic_visual_surreal += 0.1;
  }

  if (/(极简|冷静|克制|结构|透明)/u.test(q023)) {
    rawScores.aesthetic_visual_minimal += 0.1;
  }

  if (TIME_REFERENCE_REGEX.test(q024) && q024.length > 12) {
    rawScores.temporal_narrative_coherence += 0.1;
  }

  if (CHANGE_REGEX.test(q024)) {
    rawScores.temporal_change_openness += 0.1;
  }

  if (SELF_SOOTHING_REGEX.test(q024)) {
    rawScores.emotional_transformation += 0.1;
  }

  const textRichness =
    textLengths.filter((length) => length >= 18).length === 2
      ? 1
      : textLengths.some((length) => length >= 18)
        ? 0.6
        : textLengths.some((length) => length > 0)
          ? 0.35
          : 0.2;

  return { confidenceBonus, textRichness };
}

function getFeatureMaximums(questionSet: AnalysisInput["questionSet"]) {
  const maximums = createEmptyScores();

  for (const question of questionSet) {
    if (question.answerType === "single") {
      const entries = Object.values(OPTION_MAPPINGS[question.questionId] ?? {});
      FEATURE_KEYS.forEach((feature) => {
        const best = entries.reduce((max, entry) => Math.max(max, entry[feature] ?? 0), 0);
        maximums[feature] += best;
      });
      continue;
    }

    if (question.answerType === "multi") {
      const entries = Object.values(OPTION_MAPPINGS[question.questionId] ?? {});
      const minSelections = question.minSelections ?? 1;
      const maxSelections = Math.min(question.maxSelections ?? entries.length, entries.length);

      FEATURE_KEYS.forEach((feature) => {
        const values = entries.map((entry) => entry[feature] ?? 0).sort((left, right) => right - left);
        let bestAverage = 0;
        for (let count = minSelections; count <= maxSelections; count += 1) {
          const slice = values.slice(0, count);
          const average = slice.reduce((sum, item) => sum + item, 0) / count;
          bestAverage = Math.max(bestAverage, average);
        }
        maximums[feature] += bestAverage;
      });
      continue;
    }

    if (question.answerType === "scale") {
      const feature = SCALE_MAPPINGS[question.questionId];
      maximums[feature] += 1;
    }
  }

  maximums.emotional_granularity += 0.1;
  maximums.aesthetic_music_nocturnal += 0.1;
  maximums.aesthetic_visual_surreal += 0.1;
  maximums.aesthetic_visual_minimal += 0.1;
  maximums.temporal_narrative_coherence += 0.1;
  maximums.temporal_change_openness += 0.1;
  maximums.emotional_transformation += 0.1;

  return maximums;
}

function getClarityScore(input: AnalysisInput) {
  const { session, questionMap } = input;
  const multiAnswers = session.answers.filter((answer) => Array.isArray(answer.value));
  if (multiAnswers.length === 0) return 0.85;

  const ratios = multiAnswers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question || !Array.isArray(answer.value)) return 1;
    const maxSelections = question.maxSelections ?? answer.value.length;
    return clamp(1 - Math.max(0, answer.value.length - (question.minSelections ?? 1)) / Math.max(1, maxSelections));
  });

  return clamp(ratios.reduce((sum, value) => sum + value, 0) / ratios.length, 0.45, 1);
}

function getConcentrationScore(values: FeatureScores) {
  const scores = Object.values(values).sort((left, right) => right - left);
  const topThree = scores.slice(0, 3).reduce((sum, value) => sum + value, 0) / 3;
  const midBandCount = scores.filter((value) => value >= 0.4 && value <= 0.6).length;
  const base = clamp(topThree + 0.08 - midBandCount * 0.015, 0.2, 1);
  return base;
}

function getConsistencyScore(values: FeatureScores) {
  const motifs = [
    (values.aesthetic_music_nocturnal + values.temporal_past_weight + values.emotional_depth) / 3,
    (values.temporal_future_pull + values.temporal_change_openness + values.temporal_meaning_density) / 3,
    (values.aesthetic_visual_minimal + values.aesthetic_literary_tenderness + values.emotional_rhythm_stable) / 3,
    (values.aesthetic_visual_surreal + values.aesthetic_music_intensity + values.aesthetic_literary_existential) / 3,
  ];
  const motifStrength = Math.max(...motifs);
  const conflictPenalty = values.temporal_past_weight > 0.7 && values.temporal_future_pull > 0.7 && values.temporal_narrative_coherence < 0.4 ? 0.18 : 0;
  return clamp(motifStrength + 0.18 - conflictPenalty, 0.2, 1);
}

function getConfidenceBand(score: number): ConfidenceBand {
  if (score < 0.4) return "low";
  if (score < 0.75) return "medium";
  return "high";
}

export function buildFeatureVector(input: AnalysisInput): FeatureVector {
  const { session, questionMap } = input;
  const rawScores = createEmptyScores();

  for (const answer of session.answers) {
    if (answer.answerType === "single") {
      if (typeof answer.value !== "string") continue;
      addScores(rawScores, OPTION_MAPPINGS[answer.questionId]?.[answer.value] ?? {});
      continue;
    }

    if (answer.answerType === "multi") {
      if (!Array.isArray(answer.value) || answer.value.length === 0) continue;
      const factor = 1 / answer.value.length;
      answer.value.forEach((option) => addScores(rawScores, OPTION_MAPPINGS[answer.questionId]?.[option] ?? {}, factor));
      continue;
    }

    if (answer.answerType === "scale") {
      const feature = SCALE_MAPPINGS[answer.questionId];
      rawScores[feature] += normalizeScale(answer, questionMap, answer.questionId);
    }
  }

  const { confidenceBonus, textRichness } = scoreTextSignals(input, rawScores);

  const normalizedValues = createEmptyScores();
  const featureMaximums = getFeatureMaximums(input.questionSet);
  FEATURE_KEYS.forEach((feature) => {
    normalizedValues[feature] = clamp(rawScores[feature] / Math.max(0.3, featureMaximums[feature]));
  });

  const completion = (() => {
    const { answered, total } = getAnsweredRequiredCount(input);
    const missing = total - answered;
    if (missing <= 0) return 1;
    if (missing <= 2) return 0.7;
    return 0.4;
  })();

  const clarity = getClarityScore(input);
  const concentration = getConcentrationScore(normalizedValues);
  const consistency = getConsistencyScore(normalizedValues);

  const confidenceScore = clamp(
    completion * 0.3 +
      clarity * 0.2 +
      concentration * 0.2 +
      textRichness * 0.15 +
      consistency * 0.15 +
      confidenceBonus,
  );

  return {
    sessionId: session.sessionId,
    values: normalizedValues,
    confidenceScore,
    confidenceBand: getConfidenceBand(confidenceScore),
    mappingVersion: "mapping.v0.1",
  };
}

export function collectSafetySignals(input: AnalysisInput, vector: FeatureVector) {
  const { session } = input;
  const flags = new Set<"none" | "high_sensitivity" | "existential_distress" | "trauma_signal" | "self_harm_risk" | "low_information">();
  const texts = input.openReflectionQuestionIds.map((questionId) => getTextAnswer(session, questionId)).filter(Boolean).join("\n");
  const significantFeatures = Object.values(vector.values).filter((value) => value >= 0.7).length;
  const answeredOpenText = input.openReflectionQuestionIds.map((questionId) => getTextAnswer(session, questionId)).filter((value) => value.length > 0).length;
  const { answered, total } = getAnsweredRequiredCount(input);

  if (answered / total < 0.8 || (answeredOpenText === 0 && significantFeatures <= 1) || (vector.confidenceBand === "low" && significantFeatures === 0)) {
    flags.add("low_information");
  }

  if (vector.values.emotional_depth > 0.72 && (vector.values.aesthetic_literary_tenderness > 0.56 || vector.values.aesthetic_music_nocturnal > 0.56)) {
    flags.add("high_sensitivity");
  }

  if (vector.values.aesthetic_literary_existential > 0.72 && vector.values.temporal_meaning_density > 0.65 && vector.values.emotional_depth > 0.65) {
    flags.add("existential_distress");
  }

  if (TRAUMA_REGEX.test(texts)) {
    flags.add("trauma_signal");
  }

  if (SELF_HARM_REGEX.test(texts)) {
    flags.add("self_harm_risk");
  }

  if (flags.size === 0) {
    flags.add("none");
  }

  return [...flags];
}

export function getFeatureSnapshot(vector: FeatureVector, keys: readonly FeatureKey[]) {
  return keys
    .map((key) => [key, vector.values[key] ?? 0] as const)
    .sort((left, right) => right[1] - left[1]);
}

export function getAnswerLabel(session: TestSession, questionId: string) {
  const answer = findAnswer(session, questionId);
  if (!answer) return "";
  if (typeof answer.value === "string") return answer.value;
  if (Array.isArray(answer.value)) return answer.value.join(" / ");
  return String(answer.value);
}
