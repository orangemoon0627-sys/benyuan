import type { AssessmentAnswerType, FeatureVector, ReportPayload, TestSession, Mode } from "@/lib/types";
import type { AnalysisProviderRequestMode } from "@/lib/analysis/config";

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

export type AnalysisStageReporter = (update: {
  key: AnalysisPipelineStageKey;
  status?: AnalysisPipelineStageStatus;
  detail: string;
}) => Promise<void> | void;

export type AnalysisInput = {
  session: TestSession;
  questionSet: AnalysisQuestionContract[];
  questionMap: Map<string, AnalysisQuestionContract>;
  openReflectionQuestionIds: string[];
  stageReporter?: AnalysisStageReporter;
};

export type AnalysisPipelineStageKey =
  | "input_prepared"
  | "prompt_shaped"
  | "feature_mapped"
  | "provider_enhanced"
  | "report_built"
  | "persisted";

export type AnalysisPipelineStageStatus = "pending" | "running" | "done" | "skipped" | "failed";

export type AnalysisPipelineStageSnapshot = {
  key: AnalysisPipelineStageKey;
  title: string;
  status: AnalysisPipelineStageStatus;
  detail: string;
  startedAt?: string;
  finishedAt?: string;
};

export type AnalysisEngineTrace = {
  engineId: string;
  engineLabel: string;
  engineKind: "deterministic" | "llm";
  providerId: string;
  providerKind: "disabled" | "openai" | "anthropic" | "custom";
  providerAvailable: boolean;
  providerRequestMode: AnalysisProviderRequestMode;
  providerModel?: string;
  providerRequestId?: string;
  providerEnhancementStatus?: "completed" | "timed_out" | "skipped" | "empty";
  providerLatencyMs?: number;
  providerFallbackReason?: string;
  providerCompletedScopes?: string[];
  providerTextReceived?: boolean;
  providerResponsePreview?: string;
  promptTemplateId: string;
  promptTemplateVersion: string;
  reportSchemaId: string;
  reportSchemaVersion: string;
  answeredCount: number;
  openReflectionCount: number;
  topSignals: string[];
  effectiveRuntime: string;
};

export type AnalysisEngineResult = {
  featureVector: FeatureVector;
  report: ReportPayload;
  trace: AnalysisEngineTrace;
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
  metadata?: {
    providerId: string;
    promptTemplateId?: string;
    promptTemplateVersion?: string;
    requestMode?: AnalysisProviderRequestMode;
    model?: string;
    requestId?: string;
    completedScopes?: string[];
    textReceived?: boolean;
    responsePreview?: string;
  };
};

export type AnalysisProvider = {
  id: string;
  label: string;
  kind: "disabled" | "openai" | "anthropic" | "custom";
  available: boolean;
  requestMode: AnalysisProviderRequestMode;
  model?: string;
  reason?: string;
  enhance(input: AnalysisInput, baseline: AnalysisEngineResult): Promise<AnalysisProviderEnhancement | null>;
};

export type AnalysisPromptPayload = {
  system: string;
  user: string;
  metadata: {
    templateId: string;
    templateVersion: string;
    mode: Mode;
    sessionId: string;
    questionCount: number;
    openReflectionQuestionIds: string[];
  };
};

export type AnalysisPromptShapingResult = {
  template: {
    id: string;
    version: string;
    label: string;
  };
  payload: AnalysisPromptPayload;
  summary: {
    answeredCount: number;
    openReflectionCount: number;
    topSignals: string[];
  };
};
