import { NextResponse } from "next/server";
import { createAnonymousAuthSession } from "@/lib/benyuan-auth";

export async function POST() {
  const auth = await createAnonymousAuthSession();

  return NextResponse.json({
    user: auth.user,
    session: auth.session,
  });
}
