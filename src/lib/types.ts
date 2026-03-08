export type Mode = "lite" | "deep";

export type AssessmentAnswerType = "single" | "multi" | "scale" | "text" | "rank" | "image_single" | "image_multi" | "audio_single";

export type DimensionKey = "aesthetic" | "emotional" | "temporal";

export type ConfidenceBand = "low" | "medium" | "high";

export type SafetyFlag =
  | "none"
  | "high_sensitivity"
  | "existential_distress"
  | "trauma_signal"
  | "self_harm_risk"
  | "low_information";

export interface BasicInfo {
  lifeStage?:
    | "student"
    | "early_career"
    | "stable_period"
    | "turning_point"
    | "exploration";
  moodKeywords: string[];
}

export interface Answer {
  questionId: string;
  moduleId: string;
  answerType: AssessmentAnswerType;
  value: string | string[] | number;
  rawLabel?: string;
}

export interface TestSession {
  sessionId: string;
  mode: Mode;
  assessmentVersion: string;
  basicInfo: BasicInfo;
  answers: Answer[];
  createdAt: string;
}

export interface FeatureVector {
  sessionId: string;
  values: Record<string, number>;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  mappingVersion: string;
}

export interface EvidenceTrace {
  questionId: string;
  prompt: string;
  answerLabel: string;
  signal: string;
  featureKey?: string;
  featureScore?: number;
}

export interface TensionInsight {
  tensionId: string;
  name: string;
  poles: [string, string];
  description: string;
  suggestion: string;
  confidenceScore: number;
  evidence: EvidenceTrace[];
}

export interface DimensionReading {
  dimension: DimensionKey;
  title: string;
  summary: string;
  confidenceBand: ConfidenceBand;
  evidence: EvidenceTrace[];
}

export interface RecommendationItem {
  type: "philosophy" | "book" | "music" | "practice";
  title: string;
  description: string;
}

export interface Archetype {
  name: string;
  subtitle?: string;
  description: string;
  sourceSignals: string[];
  evidence: EvidenceTrace[];
}

export interface ReportPayload {
  reportId: string;
  sessionId: string;
  overview: string;
  dimensionReadings: DimensionReading[];
  tensions: TensionInsight[];
  archetype: Archetype;
  recommendations: RecommendationItem[];
  safetyFlags: SafetyFlag[];
  confidenceBand: ConfidenceBand;
  generatedAt: string;
  promptVersion: string;
  reportSchemaVersion: string;
}

export interface AnalysisJob {
  jobId: string;
  sessionId: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  finishedAt?: string;
}

export interface ReviewRecord {
  sampleId: string;
  decision: "pass" | "fail" | "pass_with_review";
  scores: {
    resonance: number;
    specificity: number;
    coherence: number;
    evidenceTraceability: number;
    safety: number;
    recommendationFit: number;
  };
  failureLabels: string[];
  notes: string;
}
