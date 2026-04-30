# 「本源」Engineering Contract v0.1

版本：`eng.v0.1`

本文件用于把前面的产品、题库、Prompt、安全文档，收敛成工程可执行契约。

适用对象：
- Experience and Engineering Agent
- Frontend implementation
- Backend/API implementation
- Async analysis pipeline

## 1. Engineering Goal

MVP 工程目标不是做完整平台，而是跑通一条最小闭环：
- 用户进入测试
- 完成并提交一份 `TestSession`
- 后端生成 `FeatureVector`
- 异步创建 `AnalysisJob`
- 调用 Prompt Runner 生成 `ReportPayload`
- 应用 Safety Review
- 前端渲染结果页

## 2. Source of Truth

工程实现必须以前置文档为准：
- Schema: `/Users/fanhao/Documents/Playground/docs/benyuan-shared-schema-v0.1.md`
- PRD: `/Users/fanhao/Documents/Playground/docs/benyuan-prd-v0.1.md`
- Question Bank: `/Users/fanhao/Documents/Playground/docs/benyuan-question-bank-v0.1.md`
- Scoring Mapping: `/Users/fanhao/Documents/Playground/docs/benyuan-scoring-mapping-v0.1.md`
- Prompt Pack: `/Users/fanhao/Documents/Playground/docs/benyuan-analysis-prompt-pack-v0.1.md`
- Safety Policy: `/Users/fanhao/Documents/Playground/docs/benyuan-safety-policy-v0.1.md`

## 3. Suggested MVP Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- server actions or route handlers for light orchestration

### Backend
- Next.js route handlers for MVP, or Node service if later split needed
- background job queue abstraction
- OpenAI-compatible LLM client abstraction

### Data
- PostgreSQL for durable records
- Redis for queue/cache if available
- if MVP needs faster start: Postgres-only with polling is acceptable

## 4. MVP Runtime Flow

```text
Landing -> Test -> Submit Session -> Create Feature Vector -> Queue Analysis Job
-> Run Prompt -> Apply Safety Review -> Persist Report -> Report Page Render
```

## 5. API Contract

## 5.1 `POST /api/test/submit`

Purpose:
- create a new `TestSession`

Request body:
```json
{
  "mode": "lite",
  "basicInfo": {
    "lifeStage": "turning_point",
    "moodKeywords": ["迷茫", "疲惫"]
  },
  "answers": [
    {
      "questionId": "Q001",
      "moduleId": "entry_state",
      "answerType": "multi",
      "value": ["Q001_A", "Q001_C"]
    }
  ]
}
```

Response body:
```json
{
  "sessionId": "sess_xxx",
  "status": "accepted",
  "next": "/processing/sess_xxx"
}
```

Validation:
- reject if required answers missing beyond allowed threshold
- store raw answer IDs exactly as submitted

## 5.2 `POST /api/analysis`

Purpose:
- derive feature vector
- create analysis job

Request body:
```json
{
  "sessionId": "sess_xxx"
}
```

Response body:
```json
{
  "jobId": "job_xxx",
  "status": "queued"
}
```

Server actions:
1. fetch session
2. apply mapping rules
3. persist `FeatureVector`
4. create `AnalysisJob`
5. enqueue prompt runner

## 5.3 `GET /api/analysis/:jobId`

Purpose:
- poll current analysis state

Response body:
```json
{
  "jobId": "job_xxx",
  "status": "queued"
}
```

Allowed statuses:
- `queued`
- `running`
- `done`
- `failed`

## 5.4 `GET /api/report/:sessionId`

Purpose:
- fetch final report payload

Response body:
```json
{
  "status": "done",
  "report": {
    "reportId": "rep_xxx",
    "overview": "..."
  }
}
```

## 6. Internal Service Contracts

## 6.1 Feature Mapping Service

Input:
- `TestSession`
- question bank version
- mapping version

Output:
- `FeatureVector`

Requirements:
- deterministic output
- pure mapping logic, no LLM dependency
- preserve evidence rows

