import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { getConstellationRecord, getPart1Record, saveConstellationRecord } from "@/lib/benyuan-v3-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { constellation_id?: string; visual_prompt?: string };
  if (!body.constellation_id || !body.visual_prompt) {
    return NextResponse.json({ error: "missing_constellation_id_or_visual_prompt" }, { status: 400 });
  }

  const record = await getConstellationRecord(body.constellation_id);
  if (!record) {
    return NextResponse.json({ error: "constellation_not_found" }, { status: 404 });
  }
  let auth;
  try {
    auth = await getCurrentAuthSession(request);
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
  const part1 = await getPart1Record(record.part1_id);
  if (!part1) {
    return NextResponse.json({ error: "part1_not_found" }, { status: 404 });
  }
  if (part1.user_id !== auth.user.user_id) {
    return NextResponse.json({ error: "part1_forbidden" }, { status: 403 });
  }

  const imageUrl = `/api/image/generate?prompt=${encodeURIComponent(body.visual_prompt.slice(0, 120))}`;
  const updated = { ...record, archetype_image_url: imageUrl };
  await saveConstellationRecord(updated);

  return NextResponse.json({ image_url: imageUrl, note: "当前为占位实现，后续可接 DALL-E / Midjourney API。" });
}
