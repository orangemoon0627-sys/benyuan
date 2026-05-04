import { after, NextResponse } from "next/server";
import { ensureAnalysisJob, getSession, runAnalysis } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { sessionId?: string };

  if (!body.sessionId || !(await getSession(body.sessionId))) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const ensured = await ensureAnalysisJob(body.sessionId);
  if (!ensured.job) {
    return NextResponse.json({ error: "analysis_job_unavailable" }, { status: 500 });
  }

  const jobId = ensured.job?.jobId;

  if (ensured.created && jobId) {
    after(async () => {
      await runAnalysis(jobId);
    });
  }

  return NextResponse.json({
    jobId: ensured.job.jobId,
    status: ensured.job.status,
    created: ensured.created,
    lifecycleStatus: ensured.runtime.session?.lifecycleStatus ?? "accepted",
    hasReport: Boolean(ensured.runtime.report),
  });
}
