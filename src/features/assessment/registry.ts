import type { Mode, Answer } from "@/lib/types";
import { assessmentModuleLabels, lifeStageOptions, moodKeywordOptions } from "./catalog";
import { fullLiteQuestionSet } from "./question-bank";
import { assessmentTotalSteps, isAssessmentQuestionAnswered } from "./flow";
import type { AssessmentAnswerValue, QuestionDef } from "./types";

export type AssessmentValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid_mode" | "missing_required_answers";
      details?: {
        firstIncompleteQuestionId?: string;
        missingOpenReflection?: boolean;
      };
    };

export type AssessmentDefinition = {
  mode: Mode;
  title: string;
  description: string;
  totalSteps: number;
  moduleLabels: Record<string, string>;
  lifeStageOptions: typeof lifeStageOptions;
  moodKeywordOptions: string[];
  questions: QuestionDef[];
  validation: {
    requireAtLeastOneOpenReflection: boolean;
    openReflectionQuestionIds: string[];
  };
};

const liteAssessmentDefinition: AssessmentDefinition = {
  mode: "lite",
  title: "Lite Ritual",
  description: "适合当前 MVP 的单题推进式自我探索流程。",
  totalSteps: assessmentTotalSteps,
  moduleLabels: assessmentModuleLabels,
  lifeStageOptions,
  moodKeywordOptions,
  questions: fullLiteQuestionSet,
  validation: {
    requireAtLeastOneOpenReflection: true,
    openReflectionQuestionIds: ["Q023", "Q024"],
  },
};

const assessmentRegistry: Record<Mode, AssessmentDefinition> = {
  lite: liteAssessmentDefinition,
  deep: liteAssessmentDefinition,
};

export const defaultAssessmentMode: Mode = "lite";

export function listAssessmentDefinitions() {
  return Object.values(assessmentRegistry);
}

export function getAssessmentDefinition(mode: Mode = defaultAssessmentMode) {
  return assessmentRegistry[mode] ?? assessmentRegistry[defaultAssessmentMode];
}

export function validateAssessmentSubmission(mode: Mode, answers: Answer[]): AssessmentValidationResult {
  const definition = getAssessmentDefinition(mode);
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  const requiredQuestions = definition.questions.filter((question) => !question.optional);

  const firstIncompleteQuestion = requiredQuestions.find((question) => {
    const answer = answerMap.get(question.questionId);
    if (!answer) return true;

    return !isAssessmentQuestionAnswered(question, {
      [question.questionId]: answer.value as AssessmentAnswerValue,
    });
  });

  const openReflectionAnswered = definition.validation.openReflectionQuestionIds.some((questionId) => {
    const answer = answerMap.get(questionId);
    return typeof answer?.value === "string" && answer.value.trim().length > 0;
  });

  if (firstIncompleteQuestion || (definition.validation.requireAtLeastOneOpenReflection && !openReflectionAnswered)) {
    return {
      ok: false,
      error: "missing_required_answers",
      details: {
        firstIncompleteQuestionId: firstIncompleteQuestion?.questionId,
        missingOpenReflection: definition.validation.requireAtLeastOneOpenReflection && !openReflectionAnswered,
      },
    };
  }

  return { ok: true };
}
