import { NextResponse } from "next/server";
import { toPublicAnalysisJob } from "@/lib/benyuan-public-analysis";
import { getSessionRuntime } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const runtime = await getSessionRuntime(sessionId);

  if (!runtime.session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    sessionId: runtime.session.sessionId,
    lifecycleStatus: runtime.session.lifecycleStatus,
    currentJob: toPublicAnalysisJob(runtime.currentJob),
    latestJob: toPublicAnalysisJob(runtime.latestJob),
    reportReady: Boolean(runtime.report),
    featureVectorReady: Boolean(runtime.featureVector),
  });
}
