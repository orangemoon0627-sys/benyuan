import { NextResponse } from "next/server";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { listDraftSessions, listDraftWorkflowSummaries, syncWorkbenchDraftSessions } from "@/lib/store";

export async function GET() {
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  const synced = await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);

  return NextResponse.json({
    status: "ok",
    generatedAt: new Date().toISOString(),
    synced,
    drafts: await listDraftSessions(),
    workflows: await listDraftWorkflowSummaries(),
  });
}
