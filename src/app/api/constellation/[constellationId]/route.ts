import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { getConstellationRecord, getPart1Record } from "@/lib/benyuan-v3-store";

export async function GET(request: Request, context: { params: Promise<{ constellationId: string }> }) {
  try {
    const auth = await getCurrentAuthSession(request);
    const { constellationId } = await context.params;
    const record = await getConstellationRecord(constellationId);
    if (!record) {
      return NextResponse.json({ error: "constellation_not_found" }, { status: 404 });
    }

    const part1 = await getPart1Record(record.part1_id);
    if (!part1) {
      return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
    }
    if (part1.user_id !== auth.user.user_id) {
      return NextResponse.json({ error: "part1_forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      constellation: record.psyche_constellation,
      runtime: record.runtime,
      archetype_image_url: record.archetype_image_url,
      created_at: record.created_at,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
