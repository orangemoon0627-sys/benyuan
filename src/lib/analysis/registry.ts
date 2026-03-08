import type { Mode } from "@/lib/types";
import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";

const analysisEngineRegistry: Record<Mode, typeof deterministicAnalysisEngine> = {
  lite: deterministicAnalysisEngine,
  deep: deterministicAnalysisEngine,
};

export function resolveAnalysisEngine(mode: Mode) {
  return analysisEngineRegistry[mode] ?? deterministicAnalysisEngine;
}