## 6.2 Prompt Runner Service

Input:
- `TestSession`
- `FeatureVector`
- `TensionInsight[]`
- prompt version

Output:
- raw generated report object

Requirements:
- JSON schema enforcement
- retry once on malformed JSON
- store raw model output for debugging

## 6.3 Safety Review Service

Input:
- generated report
- feature vector
- safety flags
- safety version

Output:
- final `ReportPayload`
- `SafetyReview`

Requirements:
- detect blocked phrases
- apply rewrite rules if needed
- if `self_harm_risk`, force crisis downgrade

## 7. Suggested Data Model

## 7.1 `test_sessions`

Columns:
- `id`
- `user_id` nullable
- `mode`
- `basic_info_json`
- `answers_json`
- `created_at`

## 7.2 `feature_vectors`

Columns:
- `id`
- `session_id`
- `values_json`
- `evidence_json`
- `confidence_score`
- `confidence_band`
- `mapping_version`
- `created_at`

## 7.3 `analysis_jobs`

Columns:
- `id`
- `session_id`
- `feature_vector_id`
- `status`
- `prompt_version`
- `report_schema_version`
- `safety_version`
- `failure_reason` nullable
- `created_at`
- `finished_at` nullable

## 7.4 `reports`

Columns:
- `id`
- `session_id`
- `job_id`
- `payload_json`
- `prompt_version`
- `report_schema_version`
- `generated_at`

## 7.5 `safety_reviews`

Columns:
- `id`
- `report_id`
- `flags_json`
- `blocked_phrases_json`
- `rewrite_applied`
- `safety_version`
- `reviewed_at`

## 8. Frontend Route Responsibilities

## 8.1 `/`
- explain promise
- show estimated time
- CTA to start test

## 8.2 `/test`
- render question flow
- autosave local progress if possible
- validate required answers
- submit session

## 8.3 `/processing/:sessionId`
- trigger analysis if not started
- poll job status
- render atmospheric loading copy
- redirect to report on success

## 8.4 `/report/:sessionId`
- fetch report
- render overview, dimension blocks, tensions, archetype, recommendations
- render safety note conditionally
- render save/share CTA area

## 9. Queue Strategy

MVP acceptable options:

### Option A: simple DB-backed queue
- insert job row
- cron/worker picks up queued jobs
- easiest to debug

### Option B: Redis queue
- better for scaling
- not necessary for first pilot

Recommended for MVP:
- start with DB-backed queue unless infra already exists

## 10. Error States

## 10.1 Submit Failure
Frontend copy:
- “这次提交没有成功，你的答案还在。稍等片刻再试一次。”

## 10.2 Analysis Failure
Frontend copy:
- “这次整理你的线索时出现了中断。我们会保留这次输入，你可以重新发起分析。”

## 10.3 Low-Information Result
Frontend copy:
- “这次结果更像一份初步草图。如果你愿意，补充更多线索会让它更接近你。”

## 11. Logging and Observability

Minimum logs:
- session created
- feature vector generated
- analysis job queued
- model response received
- safety rewrite applied
- report rendered

Debug payloads to preserve:
- raw input answers
- computed feature vector
- raw model JSON/text
- final rewritten report

## 12. Versioning Rules

Every persisted report must store:
- `qbankVersion`
- `mappingVersion`
- `promptVersion`
- `reportSchemaVersion`
- `safetyVersion`

Without these, a report is considered non-reproducible.

## 13. Acceptance Criteria

Engineering contract is satisfied when:
- one valid session can create one valid feature vector
- one analysis job can produce a valid JSON report
- safety review can mutate output when blocked phrases appear
- frontend report page renders all required sections
- polling and error states are visible to user

## 14. Recommended Build Order

1. define shared TS types from schema
2. build question loader from question bank
3. implement session submit API
4. implement feature mapping service
5. implement analysis job creation
6. implement prompt runner with mock model first
7. implement safety review pass
8. build result page against mocked `ReportPayload`
9. connect real model
10. add analytics events
