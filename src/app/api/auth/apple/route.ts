import { NextResponse } from "next/server";
import { BenyuanAuthError, createAppleAuthSession } from "@/lib/benyuan-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    identity_token?: string;
    authorization_code?: string;
    display_name?: string;
  };
  const identityToken = typeof body.identity_token === "string" ? body.identity_token.trim() : "";
  const authorizationCode = typeof body.authorization_code === "string" ? body.authorization_code.trim() : "";

  if (!identityToken && !authorizationCode) {
    return NextResponse.json({ error: "missing_apple_credential" }, { status: 400 });
  }

  let auth;
  try {
    auth = await createAppleAuthSession({
      identityToken,
      authorizationCode,
      displayName: body.display_name,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }

  return NextResponse.json({
    user: auth.user,
    session: auth.session,
  });
}
