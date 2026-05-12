import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { getPart1Record, getPart2Record, runNativeGenerationJob, shouldResumeNativeGenerationJob, startNativeGenerationJob } from "@/lib/benyuan-v3-store";
import type { BenyuanNativeGenerationJobKind } from "@/lib/benyuan-v3-types";

type NativeGenerationJobStartBody = {
  kind?: BenyuanNativeGenerationJobKind;
  part1_id?: string;
  part2_id?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as NativeGenerationJobStartBody;
  if (body.kind !== "theater" && body.kind !== "constellation") {
    return NextResponse.json({ error: "invalid_native_generation_kind" }, { status: 400 });
  }
  if (!body.part1_id) {
    return NextResponse.json({ error: "missing_part1_id" }, { status: 400 });
  }

  const part1 = await getPart1Record(body.part1_id);
  if (!part1) {
    return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  }
  const ownership = await assertPart1Owner(request, part1);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  if (body.kind === "constellation") {
    if (!body.part2_id) {
      return NextResponse.json({ error: "missing_part2_id" }, { status: 400 });
    }
    const part2 = await getPart2Record(body.part2_id);
    if (!part2) {
      return NextResponse.json({ error: "part2_not_found" }, { status: 404 });
    }
    if (part2.part1_id !== part1.part1_id) {
      return NextResponse.json({ error: "part2_part1_mismatch" }, { status: 409 });
    }
  }

  const job = await startNativeGenerationJob({
    kind: body.kind,
    part1Id: part1.part1_id,
    part2Id: body.part2_id,
  });
  if (!job) {
    return NextResponse.json({ error: "native_generation_job_not_created" }, { status: 500 });
  }

  if (job.status === "queued" || shouldResumeNativeGenerationJob(job)) {
    void runNativeGenerationJob(job.job_id).catch((error) => {
      console.error("[benyuan-native-generation-job]", job.job_id, error);
    });
  }

  return NextResponse.json(job);
}
