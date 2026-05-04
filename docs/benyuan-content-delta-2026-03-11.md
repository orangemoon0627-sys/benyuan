# Benyuan Content Delta · 2026-03-11

## What this note is
This is a content-iteration delta note for the current Benyuan beta.
It is not a new freeze.
The active freeze reference remains:
- benchmark: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json`
- freeze doc: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`

## Current report engine identifiers
- engine mode: `hybrid-structured.v1`
- prompt version: `analyst.v3.hybrid.1`
- normalization version: `constellation-normalize.v2`
- safety version: `supportive-boundary.v1`

## What changed in this round
### 1. Archetype differentiation tightened
- keep deterministic structured backbone, but move copy and recommendation anchors to archetype-specific profiles
- strengthen separation across:
  - `孤独求索者`
  - `理性建构者`
  - `温柔守护者`
  - `存在漫游者`
  - `忧郁诗人`
- make `core_tensions` less generic for the more easily templated archetypes

### 2. Fallback repair became more content-aware
- suspicious slug-like archetype names can now be repaired from deterministic fallback
- too-short narrative, too-thin tensions, too-sparse growth suggestions, or under-filled recommendations can be supplemented on read and on agent return
- recommendations now repair canonical author / director / artist pairs for known titles

### 3. Safety tone tightened for higher-sensitivity results
- add supportive boundary tone when emotional depth + meaning seeking are high and action tendency is lower
- avoid pushing high-pressure action language into the result copy
- keep results interpretive, not diagnostic

### 4. Result presentation visibility improved
- `/lab/status` now exposes current engine identifiers, latest result-layer regression visibility, pilot readiness, and iOS shell acceptance state
- `/constellation` now exposes a faster mobile-first reading path and PNG summary export

## Regression reference for this delta
Use these as the immediate regression surfaces before considering a new freeze:
- `/lab/status`
- `/lab/golden`
- `/lab/golden/audit`
- `/collect`
- `/theater`
- `/constellation`

## Validation checklist for this delta
### Required
- `npm run build`
- `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden`
- rerun at least:
  - `A-only`
  - `B-only`
- browser-check:
  - `/collect`
  - `/theater`
  - `/constellation`
  - `/lab/status`

### What to look for
- archetype naming no longer falls back to slug-like output
- `core_tensions` differ between A / B / C instead of collapsing to a shared template
- `recommendations` remain non-empty and keep correct author / director / artist credits
- `narrative_overview` retains paragraph structure and reads differently across archetypes
- `/constellation` mobile reading order improves without changing the public API shape

## iOS acceptance state
Current state is still:
- web -> shell -> native smoke: available
- shell regression: available
- real-device camera/library allow-deny-cancel evidence: still manual pending

See:
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md`
