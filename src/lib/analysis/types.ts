import type { AssessmentAnswerType, FeatureVector, ReportPayload, TestSession, Mode } from "@/lib/types";


export type AnalysisQuestionContract = {
  questionId: string;
  moduleId: string;
  answerType: AssessmentAnswerType;
  prompt: string;
  optional?: boolean;
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
};

export type AnalysisInput = {
  session: TestSession;
  questionSet: AnalysisQuestionContract[];
  questionMap: Map<string, AnalysisQuestionContract>;
  openReflectionQuestionIds: string[];
};

export type AnalysisEngineResult = {
  featureVector: FeatureVector;
  report: ReportPayload;
};

export type AnalysisEngine = {
  id: string;
  label: string;
  kind: "deterministic" | "llm";
  supportedModes: Mode[];
  run(input: AnalysisInput): Promise<AnalysisEngineResult>;
};
