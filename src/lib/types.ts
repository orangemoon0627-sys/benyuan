export type Mode = "lite" | "deep";

export type AssessmentAnswerType = "single" | "multi" | "scale" | "text" | "rank" | "image_single" | "image_multi" | "audio_single";

export type DimensionKey = "aesthetic" | "emotional" | "temporal";

export type ConstellationDimensionKey =
  | "openness"
  | "independence"
  | "emotional_depth"
  | "meaning_seeking"
  | "aesthetic_sensitivity"
  | "action_tendency"
  | "relationship_need";

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

export type SessionLifecycleStatus = "accepted" | "analyzing" | "completed" | "failed";

export interface TestSession {
  sessionId: string;
  mode: Mode;
  assessmentVersion: string;
  basicInfo: BasicInfo;
  answers: Answer[];
  lifecycleStatus: SessionLifecycleStatus;
  currentJobId?: string;
  latestReportId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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

export interface ConstellationDimensionReading {
  key: ConstellationDimensionKey;
  label: string;
  score: number;
  interpretation: string;
  evidence: EvidenceTrace[];
}

export interface GrowthSuggestion {
  title: string;
  description: string;
  actionableSteps: string[];
}

export interface CuratedRecommendation {
  title: string;
  creator?: string;
  reason: string;
}

export interface RecommendationCollections {
  books: CuratedRecommendation[];
  films: CuratedRecommendation[];
  music: CuratedRecommendation[];
}

export interface Archetype {
  name: string;
  englishName?: string;
  subtitle?: string;
  coreEssence?: string;
  visualPrompt?: string;
  description: string;
  sourceSignals: string[];
  evidence: EvidenceTrace[];
}

export interface ReportAnalysisMeta {
  engineId: string;
  engineLabel: string;
  engineKind: "deterministic" | "llm";
  effectiveRuntime: string;
  providerId: string;
  providerKind: "disabled" | "openai" | "anthropic" | "custom";
  providerAvailable: boolean;
  providerRequestMode: string;
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
  generatedFromJobId?: string;
}

export interface ReportPayload {
  reportId: string;
  sessionId: string;
  overview: string;
  narrativeOverview?: string;
  dimensionReadings: DimensionReading[];
  sevenDimensions?: ConstellationDimensionReading[];
  tensions: TensionInsight[];
  archetype: Archetype;
  recommendations: RecommendationItem[];
  growthSuggestions?: GrowthSuggestion[];
  curatedRecommendations?: RecommendationCollections;
  safetyFlags: SafetyFlag[];
  confidenceBand: ConfidenceBand;
  generatedAt: string;
  promptVersion: string;
  reportSchemaVersion: string;
  analysisMeta?: ReportAnalysisMeta;
}

export type AnalysisPipelineStageStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface AnalysisPipelineStageRecord {
  key: string;
  title: string;
  status: AnalysisPipelineStageStatus;
  detail: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface AnalysisJob {
  jobId: string;
  sessionId: string;
  status: "queued" | "running" | "done" | "failed";
  attempt: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  engineId?: string;
  engineLabel?: string;
  engineKind?: "deterministic" | "llm";
  effectiveRuntime?: string;
  providerId?: string;
  providerKind?: "disabled" | "openai" | "anthropic" | "custom";
  providerRequestMode?: string;
  providerModel?: string;
  providerEnhancementStatus?: "completed" | "timed_out" | "skipped" | "empty";
  providerLatencyMs?: number;
  providerFallbackReason?: string;
  providerCompletedScopes?: string[];
  providerTextReceived?: boolean;
  providerResponsePreview?: string;
  promptTemplateId?: string;
  promptTemplateVersion?: string;
  reportSchemaId?: string;
  reportSchemaVersion?: string;
  answeredCount?: number;
  openReflectionCount?: number;
  topSignals?: string[];
  currentStageKey?: string;
  pipelineStages?: AnalysisPipelineStageRecord[];
  reportId?: string;
  error?: string;
}


export type DraftSessionKind = "assessment_content" | "analysis_admin";

export interface DraftSessionRecord {
  draftId: string;
  kind: DraftSessionKind;
  title: string;
  status: "synced" | "updated";
  sourceKey: string;
  mode?: Mode;
  baseVersion?: string;
  targetVersion?: string;
  summary: string;
  targetFiles: string[];
  linkedRoutes: string[];
  linkedDraftIds: string[];
  payloadSignature: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftSimulationImpactArea {
  key: string;
  title: string;
  severity: "notice" | "warning" | "blocking";
  summary: string;
  reasons: string[];
  routes: string[];
}

export interface DraftSimulationRouteCheck {
  route: string;
  title: string;
  reason: string;
  priority: "primary" | "secondary";
  checks: string[];
}

export type DraftWorkflowState = "apply_candidate" | "review_required" | "ready_to_apply";

export type DraftReviewPriority = "critical" | "high" | "normal";

export type DraftMilestoneStatus = "pending" | "in_progress" | "done";

export type DraftRouteReviewState = "pending" | "in_progress" | "completed";

export type DraftDeliveryStatus = "freeze_candidate" | "apply_queue" | "archived";

export interface DraftWorkflowMilestone {
  key: string;
  title: string;
  status: DraftMilestoneStatus;
  detail: string;
}

export interface DraftWorkflowRouteProgress {
  route: string;
  title: string;
  priority: "primary" | "secondary";
  state: DraftRouteReviewState;
  completedChecks: number;
  totalChecks: number;
}

export interface DraftWorkflowSummary {
  draftId: string;
  state: DraftWorkflowState;
  reviewPriority: DraftReviewPriority;
  deliveryStatus: DraftDeliveryStatus;
  nextAction: string;
  lastCheckedAt: string;
  blockingImpactCount: number;
  routeCount: number;
  linkedDraftCount: number;
  readinessScore: number;
  milestones: DraftWorkflowMilestone[];
  routeProgress: DraftWorkflowRouteProgress[];
}

export interface DraftRouteSessionSummary {
  route: string;
  draft: DraftSessionRecord;
  simulation?: DraftSimulationResult;
  routeCheck?: DraftSimulationRouteCheck;
  workflow?: DraftWorkflowSummary;
}

export interface DraftSimulationResult {
  draftId: string;
  status: "ready" | "review_required";
  kind: DraftSessionKind;
  applyOrder: string[];
  refreshedRoutes: string[];
  impactedDraftIds: string[];
  touchedFiles: string[];
  verificationChecklist: string[];
  notes: string[];
  impactAreas: DraftSimulationImpactArea[];
  routeChecks: DraftSimulationRouteCheck[];
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
