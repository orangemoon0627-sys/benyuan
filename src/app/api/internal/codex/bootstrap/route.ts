import { NextResponse } from "next/server";
import { buildCodexPlatformBootstrap } from "@/lib/codex-platform/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  const bootstrap = await buildCodexPlatformBootstrap();
  return NextResponse.json(bootstrap);
}
