# 本源 iOS TF Candidate Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one coherent local iOS candidate for the next TestFlight round, covering the main native flow, constellation result readability, account/history/feedback simplification, and release-grade verification.

**Architecture:** Keep the existing SwiftUI native flow and Next.js staging API. Make focused SwiftUI refinements in the existing view and design primitive files, then verify with local simulator preview, native contract tests, Swift build, and staging E2E before any TestFlight upload.

**Tech Stack:** SwiftUI, Xcode simulator, Node smoke scripts, Next.js staging API at `http://120.26.126.88`.

---

### Task 1: Main Flow Motion And Copy Polish

**Files:**
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeCollectView.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeProcessingView.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeTheaterView.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`

- [ ] Remove any visible engineering/module-flavored copy from Part 1, upload, processing, and theater views.
- [ ] Make option selection feedback read as a small nova fall/burst: selected option must invert clearly enough to avoid white-on-white ambiguity.
- [ ] Make upload state feel like a real celestial object instead of a flat card: art panel and status panel remain sibling blocks, not nested text-over-object.
- [ ] Keep motion restrained and consistent with deep moon field language.
- [ ] Verify with `npm run smoke:ios:typography-layout` and `node scripts/benyuan-ios-flow-motion-layer-contract-smoke.mjs`.

### Task 2: Constellation Result Readability And Graphic Dimensions

**Files:**
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeConstellationView.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeDesignPrimitives.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativePreviewFixtures.swift` only if preview text needs a better stress case.

- [ ] Tighten the space between the constellation title area and the seven-dimension orbit.
- [ ] Make the seven-dimension galaxy larger and more visually central.
- [ ] Reduce numeric-looking bars; replace the lower dimension list with a more graphic constellation spectrum.
- [ ] Add richer selected-dimension interpretation copy without creating a long report wall.
- [ ] Keep the bottom dock as one row: 分享 / 保存 / 重新探索.
- [ ] Verify with `npm run smoke:constellation:ui`, `npm run ios:shell:native-preview`, and screenshot inspection.

### Task 3: Account, History, Binding, And Feedback Simplification

**Files:**
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountView.swift`
- Modify: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeAccountActions.swift` only if state handling needs a small adjustment.
- Modify: `scripts/benyuan-auth-contract-smoke.mjs`
- Modify: `scripts/benyuan-feedback-contract-smoke.mjs`

- [ ] Keep the main account page clean: identity, concise stats, history, and bottom actions.
- [ ] Keep Apple / WeChat / phone / visitor binding inside one secondary sheet, not as four large primary blocks.
- [ ] Make history cards compact and easy to act on.
- [ ] Make feedback composer clearly about issue collection and handling state, with minimal redundant metadata.
- [ ] Verify with `npm run smoke:auth:contract` and `npm run smoke:feedback:contract`.

### Task 4: Candidate Verification And Push

**Files:**
- Modify only files changed by Tasks 1-3 and plan/check scripts if needed.

- [ ] Run `npm run ios:shell:build`.
- [ ] Run `npm run smoke:ios:native-only`.
- [ ] Run `npm run smoke:ios:typography-layout`.
- [ ] Run `npm run smoke:ios:processing-recovery`.
- [ ] Run `npm run smoke:native-generation-job:contract`.
- [ ] Run `node --test scripts/benyuan-ios-native-staging-e2e-lib.test.mjs`.
- [ ] Run `BENYUAN_BASE_URL=http://120.26.126.88 BENYUAN_EXPECT_LIVE=1 npm run smoke:runtime:gate`.
- [ ] Run `npm run ios:shell:native-staging-e2e` once at the end, not after every small UI edit.
- [ ] Commit and push only to `benyuan` remote on `codex/benyuan-parallel`.

---

### Candidate Definition

This candidate is ready for a later TestFlight upload only when local simulator screenshots match the intended UI direction, native contracts pass, Swift builds, and staging E2E confirms live multimodal/theater/constellation plus local `constellationId` persistence.
