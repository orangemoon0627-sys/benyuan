import type { AssessmentAnswerValue, AssessmentDefinition, AssessmentFormState, AssessmentStepContext, QuestionDef } from "./types";

export function getAssessmentTotalSteps(definition: Pick<AssessmentDefinition, "totalSteps">) {
  return definition.totalSteps;
}

export function hasDraftableAssessmentProgress(definition: AssessmentDefinition, step: number, state: AssessmentFormState) {
  if (step > 0) return true;
  if (state.lifeStage !== definition.initialState.lifeStage) return true;
  if (state.moodKeywords.length !== definition.initialState.moodKeywords.length) return true;
  return state.moodKeywords.some((keyword, index) => keyword !== definition.initialState.moodKeywords[index]);
}

export function getAssessmentStepContext(definition: AssessmentDefinition, step: number): AssessmentStepContext {
  if (step === 0) return { mode: "entry" };
  if (step === getAssessmentTotalSteps(definition) - 1) return { mode: "review" };
  return { mode: "question", question: definition.questions[step - 1], questionIndex: step - 1 };
}

export function isAssessmentQuestionAnswered(question: QuestionDef, answers: Record<string, AssessmentAnswerValue>) {
  const value = answers[question.questionId];

  if (question.answerType === "multi") {
    const count = Array.isArray(value) ? value.length : 0;
    return count >= (question.minSelections ?? 1);
  }

  if (question.answerType === "text") {
    if (question.optional) return true;
    return typeof value === "string" && value.trim().length > 0;
  }

  if (question.answerType === "scale") {
    return typeof value === "number";
  }

  return typeof value === "string" && value.length > 0;
}

export function getAssessmentModuleLabel(definition: AssessmentDefinition, moduleId: string) {
  return definition.moduleLabels[moduleId] ?? moduleId;
}

export function findFirstIncompleteQuestionIndex(definition: AssessmentDefinition, answers: Record<string, AssessmentAnswerValue>) {
  return definition.questions.findIndex((question) => !isAssessmentQuestionAnswered(question, answers));
}
