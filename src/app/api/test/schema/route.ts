import { NextResponse } from "next/server";
import { defaultAssessmentMode, getAssessmentDefinition, listAssessmentDefinitions } from "@/features/assessment";
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
    questions: definition.questions,
    validation: definition.validation,
  });
}
