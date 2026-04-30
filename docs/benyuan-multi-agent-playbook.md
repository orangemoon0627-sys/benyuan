# "Benyuan" Multi-Agent Delivery Playbook

## 1. Goal

This playbook turns the architecture vision into a parallel delivery system for an MVP that can:

- collect a lightweight self-exploration test session,
- transform answers into a stable feature vector,
- generate a first-pass narrative report,
- render a shareable results page,
- enforce safety and expression boundaries.

The first release intentionally focuses on three dimensions only:

1. Aesthetic Grammar
2. Emotional Climate
3. Temporal Philosophy

This keeps the semantic system coherent while preserving the project's core differentiation.

## 2. Team Topology

### 2.1 Orchestrator Agent

Mission: own scope, contracts, and integration order.

Outputs:
- milestone board,
- canonical glossary,
- interface/version registry,
- final merge decisions.

Success criteria:
- no unresolved contract conflict,
- every workstream has an owner and deadline,
- all artifacts share one vocabulary.

### 2.2 Product Architect Agent

Mission: compress the long-form concept into a shippable MVP.

Outputs:
- PRD,
- user journey,
- page/state flow,
- release scope and non-goals.

Success criteria:
- user can finish the first experience in 10-15 minutes,
- product promise is clear without reading philosophy-heavy copy,
- every page has one dominant job.

### 2.3 Assessment Designer Agent

Mission: convert abstract dimensions into measurable prompts.

Outputs:
- question bank v0.1,
- scoring model v0.1,
- feature mapping rules,
- confidence scoring notes.

Success criteria:
- no question depends on one-to-one type labels,
- each answer contributes to at least one interpretable feature,
- completion friction remains low.

### 2.4 Psychoanalysis Prompt Agent

Mission: generate reports that feel precise, restrained, and emotionally resonant.

Outputs:
- analysis system prompt,
- report schema,
- archetype naming logic,
- tension-detection rules,
- fallback prompt for low-confidence inputs.

Success criteria:
- reports sound like understanding, not generic inspiration,
- prompt avoids diagnosis-style phrasing,
- outputs remain structurally consistent.

### 2.5 Safety and Ethics Agent

Mission: define the system's limits before scale.

Outputs:
- risk taxonomy,
- blocked phrases list,
- downgrade policy,
- human-support escalation copy,
- privacy/data handling notes.

Success criteria:
- unsafe certainty is removed,
- sensitive signals trigger softer framing,
- all user-facing language remains non-clinical unless explicitly needed.

### 2.6 Experience and Engineering Agent

Mission: make the loop work end-to-end.

Outputs:
- frontend information architecture,
- API contracts,
- async analysis job flow,
- persistence model,
- result rendering implementation plan.

Success criteria:
- user can submit, wait, and receive a report without manual patching,
- API payloads align with schema v0.1,
- system can version prompts and reports.

### 2.7 Evaluation Agent

Mission: judge output quality using repeatable rubrics.

Outputs:
- golden test set,
- report review rubric,
- regression checklist,
- feedback loop for prompt/question updates.

Success criteria:
- team can compare prompt versions without guessing,
- weak outputs are classified by failure mode,
- user feedback maps back to specific system parts.

## 3. Shared Operating Rules

### 3.1 Contract-First

No workstream ships independent formats. All agents consume and produce against the shared schema in `docs/benyuan-shared-schema-v0.1.md`.

### 3.2 Single Vocabulary

The following terms are canonical for MVP:
- dimension
- subfeature
- feature vector
- tension
- archetype
- confidence
- safety flag
- report payload

Synonyms are allowed in user-facing copy, not in internal objects.

### 3.3 Expression Boundaries

Allowed style:
- spectrum-based,
- metaphorical but grounded,
- interpretive rather than diagnostic.

Disallowed style:
- fixed-type labeling,
- trauma claims without evidence,
- certainty inflation,
- manipulative fate/destiny language.

### 3.4 Versioning

Every artifact carries a version string:
- question bank: `qbank.v0.x`
- feature mapping: `mapping.v0.x`
- prompt pack: `prompt.v0.x`
- report schema: `report.v0.x`
- safety policy: `safety.v0.x`

### 3.5 Integration Gates

A workstream is not considered done until:
- schema compatibility is checked,
- one sample payload passes through its boundary,
- one owner signs off downstream consumption.

