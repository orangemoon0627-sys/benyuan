import { NextResponse } from "next/server";
import { createAnalysisJob, getSession, runAnalysis } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { sessionId?: string };

  if (!body.sessionId || !(await getSession(body.sessionId))) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const job = await createAnalysisJob(body.sessionId);
  await runAnalysis(job.jobId);

  return NextResponse.json({ jobId: job.jobId, status: job.status });
}
