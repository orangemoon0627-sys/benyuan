# "Benyuan" Shared Schema v0.1

This document defines the shared contract for the first MVP.

## 1. Scope of v0.1

Dimensions included:
- `aesthetic`
- `emotional`
- `temporal`

Future dimensions are reserved but not required for MVP.

## 2. Core Objects

```ts
export type Mode = "lite" | "deep";

export type DimensionKey =
  | "aesthetic"
  | "emotional"
  | "temporal";

export type ConfidenceBand = "low" | "medium" | "high";

export type SafetyFlag =
  | "none"
  | "high_sensitivity"
  | "existential_distress"
  | "trauma_signal"
  | "self_harm_risk"
  | "low_information";
```

## 3. Session Input

```ts
export interface BasicInfo {
  birthTime?: string;
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
  answerType: "single" | "multi" | "scale" | "text";
  value: string | string[] | number;
  rawLabel?: string;
}

export interface TestSession {
  sessionId: string;
  userId?: string;
  mode: Mode;
  basicInfo: BasicInfo;
  answers: Answer[];
  createdAt: string;
}
```

Rules:
- `mode=lite` is required for MVP.
- `answers` must preserve raw option IDs and labels for traceability.
- optional text answers are allowed, but the system must still work without them.

## 4. Question Bank

```ts
export interface QuestionOption {
  optionId: string;
  label: string;
  weights: Partial<Record<FeatureKey, number>>;
  tags?: string[];
}

export interface Question {
  questionId: string;
  moduleId: "cognitive_snapshot" | "emotional_weather" | "aesthetic_fingerprint" | "desire_projection";
  dimensionTargets: DimensionKey[];
  prompt: string;
  answerType: "single" | "multi" | "scale" | "text";
  options?: QuestionOption[];
  minSelections?: number;
  maxSelections?: number;
  required: boolean;
  version: string;
}
```

MVP note:
- `cognitive_snapshot` and `desire_projection` can exist as support modules but only contribute weakly to the three active dimensions unless explicitly mapped.

## 5. Feature Layer

```ts
export type FeatureKey =
  | "aesthetic_literary_existential"
  | "aesthetic_literary_tenderness"
  | "aesthetic_music_intensity"
  | "aesthetic_music_nocturnal"
  | "aesthetic_visual_surreal"
  | "aesthetic_visual_minimal"
  | "aesthetic_niche_orientation"
  | "emotional_granularity"
  | "emotional_depth"
  | "emotional_rhythm_tidal"
  | "emotional_rhythm_stable"
  | "emotional_transformation"
  | "temporal_past_weight"
  | "temporal_present_depth"
  | "temporal_future_pull"
  | "temporal_narrative_coherence"
  | "temporal_change_openness"
  | "temporal_meaning_density";

export interface FeatureVector {
  sessionId: string;
  values: Record<FeatureKey, number>;
  activeDimensions: DimensionKey[];
  evidence: {
    questionId: string;
    featureKey: FeatureKey;
    contribution: number;
  }[];
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  createdAt: string;
  mappingVersion: string;
}
```

Rules:
- all feature values normalized to `0..1`.
- `confidenceScore` also normalized to `0..1`.
- at least three evidence rows per high-salience narrative claim.

## 6. Tension Object

```ts
export interface TensionInsight {
  tensionId: string;
  name: string;
  poles: [string, string];
  descriptionSeed: string;
  supportingFeatures: FeatureKey[];
  confidenceScore: number;
}
```

Initial supported tensions:
- `depth_vs_stability`
- `nostalgia_vs_becoming`
- `expression_vs_protection`
- `intensity_vs_gentleness`

## 7. Analysis Job

```ts
export interface AnalysisJob {
  jobId: string;
  sessionId: string;
  featureVectorId: string;
  promptVersion: string;
  reportSchemaVersion: string;
  safetyVersion: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  finishedAt?: string;
  failureReason?: string;
}
```

## 8. Report Payload

```ts
export interface DimensionReading {
  dimension: DimensionKey;
  title: string;
  summary: string;
  evidenceFeatures: FeatureKey[];
  confidenceBand: ConfidenceBand;
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
```

Constraints:
- `dimensionReadings.length` must equal `3` for MVP.
- `tensions.length` should be `2` by default.
- `recommendations.length` should be `6-10` total across categories.
- `overview` should be safe to render without post-processing.

## 9. Safety Review Object

```ts
export interface SafetyReview {
  reportId: string;
  flags: SafetyFlag[];
  blockedPhrases: string[];
  rewriteApplied: boolean;
  reviewedAt: string;
  safetyVersion: string;
}
```

## 10. API Contract v0.1

### Submit Session

`POST /api/test/submit`

Request:
```json
{
  "mode": "lite",
  "basicInfo": {
    "lifeStage": "turning_point",
    "moodKeywords": ["迷茫", "疲惫", "希望"]
  },
  "answers": []
}
```

Response:
```json
{
  "sessionId": "sess_001",
  "status": "accepted"
}
```

### Trigger Analysis

`POST /api/analysis`

Request:
```json
{
  "sessionId": "sess_001"
}
```

Response:
```json
{
  "jobId": "job_001",
  "status": "queued"
}
```

### Get Report

`GET /api/report/:sessionId`

Response:
```json
{
  "status": "done",
  "report": {
    "reportId": "rep_001"
  }
}
```

## 11. Acceptance Notes

A schema change is backward compatible only if:
- existing `TestSession` payloads remain valid,
- `ReportPayload` can still render on the result page,
- version fields continue to identify the producing contracts.
