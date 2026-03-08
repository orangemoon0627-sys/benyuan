import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";
import type { AnalysisEngine } from "@/lib/analysis/types";

export const hybridAnalysisEngine: AnalysisEngine = {
  id: "hybrid.v1",
  label: "Hybrid Narrative Engine",
  kind: "llm",
  supportedModes: ["lite", "deep"],
  async run(input) {
    const baseline = await deterministicAnalysisEngine.run(input);
    const provider = resolveAnalysisProvider();

    if (!provider.available) {
      return baseline;
    }

    const enhancement = await provider.enhance(input, baseline);
    if (!enhancement?.report) {
      return baseline;
    }

    return {
      ...baseline,
      report: {
        ...baseline.report,
        ...enhancement.report,
      },
    };
  },
};
