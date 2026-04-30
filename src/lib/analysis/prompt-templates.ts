import { analysisPromptTemplateConfig, type AnalysisPromptTemplateConfig } from "@/config/analysis/prompt-templates";
import type { Mode } from "@/lib/types";

export type AnalysisPromptTemplate = AnalysisPromptTemplateConfig;

export type AnalysisPromptTemplateKey = keyof typeof analysisPromptTemplateConfig;

export function listAnalysisPromptTemplates() {
  return Object.entries(analysisPromptTemplateConfig).map(([key, template]) => ({
    key: key as AnalysisPromptTemplateKey,
    ...template,
  }));
}

export function resolveAnalysisPromptTemplate(key?: string | null, mode?: Mode) {
  if (key === "constellation_v3") return analysisPromptTemplateConfig.constellation_v3;
  if (key === "depth" && mode === "deep") return analysisPromptTemplateConfig.depth;
  if (key === "core") return analysisPromptTemplateConfig.core;
  return analysisPromptTemplateConfig.constellation_v3;
}
