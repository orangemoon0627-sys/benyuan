import { NextResponse } from "next/server";
import {
  defaultAssessmentMode,
  getAssessmentDefinition,
  listAssessmentDefinitions,
  listAssessmentQuestionTypes,
  serializeAssessmentQuestion,
} from "@/features/assessment";
import type { Mode } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedMode = (searchParams.get("mode") as Mode | null) ?? defaultAssessmentMode;
  const definition = getAssessmentDefinition(requestedMode);

  return NextResponse.json({
    status: "ok",
    mode: definition.mode,
    availableModes: listAssessmentDefinitions().map((item) => ({
      mode: item.mode,
      title: item.title,
      description: item.description,
    })),
    totalSteps: definition.totalSteps,
    moduleLabels: definition.moduleLabels,
    lifeStageOptions: definition.lifeStageOptions,
    moodKeywordOptions: definition.moodKeywordOptions,
    questionTypes: listAssessmentQuestionTypes().map((item) => ({
      answerType: item.answerType,
      family: item.family,
      cardinality: item.cardinality,
      webImplementation: item.webImplementation,
      defaultPresentation: item.defaultPresentation,
    })),
    questions: definition.questions.map((question) => serializeAssessmentQuestion(question)),
    validation: definition.validation,
  });
}
