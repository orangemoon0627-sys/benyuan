import type { FeatureVector, ReportPayload, TestSession, Mode } from "@/lib/types";

export type AnalysisEngineResult = {
  featureVector: FeatureVector;
  report: ReportPayload;
};

export type AnalysisEngine = {
  id: string;
  label: string;
  kind: "deterministic" | "llm";
  supportedModes: Mode[];
  run(session: TestSession): Promise<AnalysisEngineResult>;
};
