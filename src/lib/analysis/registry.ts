import type { Mode } from "@/lib/types";
import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { hybridAnalysisEngine } from "@/lib/analysis/hybrid-engine";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";

const analysisEngineRegistry = {
  deterministic: deterministicAnalysisEngine,
  hybrid: hybridAnalysisEngine,
};

const modeEngineDefaults: Record<Mode, keyof typeof analysisEngineRegistry> = {
  lite: "deterministic",
  deep: "deterministic",
};

export function getSelectedAnalysisEngineKey(mode: Mode, override?: string | null) {
  const requested = (override ?? process.env.BENYUAN_ANALYSIS_ENGINE ?? "").toLowerCase();
  if (requested === "hybrid" || requested === "deterministic") {
    return requested;
  }

  return modeEngineDefaults[mode] ?? "deterministic";
}

export function resolveAnalysisEngine(mode: Mode, override?: string | null) {
  return analysisEngineRegistry[getSelectedAnalysisEngineKey(mode, override)] ?? deterministicAnalysisEngine;
}

export function getAnalysisRuntimeStatus(mode: Mode, options?: { engine?: string | null }) {
  const selectedEngineKey = getSelectedAnalysisEngineKey(mode, options?.engine);
  const engine = resolveAnalysisEngine(mode, options?.engine);
  const provider = resolveAnalysisProvider();
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
    effectiveRuntime: fallbackActive ? "deterministic_fallback" : engine.kind === "llm" ? "hybrid_provider" : "deterministic",
  };
}
