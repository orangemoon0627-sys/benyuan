import { NextResponse } from "next/server";
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

  const result = await generateTheaterScriptWithAgent(part1, body.runtime_override);
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
    theater_script: record.theater_script,
  });
}
