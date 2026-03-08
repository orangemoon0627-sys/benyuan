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


export type AnalysisProviderEnhancement = {
  report?: Partial<ReportPayload>;
};

export type AnalysisProvider = {
  id: string;
  label: string;
  kind: "disabled" | "openai" | "anthropic" | "custom";
  available: boolean;
  reason?: string;
  enhance(input: AnalysisInput, baseline: AnalysisEngineResult): Promise<AnalysisProviderEnhancement | null>;
};


export type AnalysisPromptPayload = {
  system: string;
  user: string;
  metadata: {
    mode: Mode;
    sessionId: string;
    questionCount: number;
    openReflectionQuestionIds: string[];
  };
};

export type AnalysisPromptShapingResult = {
  payload: AnalysisPromptPayload;
  summary: {
    answeredCount: number;
    openReflectionCount: number;
    topSignals: string[];
  };
};
