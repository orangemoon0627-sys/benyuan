import { assessmentModuleLabels } from "./catalog";
import { fullLiteQuestionSet } from "./question-bank";
import type { AssessmentFormState, AssessmentStepContext, QuestionDef, AssessmentAnswerValue } from "./types";

export const assessmentDraftStorageKey = "benyuan-lite-test-draft-v1";

export const initialAssessmentFormState: AssessmentFormState = {
  lifeStage: "turning_point",
  moodKeywords: ["迷茫", "希望"],
  answers: {},
};

export const assessmentTotalSteps = fullLiteQuestionSet.length + 2;

export function hasDraftableAssessmentProgress(step: number, state: AssessmentFormState) {
  if (step > 0) return true;
  if (state.lifeStage !== initialAssessmentFormState.lifeStage) return true;
  if (state.moodKeywords.length !== initialAssessmentFormState.moodKeywords.length) return true;
  return state.moodKeywords.some((keyword, index) => keyword !== initialAssessmentFormState.moodKeywords[index]);
}

export function getAssessmentStepContext(step: number): AssessmentStepContext {
  if (step === 0) return { mode: "entry" };
  if (step === assessmentTotalSteps - 1) return { mode: "review" };
  return { mode: "question", question: fullLiteQuestionSet[step - 1], questionIndex: step - 1 };
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

export function getAssessmentModuleLabel(moduleId: string) {
  return assessmentModuleLabels[moduleId] ?? moduleId;
}
