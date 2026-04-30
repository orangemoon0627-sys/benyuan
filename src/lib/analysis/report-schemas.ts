import { analysisReportSchemaConfig, type AnalysisReportSchemaConfig } from "@/config/analysis/report-schemas";
import type { Mode } from "@/lib/types";

export type AnalysisReportSchema = AnalysisReportSchemaConfig;

export type AnalysisReportSchemaKey = keyof typeof analysisReportSchemaConfig;

export function listAnalysisReportSchemas() {
  return Object.entries(analysisReportSchemaConfig).map(([key, schema]) => ({
    key: key as AnalysisReportSchemaKey,
    ...schema,
  }));
}

export function resolveAnalysisReportSchema(key?: string | null, mode?: Mode) {
  if (key === "psyche_constellation_v3") return analysisReportSchemaConfig.psyche_constellation_v3;
  if (key === "deep_focus" && mode === "deep") return analysisReportSchemaConfig.deep_focus;
  if (key === "standard") return analysisReportSchemaConfig.standard;
  return analysisReportSchemaConfig.psyche_constellation_v3;
}
