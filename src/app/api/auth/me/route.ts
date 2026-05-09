import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";

export async function GET(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    return NextResponse.json({
      user: auth.user,
      session: auth.session,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
