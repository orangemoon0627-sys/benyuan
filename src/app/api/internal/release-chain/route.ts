import { NextResponse } from "next/server";
import { getReleaseChainSnapshot } from "@/lib/release-chain";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    snapshot: await getReleaseChainSnapshot(),
  });
}
