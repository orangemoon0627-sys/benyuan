import { NextResponse } from "next/server";
import { getCurrentAuthSession, BenyuanAuthError } from "@/lib/benyuan-auth";
import { getNativeGenerationJob, getPart1Record, presentNativeGenerationJob, runNativeGenerationJob, shouldResumeNativeGenerationJob } from "@/lib/benyuan-v3-store";

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
  let auth;
  try {
    auth = await getCurrentAuthSession(request);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
  if (auth.user.user_id !== part1.user_id) {
    return NextResponse.json({ error: "part1_forbidden" }, { status: 403 });
  }

  if (job.status === "queued" || shouldResumeNativeGenerationJob(job)) {
    void runNativeGenerationJob(job.job_id).catch((error) => {
      console.error("[benyuan-native-generation-job:poll]", job.job_id, error);
    });
  }

  const presentedJob = presentNativeGenerationJob(job);

  return NextResponse.json({
    ...presentedJob,
    progress: Math.max(0, Math.min(1, presentedJob.progress)),
    constellation_id: job.constellation_id,
  });
}
