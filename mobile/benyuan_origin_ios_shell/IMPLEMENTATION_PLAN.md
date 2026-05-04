# Benyuan iOS Shell Implementation Plan

## Phase 1 target
Ship a safe iOS shell that wraps the existing Benyuan web flow without changing core API contracts or agent output shapes.

## Scope
- Native app shell: SwiftUI
- Content renderer: `WKWebView`
- First supported flow:
  - `/`
  - `/collect`
  - `/processing/benyuan`
  - `/theater`
  - `/constellation`
- Resume strategy: reopen the last known in-flow route when the app restarts
- Native responsibilities:
  - safe area and status bar
  - launch/loading overlay
  - external link routing
  - photo permission handoff preparation
  - future share entry points

## Implementation order
1. Create a small SwiftUI shell app using `BenyuanShellApp.swift`
2. Add `BenyuanShellConfig.swift` and set `productionBaseURL`
3. Mount `BenyuanWebContainerView.swift` as the only initial screen
4. Persist last valid Benyuan route with `BenyuanRouteRecovery.swift`
5. Open external domains in Safari, keep Benyuan domains inside the shell
6. Add loading, retry, and offline states before TestFlight distribution

## Guardrails
- Do not rewrite agent prompts in this phase
- Do not mutate request/response contracts in this phase
- Do not fork the web UI into a second mobile-specific logic tree yet
- Treat A/B/C benchmark output as the regression baseline after each shell change

## Acceptance checklist
- App opens to Benyuan landing page
- User can complete `/collect -> /processing/benyuan -> /theater -> /constellation`
- Background / foreground does not lose the in-progress route
- Loading state is visible during slow analysis steps
- Unsupported external links open outside the shell
- A/B/C demo routes from the current benchmark can open directly
