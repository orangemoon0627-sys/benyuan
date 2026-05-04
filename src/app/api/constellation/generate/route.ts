import { NextResponse } from "next/server";
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

  const result = await generateConstellationWithAgent(part1, part2, body.runtime_override);
  const record = {
    constellation_id: createBenyuanV3Id("const"),
    part1_id: part1.part1_id,
    part2_id: part2.part2_id,
    created_at: new Date().toISOString(),
    runtime: result.runtime,
    psyche_constellation: result.constellation,
  };

  await saveConstellationRecord(record);

  return NextResponse.json({
    constellation_id: record.constellation_id,
    runtime: record.runtime,
    psyche_constellation: record.psyche_constellation,
  });
}
