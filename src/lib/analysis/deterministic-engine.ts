import { buildFeatureVector } from "@/lib/feature-mapper";
import { buildReport } from "@/lib/report-builder";
import type { AnalysisEngine } from "@/lib/analysis/types";

export const deterministicAnalysisEngine: AnalysisEngine = {
  id: "deterministic.v1",
  label: "Deterministic Narrative Engine",
  kind: "deterministic",
  supportedModes: ["lite", "deep"],
  async run(input) {
    const featureVector = buildFeatureVector(input);
    const report = buildReport(input, featureVector);

    return {
      featureVector,
      report,
    };
  },
};
