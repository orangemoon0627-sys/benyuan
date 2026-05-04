import { getAssessmentDefinition } from "@/features/assessment";
import type { AnalysisInput, AnalysisQuestionContract } from "@/lib/analysis/types";
import type { TestSession } from "@/lib/types";

function toAnalysisQuestionContract(question: ReturnType<typeof getAssessmentDefinition>["questions"][number]): AnalysisQuestionContract {
  return {
    questionId: question.questionId,
    moduleId: question.moduleId,
    answerType: question.answerType,
    prompt: question.prompt,
    optional: question.optional,
    minSelections: question.minSelections,
    maxSelections: question.maxSelections,
    scaleMin: question.scaleMin,
    scaleMax: question.scaleMax,
  };
}

export function buildAnalysisInput(session: TestSession, options?: { stageReporter?: AnalysisInput["stageReporter"] }): AnalysisInput {
  const definition = getAssessmentDefinition(session.mode, session.assessmentVersion);
  const questionSet = definition.questions.map((question) => toAnalysisQuestionContract(question));

  return {
    session,
    questionSet,
    questionMap: new Map(questionSet.map((question) => [question.questionId, question])),
    openReflectionQuestionIds: definition.validation.openReflectionQuestionIds,
    stageReporter: options?.stageReporter,
  };
}
