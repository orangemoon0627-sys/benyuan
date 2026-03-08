import type { AssessmentAnswerValue, QuestionDef, QuestionAnswerType, QuestionOption } from "./types";

export type AssessmentQuestionTypeMeta = {
  answerType: QuestionAnswerType;
  family: "choice" | "scale" | "text" | "ranking";
  cardinality: "single" | "multi" | "scalar" | "ordered" | "freeform";
  webImplementation: "implemented" | "planned";
  defaultPresentation:
    | "text_options"
    | "image_grid"
    | "audio_scene"
    | "scale_steps"
    | "long_text"
    | "ranked_cards";
  defaultValue(question: QuestionDef): AssessmentAnswerValue;
  validate(question: QuestionDef, value: AssessmentAnswerValue | undefined): boolean;
};

function validateSingleChoice(value: AssessmentAnswerValue | undefined) {
  return typeof value === "string" && value.length > 0;
}

function validateMultiChoice(question: QuestionDef, value: AssessmentAnswerValue | undefined) {
  const count = Array.isArray(value) ? value.length : 0;
  return count >= (question.minSelections ?? 1);
}

function validateScale(value: AssessmentAnswerValue | undefined) {
  return typeof value === "number";
}

function validateText(question: QuestionDef, value: AssessmentAnswerValue | undefined) {
  if (question.optional) return true;
  return typeof value === "string" && value.trim().length > 0;
}

function validateRank(question: QuestionDef, value: AssessmentAnswerValue | undefined) {
  const count = Array.isArray(value) ? value.length : 0;
  return count >= (question.minSelections ?? 2);
}

export const assessmentQuestionTypeRegistry: Record<QuestionAnswerType, AssessmentQuestionTypeMeta> = {
  single: {
    answerType: "single",
    family: "choice",
    cardinality: "single",
    webImplementation: "implemented",
    defaultPresentation: "text_options",
    defaultValue: () => "",
    validate: (_, value) => validateSingleChoice(value),
  },
  multi: {
    answerType: "multi",
    family: "choice",
    cardinality: "multi",
    webImplementation: "implemented",
    defaultPresentation: "text_options",
    defaultValue: () => [],
    validate: validateMultiChoice,
  },
  scale: {
    answerType: "scale",
    family: "scale",
    cardinality: "scalar",
    webImplementation: "implemented",
    defaultPresentation: "scale_steps",
    defaultValue: (question) => question.scaleMin ?? 1,
    validate: (_, value) => validateScale(value),
  },
  text: {
    answerType: "text",
    family: "text",
    cardinality: "freeform",
    webImplementation: "implemented",
    defaultPresentation: "long_text",
    defaultValue: () => "",
    validate: validateText,
  },
  rank: {
    answerType: "rank",
    family: "ranking",
    cardinality: "ordered",
    webImplementation: "planned",
    defaultPresentation: "ranked_cards",
    defaultValue: () => [],
    validate: validateRank,
  },
  image_single: {
    answerType: "image_single",
    family: "choice",
    cardinality: "single",
    webImplementation: "planned",
    defaultPresentation: "image_grid",
    defaultValue: () => "",
    validate: (_, value) => validateSingleChoice(value),
  },
  image_multi: {
    answerType: "image_multi",
    family: "choice",
    cardinality: "multi",
    webImplementation: "planned",
    defaultPresentation: "image_grid",
    defaultValue: () => [],
    validate: validateMultiChoice,
  },
  audio_single: {
    answerType: "audio_single",
    family: "choice",
    cardinality: "single",
    webImplementation: "planned",
    defaultPresentation: "audio_scene",
    defaultValue: () => "",
    validate: (_, value) => validateSingleChoice(value),
  },
};

export function getAssessmentQuestionTypeMeta(answerType: QuestionAnswerType) {
  return assessmentQuestionTypeRegistry[answerType];
}

export function getDefaultAnswerValue(question: QuestionDef) {
  return getAssessmentQuestionTypeMeta(question.answerType).defaultValue(question);
}

export function validateAssessmentQuestionValue(question: QuestionDef, value: AssessmentAnswerValue | undefined) {
  return getAssessmentQuestionTypeMeta(question.answerType).validate(question, value);
}

export function getQuestionOptions(question: QuestionDef): QuestionOption[] {
  return (question.options ?? []).map((option, index) => {
    if (typeof option === "string") {
      return {
        id: `${question.questionId}_option_${index + 1}`,
        label: option,
      };
    }

    return option;
  });
}

export function listAssessmentQuestionTypes() {
  return Object.values(assessmentQuestionTypeRegistry);
}

export function getResolvedQuestionPresentation(question: QuestionDef) {
  return {
    kind: question.presentation?.kind ?? getAssessmentQuestionTypeMeta(question.answerType).defaultPresentation,
    ...question.presentation,
  };
}

export function serializeAssessmentQuestion(question: QuestionDef) {
  const meta = getAssessmentQuestionTypeMeta(question.answerType);

  return {
    ...question,
    options: getQuestionOptions(question),
    presentation: getResolvedQuestionPresentation(question),
    typeMeta: {
      answerType: meta.answerType,
      family: meta.family,
      cardinality: meta.cardinality,
      webImplementation: meta.webImplementation,
      defaultPresentation: meta.defaultPresentation,
    },
  };
}
