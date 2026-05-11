import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { getPart1Record } from "@/lib/benyuan-v3-store";

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

    return NextResponse.json({
      part1_id: part1.part1_id,
      user_id: part1.user_id,
      created_at: part1.created_at,
      updated_at: part1.updated_at,
      answers: part1.answers,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
