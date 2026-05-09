import { NextResponse } from "next/server";
import { BenyuanAuthError, requestPhoneOtp } from "@/lib/benyuan-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: string };

  try {
    return NextResponse.json(await requestPhoneOtp({ phone: body.phone, request }));
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
