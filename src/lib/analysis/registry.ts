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

export function getSelectedAnalysisEngineKey(mode: Mode) {
  const requested = (process.env.BENYUAN_ANALYSIS_ENGINE ?? "").toLowerCase();
  if (requested === "hybrid" || requested === "deterministic") {
    return requested;
  }

  return modeEngineDefaults[mode] ?? "deterministic";
}

export function resolveAnalysisEngine(mode: Mode) {
  return analysisEngineRegistry[getSelectedAnalysisEngineKey(mode)] ?? deterministicAnalysisEngine;
}

export function getAnalysisRuntimeStatus(mode: Mode) {
  const engine = resolveAnalysisEngine(mode);
  const provider = resolveAnalysisProvider();

  return {
    mode,
    engineId: engine.id,
    engineLabel: engine.label,
    engineKind: engine.kind,
    providerId: provider.id,
    providerKind: provider.kind,
    providerAvailable: provider.available,
    providerReason: provider.reason,
  };
}
