# Benyuan Worktree Topology v0.1

Last updated: 2026-03-08

## Active Worktrees

### Orchestrator
- Path: `/Users/fanhao/Documents/Playground`
- Branch: `main`
- Responsibility:
  - integration and release gate
  - smoke validation
  - shared docs and status board
  - final merge target

### Frontend Worktree
- Path: `/Users/fanhao/Documents/Playground-fe`
- Branch: `codex/frontend-ui`
- Responsibility:
  - `/`, `/test`, `/processing`, `/report`
  - visual system, motion, responsive behavior
  - interaction QA and accessibility

### Backend / Analysis Worktree
- Path: `/Users/fanhao/Documents/Playground-be`
- Branch: `codex/backend-analysis`
- Responsibility:
  - `/api/*`
  - storage and session persistence
  - feature mapping and report generation
  - future LLM provider integration

## Shared Dependency Setup

To reduce repeated installs, both worktrees use a symlinked dependency folder:
- `/Users/fanhao/Documents/Playground-fe/node_modules -> /Users/fanhao/Documents/Playground/node_modules`
- `/Users/fanhao/Documents/Playground-be/node_modules -> /Users/fanhao/Documents/Playground/node_modules`

## Assessment Isolation

The questionnaire system is now isolated under:
- `src/features/assessment/types.ts`
- `src/features/assessment/question-bank.ts`
- `src/features/assessment/catalog.ts`
- `src/features/assessment/flow.ts`
- `src/features/assessment/registry.ts`
- `src/features/assessment/question-types.ts`
- `src/features/assessment/index.ts`

This means future changes to question type, ordering, module grouping, or test flow should begin in `src/features/assessment/` rather than inside page components.

## API Contract for Test Structure

A new schema endpoint is available:
- `GET /api/test/schema`

The endpoint now resolves through the assessment registry, so later mode-specific structures can be served without rewriting the route.

It now also exposes:
- normalized question options for client rendering
- resolved presentation metadata
- question-type catalog metadata (`implemented` vs `planned`)

Use it when:
- testing dynamic question structures
- building alternate test clients
- validating future question-bank revisions
- keeping smoke scripts decoupled from direct source imports

## Recommended Operating Rhythm

1. Make UI changes in `Playground-fe`
2. Make analysis/API changes in `Playground-be`
3. Reproduce integration in `Playground`
4. Run:

```bash
npm run lint
npm run build
npm run smoke:flow
```

## Near-Term Upgrade Path

For the next phase, keep these boundaries:
- frontend owns presentation and pacing
- backend owns session schema and analysis contract
- assessment owns question definitions and flow rules

This will make it much easier to:
- replace question wording
- add new question types
- support multiple test modes
- move from rule-based analysis to hybrid AI analysis later

The immediate benefit is that future image/audio/ranking questions can be introduced as kernel-level changes first, then enabled gradually per client.

The schema contract now also exposes `phases`, `initialState`, and `storageKey`, so future web / iOS / mini-program clients can consume pacing structure directly instead of inferring it from question order.

## Analysis Engine Boundary

The analysis pipeline now resolves through an engine abstraction:
- `src/lib/analysis/types.ts`
- `src/lib/analysis/deterministic-engine.ts`
- `src/lib/analysis/registry.ts`
- `src/lib/analysis/index.ts`

Current runtime still uses the deterministic engine, but future AI providers can be attached behind the same registry without rewriting `store.ts` or the API routes.

## Mode-Driven Assessment Core

Assessment is now mode-driven instead of being hardcoded to a single questionnaire path.

Current registry behavior:
- `lite` mode: active MVP path
- `deep` mode: independent question bank with its own phases, validation targets, and storage key

This gives us a clean place to later introduce:
- different question sets per mode
- different validation rules per mode
- different pacing / phase structures per mode
- different analysis-engine routing per mode

## Frontend Contract Boundary

The `/test` page now consumes `/api/test/schema` as its primary source of truth through:
- `src/lib/assessment-schema.ts`
- `src/app/test/page.tsx`

This means frontend pacing, draft handling, question rendering, and review gating are now driven by the HTTP schema contract rather than direct imports from the assessment registry.

## Smoke Coverage

The smoke pipeline now validates both modes:
- `npm run smoke:flow` → lite
- `npm run smoke:flow:deep` → deep
- `npm run smoke:flow:all` → both

## Analysis Contract Boundary

The deterministic analysis pipeline no longer reads assessment registry data ad hoc inside the engine. It now resolves through an explicit analysis input layer:
- `src/lib/analysis/types.ts`
- `src/lib/analysis/input.ts`
- `src/lib/analysis/deterministic-engine.ts`

This creates a cleaner seam for future AI providers: `store.ts` can hand the same `AnalysisInput` contract to deterministic and LLM engines without changing API routes or persistence flow.

## Provider-Ready Fallback Path

The analysis registry now supports a provider-ready hybrid path:
- `src/lib/analysis/provider.ts`
- `src/lib/analysis/hybrid-engine.ts`
- `BENYUAN_ANALYSIS_ENGINE=hybrid`

When no external provider is configured, the hybrid engine falls back to the deterministic engine instead of interrupting the product flow.

