import { NextResponse } from "next/server";
import { BenyuanAuthError, createWechatAuthSession, readAuthFromRequest } from "@/lib/benyuan-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    display_name?: string;
  };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "missing_wechat_code" }, { status: 400 });
  }

  try {
    const auth = await createWechatAuthSession({
      code,
      displayName: body.display_name,
      existingAuth: await readAuthFromRequest(request),
    });
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
