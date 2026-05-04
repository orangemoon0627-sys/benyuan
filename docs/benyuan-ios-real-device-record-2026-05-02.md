# 本源 iOS 真机验收记录 · 2026-05-02

## Session meta
- test date: 2026-05-02 13:57 CST
- operator: Codex + fanhao
- device name: orangemoon
- device identifier: `D9E6E103-375A-559D-84D7-2ADCAC0CF98C`
- hardware: iPhone 17 Pro Max
- iOS version: 26.4.2
- shell build identifier: `BenyuanOriginShell` Debug local build
- bundle id: `com.fanhao.benyuan.origin.shell`
- app version: 0.2.0
- build number: 2
- base URL: `https://benyuan-production.up.railway.app`
- environment: staging

## Build and install
- device connection: pass
- Debug device build: pass
- signing team used for local device build: `CY3DD3J5CU`
- provisioning profile: `iOS Team Provisioning Profile: com.fanhao.benyuan.origin.shell`
- install result: pass
- launch result: pass after device unlock

## Commands verified
```bash
xcrun devicectl list devices
xcodebuild -project mobile/benyuan_origin_ios_shell/BenyuanOriginShell.xcodeproj \
  -scheme BenyuanOriginShell \
  -configuration Debug \
  -destination 'id=00008150-000110822EBA401C' \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=CY3DD3J5CU \
  BenyuanShellEnvironment=staging \
  BenyuanShellStagingBaseURL=https://benyuan-production.up.railway.app \
  BenyuanShellProductionBaseURL=https://benyuan-production.up.railway.app \
  build

xcrun devicectl device install app \
  --device D9E6E103-375A-559D-84D7-2ADCAC0CF98C \
  /Users/fanhao/Library/Developer/Xcode/DerivedData/BenyuanOriginShell-ddnlzbvrnewlwiftmlhcyclhmdeu/Build/Products/Debug-iphoneos/BenyuanOriginShell.app

xcrun devicectl device process launch \
  --device D9E6E103-375A-559D-84D7-2ADCAC0CF98C \
  com.fanhao.benyuan.origin.shell
```

## Fixture smoke launches
- route: `/lab/native-handoff/smoke?autorun=1&source=library`
- fixture: `native-smoke-fixture.png`
- launch status: pass
- route: `/lab/native-handoff/smoke?autorun=1&source=camera`
- fixture: `native-smoke-fixture.png`
- launch status: pass

## Remaining manual verification
The Mac can confirm build, install, and launch through `devicectl`, but it cannot currently capture a real-device screen image in this setup. These items still require direct phone observation:

- landing / shell first screen appears without blank page
- `/lab/native-handoff/smoke?autorun=1&source=library` shows upload success
- `/lab/native-handoff/smoke?autorun=1&source=camera` shows upload success when fixture is enabled
- real photo library picker opens without fixture
- real camera permission prompt and capture work without fixture
- share sheet opens from result page
- external link handoff opens in the system browser
- safe area and bottom CTA look correct on iPhone 17 Pro Max

## Current outcome
- result: partial pass
- passed: physical device connection, signing, install, launch, fixture smoke route launch
- blocked: visual confirmation and hardware camera / photo picker acceptance still need direct phone interaction
- next action: run manual phone checks above, then close the real-device record as pass / fail.
