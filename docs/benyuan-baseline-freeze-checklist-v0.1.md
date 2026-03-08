# "Benyuan" Baseline Freeze Checklist v0.1

Last updated: 2026-03-08
Owner: Evaluation Agent + Experience and Engineering Agent

## Purpose

This checklist exists to decide when a new regression baseline should be frozen,
what evidence must be stored with it,
and what must be updated in the workspace so future drift stays explainable.

## Freeze Triggers

Freeze a new baseline when at least one of the following happens:

- report schema changes in a user-visible way
- prompt pack changes alter archetype, overview, tension, or recommendation behavior
- feature mapping changes reorder top features or safety flags
- safety rewrite changes risk framing or boundary copy
- export/share-card changes become part of the product surface that reviewers must lock

## Required Inputs Before Freeze

1. Current golden regression snapshots are generated from the latest code.
2. Reviewer audit results are available for the same commit.
3. The set of golden samples used for freeze is explicitly named.
4. The intended baseline version id is chosen in advance, for example `v0.2`.
5. The freeze owner can explain why the old baseline is no longer enough.

## Required Freeze Record

For each new baseline version, record all of the following:

- baseline id, fixture version, frozen timestamp
- file path of the frozen JSON artifact
- report schema version
- prompt version
- freeze reason
- allowed drift policy
- sample coverage count and any sample additions/removals
- reviewer signoff names or roles
- related docs updated in the same pass

## Allowed Drift Policy

Every freeze must classify drift into one of these buckets:

- `expected`: intentional product evolution that should become the new truth
- `watch`: tolerated for pilot, but not yet fully trusted
- `blocker`: drift that must be fixed before the freeze can land

At minimum, classify these fields explicitly:

- archetype name
- confidence band
- safety flags
- top features
- tension names
- overview copy
- report schema version
- prompt version

## Artifact Checklist

When a freeze lands, update all relevant artifacts together:

- `src/lib/fixtures/golden-baseline.<version>.json`
- `src/lib/golden-baseline-registry.ts`
- `src/lib/golden-baseline-history.ts`
- `/api/internal/golden-regression` output for the new version
- `/lab/golden/audit` version selector visibility
- `docs/benyuan-agent-status-board.md`
- `docs/benyuan-weekly-eval-summary-*.md` if the freeze affects the weekly readout

## Review Steps

1. Run regression and audit on the target commit.
2. Review each drift against the previous frozen version.
3. Mark each drift as expected, watch, or blocker.
4. Freeze only after blockers are resolved.
5. Add the new baseline to the registry and confirm the audit page can switch between versions.
6. Record the freeze note in the status board and weekly summary.

## Signoff Template

Use this compact structure in the registry or companion note:

- Version: `vX.Y`
- Reason: `<what changed and why>`
- Coverage: `<sample count + sample set notes>`
- Allowed drift: `<expected/watch/blocker summary>`
- Schema / prompt: `<report version> / <prompt version>`
- Signoff: `<roles or names>`

## Exit Rule

If the team cannot clearly explain why drift happened,
do not freeze a new baseline.
Keep the previous baseline active and log the uncertainty first.
