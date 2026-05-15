import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { agentRouteErrorResponse } from "@/lib/benyuan-agent-route-errors";
import { recordBenyuanAgentTiming } from "@/lib/benyuan-agent-timing";
import { generateConstellationWithAgent } from "@/lib/benyuan-v3-agent";
import { createBenyuanV3Id, getPart1Record, getPart2Record, saveConstellationRecord } from "@/lib/benyuan-v3-store";
import type { AgentRuntimeOverride } from "@/lib/benyuan-v3-types";

export async function POST(request: Request) {
  const body = (await request.json()) as { part1_id?: string; part2_id?: string; runtime_override?: AgentRuntimeOverride };
  if (!body.part1_id || !body.part2_id) {
    return NextResponse.json({ error: "missing_part1_id_or_part2_id" }, { status: 400 });
  }

  const [part1, part2] = await Promise.all([getPart1Record(body.part1_id), getPart2Record(body.part2_id)]);
  if (!part1) return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  if (!part2) return NextResponse.json({ error: "part2_not_found" }, { status: 404 });
  const ownership = await assertPart1Owner(request, part1);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }
  if (part2.part1_id !== part1.part1_id) {
    return NextResponse.json({ error: "part2_part1_mismatch" }, { status: 409 });
  }

  const startedAt = Date.now();
  try {
    const result = await generateConstellationWithAgent(part1, part2, body.runtime_override);
    const timing = await recordBenyuanAgentTiming({
      stage: "constellation",
      duration_ms: Date.now() - startedAt,
      runtime_mode: result.runtime.mode,
      provider: result.runtime.provider,
      model: result.runtime.model,
      error: result.runtime.error,
      request_id: result.runtime.request_id,
      part1_id: part1.part1_id,
      part2_id: part2.part2_id,
    });
    const record = {
      constellation_id: createBenyuanV3Id("const"),
      part1_id: part1.part1_id,
      part2_id: part2.part2_id,
      data_cohort: part1.data_cohort,
      data_environment: part1.data_environment,
      created_at: new Date().toISOString(),
      runtime: result.runtime,
      psyche_constellation: result.constellation,
    };

    await saveConstellationRecord(record);

    return NextResponse.json({
      constellation_id: record.constellation_id,
      runtime: record.runtime,
      timing,
      psyche_constellation: record.psyche_constellation,
    });
  } catch (error) {
    return agentRouteErrorResponse({
      error,
      stage: "constellation",
      part1Id: part1.part1_id,
      part2Id: part2.part2_id,
      startedAt,
    });
  }
}
