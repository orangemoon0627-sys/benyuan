import { NextResponse } from "next/server";
import { listAssessmentDefinitionSnapshots } from "@/features/assessment";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    snapshots: listAssessmentDefinitionSnapshots(),
  });
}
