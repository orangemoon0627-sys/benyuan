# Benyuan Origin iOS

This folder now holds the SwiftUI native-first iOS app for 本源.

## Current Position
SwiftUI 原生主流程 is the product path:
- auth and account
- Part 1 collection
- photo upload, delete, and draft state
- processing
- theater interaction
- constellation result
- native share and save affordances

The app still calls the existing Benyuan server APIs. That is intentional: native iOS owns the user experience, while the server owns model calls, persistence, account, feedback, and operational data.

## Web Policy
WKWebView is no longer the primary product renderer.

Allowed uses:
- Debug-only local inspection
- Legacy comparison while migrating old web behavior
- Bridge smoke checks when needed for historical regressions

Not allowed in TestFlight / release-facing flow:
- user-visible Web fallback
- Web/Native switch in the main UI
- relying on a webpage to render collect, theater, constellation, account, or result screens

## Build Commands
- Native build: `npm run ios:shell:build`
- Native simulator smoke: `npm run ios:shell:native-smoke`
- Native preview screenshots: `npm run ios:shell:native-preview`
- TestFlight preflight: `npm run ios:shell:testflight:preflight`
- Release archive validation: `npm run ios:shell:archive`

## Release Configuration Matrix

| configuration | environment | base URL source | debug policy | intended use |
| --- | --- | --- | --- | --- |
| `Debug` | `development` | launch arg / development fallback `http://127.0.0.1:3015` | debug-only Web inspector may be enabled | local simulator |
| `Staging` | `staging` | `BenyuanShellStagingBaseURL` in generated Info.plist | no user-facing debug UI | internal pre-release |
| `Release` | `production` | `BenyuanShellProductionBaseURL` in generated Info.plist | no user-facing debug UI | TestFlight / release candidate |

## Native Contract
The native app should keep these checks green before upload:
- `npm run smoke:ios:native-only`
- `npm run smoke:ios:typography-layout`
- `npm run ios:shell:native-preview`
- `npm run ios:shell:testflight:preflight`
