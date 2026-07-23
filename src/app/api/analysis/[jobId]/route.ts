import { NextResponse } from "next/server";
import { toPublicAnalysisJob } from "@/lib/benyuan-public-analysis";
import { getJob } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  return NextResponse.json(toPublicAnalysisJob(job));
}
