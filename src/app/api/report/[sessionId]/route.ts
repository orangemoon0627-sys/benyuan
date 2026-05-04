import { NextResponse } from "next/server";
import { getSessionRuntime } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const runtime = await getSessionRuntime(sessionId);

  if (!runtime.session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (!runtime.report) {
    return NextResponse.json(
      {
        status: runtime.currentJob?.status ?? "pending",
        lifecycleStatus: runtime.session.lifecycleStatus,
        currentJob: runtime.currentJob,
        latestJob: runtime.latestJob,
        report: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: "done",
    lifecycleStatus: runtime.session.lifecycleStatus,
    currentJob: runtime.currentJob,
    latestJob: runtime.latestJob,
    report: runtime.report,
  });
}
