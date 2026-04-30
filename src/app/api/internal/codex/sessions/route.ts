import { NextResponse } from "next/server";
import { createPlatformSession, listPlatformSessions } from "@/lib/codex-platform/local-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    sessions: await listPlatformSessions(),
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { title?: string; projectSpaceId?: string } | null;

  if (!payload?.projectSpaceId) {
    return NextResponse.json({ error: "projectSpaceId is required" }, { status: 400 });
  }

  const session = await createPlatformSession({
    title: payload.title,
    projectSpaceId: payload.projectSpaceId,
  });

  return NextResponse.json({ session }, { status: 201 });
}
