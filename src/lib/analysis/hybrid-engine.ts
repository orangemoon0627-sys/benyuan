import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { mergeAnalysisProviderEnhancement } from "@/lib/analysis/report-merge";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";
import type { AnalysisEngine } from "@/lib/analysis/types";

export const hybridAnalysisEngine: AnalysisEngine = {
  id: "hybrid.v1",
  label: "Hybrid Narrative Engine",
  kind: "llm",
  supportedModes: ["lite", "deep"],
  async run(input) {
    const baseline = await deterministicAnalysisEngine.run(input);
    const provider = resolveAnalysisProvider({ mode: input.session.mode });

    if (!provider.available) {
      return baseline;
    }

    const enhancement = await provider.enhance(input, baseline);
    return mergeAnalysisProviderEnhancement(baseline, enhancement);
  },
};
