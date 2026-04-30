import { NextResponse } from "next/server";
import { createLocalPlanRun } from "@/lib/codex-platform/runtime";
import { listPlanRuns, persistPlanRun } from "@/lib/codex-platform/local-store";
import type { CreatePlanRunInput } from "@/lib/codex-platform/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    planRuns: await listPlanRuns(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CreatePlanRunInput | null;

  if (!payload?.objective || !payload.projectSpaceId) {
    return NextResponse.json({ error: "objective and projectSpaceId are required" }, { status: 400 });
  }

  const record = await persistPlanRun(await createLocalPlanRun(payload));
  return NextResponse.json({ planRun: record }, { status: 201 });
}
