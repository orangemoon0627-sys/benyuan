import { NextResponse } from "next/server";
import { getConstellationRecord } from "@/lib/benyuan-v3-store";

export async function GET(_: Request, context: { params: Promise<{ constellationId: string }> }) {
  const { constellationId } = await context.params;
  const record = await getConstellationRecord(constellationId);
  if (!record) {
    return NextResponse.json({ error: "constellation_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    constellation: record.psyche_constellation,
    runtime: record.runtime,
    archetype_image_url: record.archetype_image_url,
    created_at: record.created_at,
  });
}
