import { validateAssessmentQuestionValue } from "./question-types";
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
  return validateAssessmentQuestionValue(question, answers[question.questionId]);
}

export function getAssessmentModuleLabel(definition: AssessmentDefinition, moduleId: string) {
  return definition.moduleLabels[moduleId] ?? moduleId;
}

export function findFirstIncompleteQuestionIndex(definition: AssessmentDefinition, answers: Record<string, AssessmentAnswerValue>) {
  return definition.questions.findIndex((question) => !isAssessmentQuestionAnswered(question, answers));
}
