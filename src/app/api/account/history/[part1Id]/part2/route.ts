import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { getPart1Record, getPart2Record, getPart2RecordForPart1 } from "@/lib/benyuan-v3-store";

export async function GET(request: Request, context: { params: Promise<{ part1Id: string }> }) {
  try {
    const auth = await getCurrentAuthSession(request);
    const { part1Id } = await context.params;
    const part1 = await getPart1Record(part1Id);
    if (!part1) {
      return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
    }
    if (part1.user_id !== auth.user.user_id) {
      return NextResponse.json({ error: "part1_forbidden" }, { status: 403 });
    }

    const part2Id = new URL(request.url).searchParams.get("part2_id") ?? undefined;
    const part2 = part2Id ? await getPart2Record(part2Id) : await getPart2RecordForPart1(part1.part1_id);
    if (!part2 || part2.part1_id !== part1.part1_id) {
      return NextResponse.json({ error: "part2_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      part2_id: part2.part2_id,
      part1_id: part2.part1_id,
      theater_script_id: part2.theater_script_id,
      created_at: part2.created_at,
      act2_choices: part2.act2_choices,
      act3_responses: part2.act3_responses,
      metadata: part2.metadata,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
