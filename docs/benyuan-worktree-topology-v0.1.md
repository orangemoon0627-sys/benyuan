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
