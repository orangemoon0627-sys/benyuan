import { NextResponse } from "next/server";
import { assertPart1Owner } from "@/lib/benyuan-auth";
import { createBenyuanV3Id, getPart1Record, getTheaterScriptRecord, savePart2Record } from "@/lib/benyuan-v3-store";
import type { Part2ChoiceRecord, Part2Metadata, Part2MirrorRecord } from "@/lib/benyuan-v3-types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    part1_id?: string;
    theater_script_id?: string;
    act2_choices?: Part2ChoiceRecord[];
    act3_responses?: Part2MirrorRecord[];
    metadata?: Part2Metadata;
  };

  if (!body.part1_id || !body.theater_script_id) {
    return NextResponse.json({ error: "missing_part1_id_or_theater_script_id" }, { status: 400 });
  }

  const [part1, theaterScript] = await Promise.all([getPart1Record(body.part1_id), getTheaterScriptRecord(body.theater_script_id)]);
  if (!part1) return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  if (!theaterScript) return NextResponse.json({ error: "theater_script_not_found" }, { status: 404 });
  const ownership = await assertPart1Owner(request, part1);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }
  if (theaterScript.part1_id !== part1.part1_id) {
    return NextResponse.json({ error: "theater_script_part1_mismatch" }, { status: 409 });
  }

  const record = {
    part2_id: createBenyuanV3Id("part2"),
    part1_id: body.part1_id,
    theater_script_id: body.theater_script_id,
    created_at: new Date().toISOString(),
    act2_choices: body.act2_choices ?? [],
    act3_responses: body.act3_responses ?? [],
    metadata: body.metadata ?? {},
  };

  await savePart2Record(record);

  return NextResponse.json({
    part2_id: record.part2_id,
    part1_id: record.part1_id,
    theater_script_id: record.theater_script_id,
    act2_choice_count: record.act2_choices.length,
    act3_response_count: record.act3_responses.length,
  });
}
