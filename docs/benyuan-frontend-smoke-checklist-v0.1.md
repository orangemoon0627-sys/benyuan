# Benyuan Frontend Smoke Checklist v0.1

Last updated: 2026-03-08

## Purpose

Use this checklist after any meaningful UI, interaction, copy, or state-management change.

It complements `npm run smoke:flow`, which already verifies the API path from submit to report and share-card generation.

## Fast Validation Baseline

Run these first:

```bash
npm run lint
npm run build
npm run smoke:flow
```

Expected outcome:
- lint passes
- build passes
- smoke flow reaches `smoke:pass`

## Manual Route Pass

### 1. Landing `/`
- hero loads without layout shift
- entry CTA is visible on desktop and mobile widths
- no console errors

### 2. Test `/test`
- fresh page load does not show stale draft banner unless a real draft exists
- entry step allows life stage + mood selection and advances normally
- multi-select questions keep multiple choices when tapped quickly
- scale questions can select any step without overlap or clipping
- review step shows accurate counts for answered questions and open reflections
- if incomplete, `回到未完成处` jumps to the first missing answer
- if complete, submit button becomes enabled and routes to processing

### 3. Processing `/processing/[sessionId]`
- phase labels rotate while waiting
- retry block appears only on failure
- success path redirects to report automatically
- no flashing or repeated fetch failures in console

### 4. Report `/report/[sessionId]`
- `沉浸阅读 / 证据阅读` toggle changes the surface state
- evidence mode auto-expands evidence panels
- reading path highlights the current section on anchor jump and scroll
- recommendation cards render without overflow on narrow screens
- boundary note remains visible below recommendations

### 5. Report Actions
- `分享摘要` shows success or fallback feedback
- `复制全文` becomes `已复制` and shows the clipboard hint
- `保存为文本` downloads a txt file and shows the save hint
- `导出 PNG 卡片` exports a PNG and shows the export hint
- rapid consecutive clicks preserve the latest hint instead of clearing too early
- action hint remains readable with assistive tech (`aria-live`)

## Visual Checks

### Desktop
- width around 1440px
- width around 1280px
- width around 1024px

### Mobile
- width around 390px
- width around 430px

Verify at both sizes:
- no clipped headings
- sticky or anchored side elements do not overlap primary content
- action buttons remain tappable without accidental overlap
- long Chinese copy wraps cleanly

## Regression Seeds

Use at least one of these states during QA:
- fresh session with no local draft
- restored draft near question 2
- restored draft at review with missing open reflection
- finished sample report `sess_sample_001`
- a newly generated report from `npm run smoke:flow`

## Failure Handling

If a check fails, record:
- route
- viewport
- exact action
- expected result
- actual result
- whether the failure is deterministic or intermittent

Store screenshots or terminal notes under `output/` when helpful.
