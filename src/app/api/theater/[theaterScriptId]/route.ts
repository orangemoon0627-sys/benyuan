import { NextResponse } from "next/server";
import { getTheaterScriptRecord } from "@/lib/benyuan-v3-store";

export async function GET(_: Request, context: { params: Promise<{ theaterScriptId: string }> }) {
  const { theaterScriptId } = await context.params;
  const record = await getTheaterScriptRecord(theaterScriptId);
  if (!record) {
    return NextResponse.json({ error: "theater_script_not_found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
