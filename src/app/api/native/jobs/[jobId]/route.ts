import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { getNativeGenerationJob, getPart1Record, runNativeGenerationJob } from "@/lib/benyuan-v3-store";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getNativeGenerationJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "native_generation_job_not_found" }, { status: 404 });
  }

  const part1 = await getPart1Record(job.part1_id);
  if (!part1) {
    return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  }
  const ownership = await assertPart1Owner(request, part1);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  if (job.status === "queued") {
    void runNativeGenerationJob(job.job_id).catch((error) => {
      console.error("[benyuan-native-generation-job:poll]", job.job_id, error);
    });
  }

  return NextResponse.json({
    ...job,
    progress: Math.max(0, Math.min(1, job.progress)),
    constellation_id: job.constellation_id,
  });
}
