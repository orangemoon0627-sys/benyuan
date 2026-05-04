import { NextResponse } from "next/server";
import { getAnalysisRuntimeStatus, listAnalysisPromptTemplates, listAnalysisReportSchemas } from "@/lib/analysis";
import type { Mode } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedMode = (searchParams.get("mode") as Mode | null) ?? "lite";
  const mode: Mode = requestedMode === "deep" ? "deep" : "lite";

  const requestedEngine = searchParams.get("engine");
  const requestedProvider = searchParams.get("provider");
  const requestedPromptTemplate = searchParams.get("promptTemplate");
  const requestedReportSchema = searchParams.get("reportSchema");

  return NextResponse.json({
    status: "ok",
    runtime: getAnalysisRuntimeStatus(mode, {
      engine: requestedEngine,
      provider: requestedProvider,
      promptTemplate: requestedPromptTemplate,
      reportSchema: requestedReportSchema,
    }),
    promptTemplates: listAnalysisPromptTemplates(),
    reportSchemas: listAnalysisReportSchemas(),
  });
}
