import { NextResponse } from "next/server";
import { BenyuanAuthError, verifyPhoneOtpAndCreateSession } from "@/lib/benyuan-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string };

  try {
    const auth = await verifyPhoneOtpAndCreateSession({ phone: body.phone, code: body.code });
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
