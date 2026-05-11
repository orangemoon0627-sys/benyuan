import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { agentRouteErrorResponse } from "@/lib/benyuan-agent-route-errors";
import { recordBenyuanAgentTiming } from "@/lib/benyuan-agent-timing";
import { generateTheaterScriptWithAgent } from "@/lib/benyuan-v3-agent";
import { createBenyuanV3Id, getPart1Record, saveTheaterScriptRecord } from "@/lib/benyuan-v3-store";
import type { AgentRuntimeOverride } from "@/lib/benyuan-v3-types";

export async function POST(request: Request) {
  const body = (await request.json()) as { part1_id?: string; runtime_override?: AgentRuntimeOverride };
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

  const startedAt = Date.now();
  try {
    const result = await generateTheaterScriptWithAgent(part1, body.runtime_override);
    const timing = await recordBenyuanAgentTiming({
      stage: "theater",
      duration_ms: Date.now() - startedAt,
      runtime_mode: result.runtime.mode,
      provider: result.runtime.provider,
      model: result.runtime.model,
      error: result.runtime.error,
      request_id: result.runtime.request_id,
      part1_id: part1.part1_id,
    });
    const record = {
      theater_script_id: createBenyuanV3Id("theater"),
      part1_id: part1.part1_id,
      created_at: new Date().toISOString(),
      runtime: result.runtime,
      theater_script: result.theaterScript,
    };

    await saveTheaterScriptRecord(record);

    return NextResponse.json({
      theater_script_id: record.theater_script_id,
      part1_id: record.part1_id,
      runtime: record.runtime,
      timing,
      theater_script: record.theater_script,
    });
  } catch (error) {
    return agentRouteErrorResponse({
      error,
      stage: "theater",
      part1Id: part1.part1_id,
      startedAt,
    });
  }
}
