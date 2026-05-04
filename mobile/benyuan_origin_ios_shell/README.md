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
- Beta freeze folder: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2`
- Beta freeze doc: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`
- Migration checklist: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-safe-migration-checklist.md`
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

## Current local launch policy
- Shared Xcode scheme no longer hardcodes a specific LAN IP or a forced route.
- Default local base URL is `http://127.0.0.1:3015` for simulator / local web regression.
- For iPhone real-device runs, pass `--benyuan-base-url http://<your-lan-ip>:3015` when needed.
- The shell now persists the last successful base URL, so once a real-device run succeeds, direct reopen continues to use that same origin until you override it again.
- Route restore still prefers:
  - explicit `--benyuan-route`
  - last in-flow route
  - `/`

## Current beta freeze
- Beta freeze doc: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`
- Web → iOS shell map: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md`
- Frozen benchmark: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json`

## Build commands
- Web regression: `npm run ios:shell:regression`
- Generate and build shell: `npm run ios:shell:build`
- Release preflight gate: `npm run ios:shell:testflight:preflight`
- Release archive validation: `npm run ios:shell:archive`
- TestFlight handoff: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-testflight-handoff-2026-04-20.md`

## Release configuration matrix

| configuration | environment | base URL source | logs / debug policy | intended use |
| --- | --- | --- | --- | --- |
| `Debug` | `development` | launch arg / persisted runtime URL / fallback `http://127.0.0.1:3015` | debug bridge and runtime override allowed | local simulator + local web regression |
| `Staging` | `staging` | `BenyuanShellStagingBaseURL` in generated Info.plist | no persisted runtime override, no user-facing debug UI | internal pre-release pointing at a real staging origin |
| `Release` | `production` | `BenyuanShellProductionBaseURL` in generated Info.plist | no persisted runtime override, no user-facing debug UI | TestFlight / release candidate |

- 当前仓库还没有真实 staging / production URL，因此 `Staging` 与 `Release` 默认写入 `.invalid` 占位域名。
- 只要 release 配置仍然落在 `.invalid`，壳层就会在启动时给出显式 warning，而不会静默回落到 localhost。
- 在补齐真实域名前，不要把 `Staging` / `Release` 包交给外部测试用户。

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
- Start local web: `npm run dev -- --port 3015`
- Launch shell smoke: `npm run ios:shell:native-smoke`
- `ios:shell:build` 与 `ios:shell:native-smoke` 现在会优先选择当前 Xcode / Simulator 可用的同 major 版本 iPhone 模拟器，不再硬编码单一机型。
- The smoke runner now covers both `/lab/native-handoff/smoke?autorun=1&source=library` and `/lab/native-handoff/smoke?autorun=1&source=camera`.
- Simulator camera validation is fixture-backed on purpose; use `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md` for true device acceptance.
