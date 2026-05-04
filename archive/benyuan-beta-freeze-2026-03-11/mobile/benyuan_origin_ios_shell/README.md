# Benyuan Origin iOS Shell

This folder is the safe handoff package for a first-pass iOS wrapper.

## Goal
Wrap the current Benyuan web experience in an iOS shell first, while preserving:
- current API contracts
- current checkpoint/resume flow
- current A/B/C benchmark baseline
- current black-gold design tokens

## Recommended first implementation
- Shell type: `WKWebView` or Capacitor-style wrapper
- Entry URL: current web deployment root
- Preferred initial route: `/`
- Resume-critical routes:
  - `/collect`
  - `/processing/benyuan`
  - `/theater`
  - `/constellation`

## What should remain stable in phase 1
- `Part 1` request shape
- `theater` response schema
- `constellation` response schema
- runtime override / provider handoff semantics
- local storage checkpoint keys

## What can evolve freely in phase 1
- UI rhythm
- motion polish
- layout and spacing
- demo cards and onboarding framing
- route-level presentation style

## Frozen references
- Safe baseline archive: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11`
- Migration checklist: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11.md`
- Design tokens: `/Users/fanhao/Documents/Playground/src/config/benyuan-design-tokens.ts`
- Shell manifest: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/shell-manifest.json`
- Swift token starter: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/BenyuanDesignTokens.swift`


## Starter files added
- `IMPLEMENTATION_PLAN.md` — ordered build steps and acceptance checklist
- `NativeCapabilitiesChecklist.md` — permissions, resume-critical states, native scope
- `swiftui-starter/BenyuanShellConfig.swift` — environment and route configuration
- `swiftui-starter/BenyuanRouteRecovery.swift` — restore and persist in-flow routes
- `swiftui-starter/BenyuanWebContainerView.swift` — minimal `WKWebView` wrapper
- `swiftui-starter/BenyuanShellApp.swift` — first SwiftUI app shell entry

- `swiftui-starter/BenyuanShellState.swift` — shell loading/share/error state
- `swiftui-starter/BenyuanNetworkMonitor.swift` — offline banner support
- `swiftui-starter/BenyuanNativeBridge.swift` — JS-to-native bridge starter, now including native photo-library and camera capture
- `swiftui-starter/BenyuanShellRootView.swift` — loading, offline, retry, share presentation
- `swiftui-starter/BenyuanShareSheet.swift` — native share sheet wrapper
- `NativeBridgeContract.md` — proposed web/native bridge messages
- `project.yml` — XcodeGen project config for a runnable shell app

## Current beta freeze
- Beta freeze doc: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11.md`
- Web → iOS shell map: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md`
- Frozen benchmark: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-10T17-44-42.json`

## Build commands
- Web regression: `npm run ios:shell:regression`
- Generate and build shell: `npm run ios:shell:build`

## Phase 1.5 now wired
- Native share sheet bridge is callable from the web layer
- External browser handoff is callable from the web layer
- Part 1 upload cards can request the iOS photo library or camera through the native bridge
- Selected images still flow through the existing `/api/part1/upload` route
- Real-device camera acceptance is tracked in `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md`
- Ready-made record files live in `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-template.md`, `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample.md`, `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-deny.md`, and `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-cancel.md`
- A one-page acceptance matrix lives in `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`

## Simulator smoke
- Build shell: `npm run ios:shell:build`
- Start local web: `npm run dev -- --port 3014`
- Launch shell smoke: `npm run ios:shell:native-smoke`
- The smoke runner now covers both `/lab/native-handoff/smoke?autorun=1&source=library` and `/lab/native-handoff/smoke?autorun=1&source=camera`.
- Simulator camera validation is fixture-backed on purpose; use `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md` for true device acceptance.
