import type { Mode } from "@/lib/types";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { hybridAnalysisEngine } from "@/lib/analysis/hybrid-engine";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";

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

export function getAnalysisRuntimeStatus(mode: Mode, options?: { engine?: string | null; provider?: string | null }) {
  const config = readAnalysisRuntimeConfig(mode, options);
  const selectedEngineKey = config.selectedEngineKey;
  const engine = resolveAnalysisEngine(mode, config.selectedEngineKey);
  const provider = resolveAnalysisProvider({ provider: config.selectedProviderKey });
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
    fallbackActive,
    selectedProviderKey: config.selectedProviderKey,
    selectedPromptTemplateKey: config.selectedPromptTemplateKey,
    openAIKeyConfigured: config.openAIKeyConfigured,
    anthropicKeyConfigured: config.anthropicKeyConfigured,
    openAIModel: config.openAIModel,
    anthropicModel: config.anthropicModel,
    effectiveRuntime: fallbackActive ? "deterministic_fallback" : engine.kind === "llm" ? "hybrid_provider" : "deterministic",
  };
}
