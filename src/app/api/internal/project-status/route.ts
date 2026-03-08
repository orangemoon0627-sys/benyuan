import { NextResponse } from "next/server";
import { projectRoadmapBoard } from "@/lib/project-roadmap";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    board: projectRoadmapBoard,
  });
}
