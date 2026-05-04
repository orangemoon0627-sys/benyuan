import { NextResponse } from "next/server";
import { benyuanPart1Questions, benyuanQuestionsByModule } from "@/lib/benyuan-v3-schema";

export async function GET() {
  return NextResponse.json({
    modules: benyuanQuestionsByModule,
    questions: benyuanPart1Questions,
  });
}
