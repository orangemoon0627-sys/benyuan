import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { listAccountHistoryForUser } from "@/lib/benyuan-v3-store";

export async function GET(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    const items = await listAccountHistoryForUser(auth.user.user_id);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
