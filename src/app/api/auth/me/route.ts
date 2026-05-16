import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { updateAuthUserDisplayName } from "@/lib/benyuan-v3-store";

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

export async function PATCH(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    const body = await request.json().catch(() => ({}));
    const displayName = typeof body.display_name === "string" ? body.display_name.replace(/\s+/g, " ").trim() : "";
    if (!displayName || displayName.length > 32) {
      return NextResponse.json({ error: "invalid_display_name" }, { status: 400 });
    }

    const user = await updateAuthUserDisplayName(auth.user.user_id, displayName);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      session: auth.session,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