## Runtime Observability

The analysis runtime is now queryable via:
- `GET /api/analysis/runtime?mode=lite|deep`
- optional override: `engine=hybrid|deterministic`

This makes it easier to inspect whether the app is currently running deterministic analysis, hybrid mode, or deterministic fallback when no provider is configured.

## Prompt/Input Shaping Layer

Provider-facing prompt shaping now has its own seam:
- `src/lib/analysis/prompt-shaping.ts`

This keeps provider payload assembly separate from the deterministic engine and makes future OpenAI / Anthropic integration much easier to swap or version.

## Runtime Lab Surface

There is now a visual internal surface for analysis runtime inspection:
- `/lab/runtime`
- linked from `/lab/golden`

This page shows engine/provider status, fallback state, env-key presence, and a prompt-shaping preview based on a deep-mode regression sample.

## Analysis Config Contract

Provider and engine selection now resolve through:
- `src/lib/analysis/config.ts`

This centralizes runtime selection instead of reading scattered environment variables directly in multiple files.


## Prompt Template Versioning

Provider-facing prompts now resolve through a versioned template registry:
- `src/lib/analysis/prompt-templates.ts`
- current key: `core`
- current template version: `prompt-template.v1`

This gives us a stable place to evolve prompt instructions without coupling those changes to the deterministic engine or UI pacing layer.

## Provider Merge Boundary

Hybrid analysis now merges provider enhancements through a dedicated seam:
- `src/lib/analysis/report-merge.ts`

That means future provider output can selectively enhance narrative fields while preserving baseline safety flags, recommendations, and deterministic fallbacks.

## Runtime Model Observability

The runtime inspection surfaces now expose prompt/model metadata as part of the analysis contract:
- selected prompt template key
- configured OpenAI model
- configured Anthropic model
- prompt preview template id/version

This is visible in:
- `GET /api/analysis/runtime`
- `/lab/runtime`

## Latest Validation Snapshot

Validated on 2026-03-08 with:
- `npm run lint`
- `npm run build`
- `npm run smoke:runtime:page`
- `npm run smoke:runtime:hybrid`
- `BENYUAN_BASE_URL=http://localhost:3000 npm run smoke:flow:all`
- `BENYUAN_BASE_URL=http://localhost:3000 BENYUAN_ANALYSIS_ENGINE=hybrid npm run smoke:flow:deep`
- `node --input-type=module -e "fetch versioned /api/test/schema"`


## Live Provider Adapter Boundary

The provider layer now supports an explicit safe split between stub mode and live mode:
- `src/lib/analysis/provider.ts`
- `src/lib/analysis/provider-adapters.ts`
- env gate: `BENYUAN_LLM_LIVE=1`

Behavior:
- default stays in stub mode even if keys exist
- live requests only activate when both a provider key and `BENYUAN_LLM_LIVE` are present
- hybrid analysis still falls back safely to deterministic output when provider is unavailable

## Question Content vs Analysis Mapping Split

The test kernel is now separated more cleanly into independent layers:
- question content / interaction copy:
  - `src/features/assessment/question-content-lite.ts`
  - `src/features/assessment/question-content-deep.ts`
  - re-exported through `src/features/assessment/question-bank.ts`
- answer-to-feature mapping:
  - `src/features/assessment/analysis-mapping.ts`
- shared feature-space contract:
  - `src/lib/feature-space.ts`

This makes later edits safer:
- change question wording without touching mapping logic
- change mapping logic without rewriting question presentation
- expand question types while preserving the analysis feature space


## Versioned Assessment Schema

Assessment structure is now version-addressable inside each mode:
- `src/features/assessment/registry.ts`
- `src/lib/assessment-schema.ts`
- `/api/test/schema?mode=...&version=...`

Current behavior:
- each mode resolves a default version (`lite.v1`, `deep.v1`)
- schema payload now exposes `version`, `availableVersions`, and per-mode active versions
- submit payload can carry the selected assessment version
- persisted sessions now keep `assessmentVersion`, so later analysis uses the exact matched questionnaire definition

This gives us a safer upgrade path for future iterations:
- ship `lite.v2` without breaking `lite.v1` sessions
- compare report changes across questionnaire revisions
- let future iOS or other clients pin to a specific assessment contract version


## Test Client Contract

The `/test` experience now pulls its pacing/review copy and progression logic through a dedicated client contract:
- `src/lib/assessment-client-contract.ts`

This isolates:
- step progression summaries
- review readiness rules
- first-incomplete jump logic
- hero / ritual / companion copy per context

That makes future client work safer for:
- iOS app implementation
- alternate test shells
- A/B variants for pacing without rewriting page-level state code

## Project Roadmap Console

There is now a dedicated standalone roadmap surface for structured progress visibility:
- `/Users/fanhao/Documents/Playground-ops`
- `/Users/fanhao/Documents/Playground-ops/data/project-status.json`
- source data in `src/lib/project-roadmap.ts`
- sync script: `scripts/sync-project-console.mjs`

This gives a web-visible control panel for:
- current focus and next objective
- lane-by-lane actions and their purpose
- framework-layer progress bars
- worktree responsibility split
- current validation loop
