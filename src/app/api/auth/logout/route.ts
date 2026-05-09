import { NextResponse } from "next/server";
import { BenyuanAuthError, logoutAuthSession } from "@/lib/benyuan-auth";

export async function POST(request: Request) {
  try {
    return NextResponse.json(await logoutAuthSession(request));
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
