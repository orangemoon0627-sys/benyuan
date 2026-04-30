import { NextResponse } from "next/server";
import { getSessionRuntime } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const runtime = await getSessionRuntime(sessionId);

  if (!runtime.session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    lifecycleStatus: runtime.session.lifecycleStatus,
    session: runtime.session,
    currentJob: runtime.currentJob,
    latestJob: runtime.latestJob,
    reportReady: Boolean(runtime.report),
    featureVectorReady: Boolean(runtime.featureVector),
  });
}
