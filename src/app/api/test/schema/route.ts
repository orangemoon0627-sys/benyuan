import { NextResponse } from "next/server";
import {
  defaultAssessmentMode,
  getAssessmentDefinition,
  listAssessmentDefinitions,
  listAssessmentQuestionTypes,
  listAssessmentVersions,
  serializeAssessmentQuestion,
} from "@/features/assessment";
import type { Mode } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedMode = (searchParams.get("mode") as Mode | null) ?? defaultAssessmentMode;
  const requestedVersion = searchParams.get("version");
  const definition = getAssessmentDefinition(requestedMode, requestedVersion);

  return NextResponse.json({
    status: "ok",
    mode: definition.mode,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    storageKey: definition.storageKey,
    initialState: definition.initialState,
    availableVersions: listAssessmentVersions(definition.mode),
    availableModes: listAssessmentDefinitions().map((item) => ({
      mode: item.mode,
      activeVersion: item.version,
      title: item.title,
      description: item.description,
      totalSteps: item.totalSteps,
      phases: item.phases,
      versions: listAssessmentVersions(item.mode),
    })),
    totalSteps: definition.totalSteps,
    phases: definition.phases,
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
