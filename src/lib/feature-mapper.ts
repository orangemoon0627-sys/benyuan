import type { AnalysisInput } from "@/lib/analysis/types";
import { FEATURE_KEYS } from "@/lib/feature-space";
import type { FeatureKey, FeatureScores, PartialFeatureScores } from "@/lib/feature-space";
import type { Answer, ConfidenceBand, FeatureVector, TestSession } from "@/lib/types";
import {
  assessmentChangeRegex,
  assessmentEmotionWordRegex,
  assessmentMappingVersion,
  assessmentOptionMappings,
  assessmentScaleMappings,
  assessmentSelfHarmRegex,
  assessmentSelfSoothingRegex,
  assessmentTimeReferenceRegex,
  assessmentTraumaRegex,
} from "@/features/assessment/analysis-mapping";

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

  if (assessmentEmotionWordRegex.test(q023)) {
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

  if (assessmentTimeReferenceRegex.test(q024) && q024.length > 12) {
    rawScores.temporal_narrative_coherence += 0.1;
  }

  if (assessmentChangeRegex.test(q024)) {
    rawScores.temporal_change_openness += 0.1;
  }

  if (assessmentSelfSoothingRegex.test(q024)) {
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
      const entries = Object.values(assessmentOptionMappings[question.questionId] ?? {});
      FEATURE_KEYS.forEach((feature) => {
        const best = entries.reduce((max, entry) => Math.max(max, entry[feature] ?? 0), 0);
        maximums[feature] += best;
      });
      continue;
    }

    if (question.answerType === "multi") {
      const entries = Object.values(assessmentOptionMappings[question.questionId] ?? {});
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
      const feature = assessmentScaleMappings[question.questionId];
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
      addScores(rawScores, assessmentOptionMappings[answer.questionId]?.[answer.value] ?? {});
      continue;
    }

    if (answer.answerType === "multi") {
      if (!Array.isArray(answer.value) || answer.value.length === 0) continue;
      const factor = 1 / answer.value.length;
      answer.value.forEach((option) => addScores(rawScores, assessmentOptionMappings[answer.questionId]?.[option] ?? {}, factor));
      continue;
    }

    if (answer.answerType === "scale") {
      const feature = assessmentScaleMappings[answer.questionId];
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
    mappingVersion: assessmentMappingVersion,
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

  if (assessmentTraumaRegex.test(texts)) {
    flags.add("trauma_signal");
  }

  if (assessmentSelfHarmRegex.test(texts)) {
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
