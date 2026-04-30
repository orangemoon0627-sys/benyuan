import { NextResponse } from "next/server";
import { listAgentRuns } from "@/lib/codex-platform/local-store";
import { executeAgentRun } from "@/lib/codex-platform/runtime-service";
import type { CreateAgentRunInput } from "@/lib/codex-platform/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agentRuns: await listAgentRuns(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as CreateAgentRunInput | null;

  if (!payload?.agentType || !payload.projectSpaceId) {
    return NextResponse.json({ error: "agentType and projectSpaceId are required" }, { status: 400 });
  }

  const record = await executeAgentRun(payload);
  return NextResponse.json({ agentRun: record }, { status: 201 });
}
