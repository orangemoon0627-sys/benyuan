import { NextResponse } from "next/server";
import { assessmentModuleLabels, fullLiteQuestionSet, lifeStageOptions, moodKeywordOptions, assessmentTotalSteps } from "@/features/assessment";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    totalSteps: assessmentTotalSteps,
    moduleLabels: assessmentModuleLabels,
    lifeStageOptions,
    moodKeywordOptions,
    questions: fullLiteQuestionSet,
  });
}
