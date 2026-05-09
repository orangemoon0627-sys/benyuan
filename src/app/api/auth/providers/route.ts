import { NextResponse } from "next/server";
import { listBenyuanAuthProviders } from "@/lib/benyuan-auth";

export async function GET() {
  return NextResponse.json(listBenyuanAuthProviders());
}