## 4. Parallel Workstreams

## Workstream A: Product Compression
Owner: Product Architect Agent
Depends on: Orchestrator Agent

Deliverables:
- MVP PRD,
- page list,
- lite flow and deep flow decision note,
- share/result page structure.

Key decisions:
- keep only mode one for MVP,
- limit first release to three dimensions,
- split output into overview, dimensions, tensions, recommendations.

## Workstream B: Measurement System
Owner: Assessment Designer Agent
Depends on: Product Architect Agent

Deliverables:
- 24-36 question bank,
- scoring matrix,
- confidence strategy,
- low-information fallback rules.

Key decisions:
- favor metaphor and scene-based prompts over blunt personality wording,
- ensure questions cover diversity of emotional and temporal signatures,
- support future extension to seven dimensions without rewriting the core model.

## Workstream C: Narrative Intelligence
Owner: Psychoanalysis Prompt Agent
Depends on: shared schema, Workstream B

Deliverables:
- generation prompt pack,
- archetype naming template,
- tension extraction rules,
- recommendation generation rules.

Key decisions:
- report must separate observation from suggestion,
- weak evidence must reduce certainty and shorten claims,
- aesthetic preference should remain a primary inference source.

## Workstream D: Safety Layer
Owner: Safety and Ethics Agent
Depends on: shared schema, Workstream C

Deliverables:
- signal taxonomy,
- severity levels,
- rewrite rules,
- fallback response library.

Key decisions:
- allow existential language, block pseudo-clinical diagnosis,
- keep advice supportive but non-dependent,
- define escalation language for self-harm, trauma, and extreme distress cues.

## Workstream E: MVP System Delivery
Owner: Experience and Engineering Agent
Depends on: Workstreams A, B, C, D

Deliverables:
- submission flow,
- persistence model,
- analysis queue,
- result page rendering contract,
- instrumentation hooks.

Key decisions:
- async job architecture from day one,
- prompt version and report version stored with every result,
- results are reproducible from session plus versions.

## Workstream F: Quality Loop
Owner: Evaluation Agent
Depends on: Workstreams B, C, D, E

Deliverables:
- golden input set,
- review rubric,
- failure labels,
- weekly evaluation report.

Key decisions:
- measure resonance, specificity, coherence, safety, and non-redundancy separately,
- tag failures by source: question design, feature mapping, prompt, or rendering.

## 5. Delivery Milestones

### Milestone M0 - Foundation Locked
Definition:
- vocabulary, scope, and schema are frozen for sprint 1.

Exit criteria:
- shared schema v0.1 approved,
- three-dimension MVP confirmed,
- non-goals written down.

### Milestone M1 - Content System Ready
Definition:
- user inputs can be collected and interpreted into a stable internal representation.

Exit criteria:
- question bank v0.1 complete,
- feature mapping v0.1 complete,
- confidence rules defined.

### Milestone M2 - Narrative Engine Ready
Definition:
- report generation works on stable payloads with safety policy applied.

Exit criteria:
- prompt pack v0.1 passes golden sample review,
- report schema v0.1 implemented,
- safety rewrite rules integrated.

### Milestone M3 - End-to-End MVP
Definition:
- a test session can produce a viewable result page.

Exit criteria:
- submit -> queue -> analyze -> render works,
- at least five sample sessions produce usable reports,
- output versioning stored correctly.

### Milestone M4 - Internal Pilot Ready
Definition:
- system is stable enough for controlled user feedback.

Exit criteria:
- quality rubric baseline recorded,
- user feedback form connected,
- top five failure modes documented.

## 6. Definition of Done for MVP

The MVP is done when all of the following are true:
- one user can finish the lightweight test in under 15 minutes,
- one report is generated with overview, three dimensions, two tensions, one archetype, and recommendations,
- every report includes confidence and safety metadata,
- every report is reproducible by stored input plus versioned prompt/schema,
- internal reviewers can score the output with a shared rubric.

## 7. Immediate Next Actions

1. Freeze the schema in `docs/benyuan-shared-schema-v0.1.md`.
2. Create the sprint board from `docs/benyuan-sprint-week1.md`.
3. Start Workstreams A/B/C in parallel on day one.
4. Start Workstream D no later than day two.
5. Integrate E only against frozen v0.1 contracts.
