import { NextResponse } from "next/server";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { getDraftDeliverySnapshot, syncWorkbenchDraftSessions } from "@/lib/store";

export async function GET() {
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);

  return NextResponse.json({
    status: "ok",
    snapshot: await getDraftDeliverySnapshot(),
  });
}
