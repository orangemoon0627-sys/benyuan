import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { getPart1Record, getTheaterScriptRecord } from "@/lib/benyuan-v3-store";

export async function GET(request: Request, context: { params: Promise<{ theaterScriptId: string }> }) {
  try {
    const auth = await getCurrentAuthSession(request);
    const { theaterScriptId } = await context.params;
    const record = await getTheaterScriptRecord(theaterScriptId);
    if (!record) {
      return NextResponse.json({ error: "theater_script_not_found" }, { status: 404 });
    }

    const part1 = await getPart1Record(record.part1_id);
    if (!part1) {
      return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
    }
    if (part1.user_id !== auth.user.user_id) {
      return NextResponse.json({ error: "part1_forbidden" }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
