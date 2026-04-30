import { NextResponse } from "next/server";
import { buildAssessmentContentWorkbench } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { draftIdFromSegments } from "@/lib/draft-routing";
import { getDraftSession, getDraftWorkflowSummary, getLinkedDraftSessions, listDraftSessions, syncWorkbenchDraftSessions } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ draftId?: string[] }> }) {
  const resolved = await params;
  const draftId = draftIdFromSegments(resolved.draftId);
  const content = buildAssessmentContentWorkbench();
  const analysis = buildAnalysisWorkbenchCatalog(content.draftBlueprints);
  await syncWorkbenchDraftSessions(content.draftBlueprints, analysis.impactMatrix);

  const draft = await getDraftSession(draftId);
  if (!draft) {
    return NextResponse.json({ status: "not_found", draftId }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    generatedAt: new Date().toISOString(),
    draft,
    linkedDrafts: await getLinkedDraftSessions(draftId),
    allDrafts: await listDraftSessions(),
    workflow: await getDraftWorkflowSummary(draftId),
    contentDraft: content.draftBlueprints.find((item) => item.draftId === draftId) ?? null,
    analysisDraft: analysis.impactMatrix.find((item) => item.draftId === draftId) ?? null,
  });
}
