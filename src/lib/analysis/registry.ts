import type { Mode } from "@/lib/types";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { hybridAnalysisEngine } from "@/lib/analysis/hybrid-engine";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";
import { resolveAnalysisPromptTemplate } from "@/lib/analysis/prompt-templates";
import { resolveAnalysisReportSchema } from "@/lib/analysis/report-schemas";

const analysisEngineRegistry = {
  deterministic: deterministicAnalysisEngine,
  hybrid: hybridAnalysisEngine,
};

export function getSelectedAnalysisEngineKey(mode: Mode, override?: string | null) {
  return readAnalysisRuntimeConfig(mode, { engine: override }).selectedEngineKey;
}

export function resolveAnalysisEngine(mode: Mode, override?: string | null) {
  return analysisEngineRegistry[getSelectedAnalysisEngineKey(mode, override)] ?? deterministicAnalysisEngine;
}

export function getAnalysisRuntimeStatus(
  mode: Mode,
  options?: { engine?: string | null; provider?: string | null; promptTemplate?: string | null; reportSchema?: string | null },
) {
  const config = readAnalysisRuntimeConfig(mode, options);
  const selectedEngineKey = config.selectedEngineKey;
  const engine = resolveAnalysisEngine(mode, config.selectedEngineKey);
  const provider = resolveAnalysisProvider({ mode, provider: config.selectedProviderKey });
  const promptTemplate = resolveAnalysisPromptTemplate(config.selectedPromptTemplateKey, mode);
  const reportSchema = resolveAnalysisReportSchema(config.selectedReportSchemaKey, mode);
  const fallbackActive = selectedEngineKey === "hybrid" && !provider.available;

  return {
    mode,
    selectedEngineKey,
    engineId: engine.id,
    engineLabel: engine.label,
    engineKind: engine.kind,
    providerId: provider.id,
    providerKind: provider.kind,
    providerAvailable: provider.available,
    providerReason: provider.reason,
    providerRequestMode: provider.requestMode,
    providerModel: provider.model,
    fallbackActive,
    selectedProviderKey: config.selectedProviderKey,
    selectedPromptTemplateKey: config.selectedPromptTemplateKey,
    selectedReportSchemaKey: config.selectedReportSchemaKey,
    promptTemplateId: promptTemplate.id,
    promptTemplateVersion: promptTemplate.version,
    reportSchemaId: reportSchema.id,
    reportSchemaVersion: reportSchema.version,
    openAIKeyConfigured: config.openAIKeyConfigured,
    anthropicKeyConfigured: config.anthropicKeyConfigured,
    customKeyConfigured: config.customKeyConfigured,
    openAIModel: config.openAIModel,
    anthropicModel: config.anthropicModel,
    customModel: config.customModel,
    customBaseUrl: config.customBaseUrl,
    customProviderName: config.customProviderName,
    liveProviderEnabled: config.liveProviderEnabled,
    providerTimeoutMs: config.providerTimeoutMs,
    providerSoftTimeoutMs: config.providerSoftTimeoutMs,
    effectiveRuntime: fallbackActive ? "deterministic_fallback" : engine.kind === "llm" ? "hybrid_provider" : "deterministic",
  };
}
