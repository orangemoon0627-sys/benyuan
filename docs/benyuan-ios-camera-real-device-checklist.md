# Benyuan iPhone Camera Real-Device Checklist

## Why this exists
As of 2026-03-10, simulator camera smoke for the Benyuan iOS shell is intentionally fixture-backed.
It proves the native bridge -> web upload -> `/api/part1/upload` roundtrip, but it does not prove real camera hardware behavior.

This checklist closes that gap on a physical iPhone without changing any current API contracts.

## Goal
Validate that `window.BenyuanNativeShell.pickImages({ source: "camera" })` works end-to-end on a real iPhone and still writes through the single existing Part 1 upload ingress.

## Pass criteria
A run is considered successful only if all of the following are true:
- Camera permission prompt appears correctly on first use, or previously granted permission is honored.
- The shell opens the native camera, captures a new photo, and returns to the web flow.
- The web layer uploads the captured image through `/api/part1/upload`.
- The uploaded asset appears in the current Part 1 question with source badge `原生拍照`.
- Thumbnail, file size, and upload time render correctly in the uploaded-assets panel.
- No route loss occurs when returning from the native camera.
- The existing web upload flow remains usable after the native path completes.

## Scope
Primary scope:
- `/collect/a`
- `/collect/c`
- `/lab/native-handoff/smoke?source=camera`
- `A2_music_analysis`
- `C1_social_posts_analysis`
- `C2_precious_photo_analysis`

Out of scope for this checklist:
- image quality tuning
- provider-side AI interpretation quality
- constellation text quality
- offline upload recovery after process kill

## Preflight
Before testing, confirm all of the following:
- Physical iPhone available and trusted by the Mac.
- App built from `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell`.
- Local web server or deployed environment is reachable from the device.
- If using local development, use a LAN-reachable host instead of `127.0.0.1`.
- Camera permission is either reset for first-run testing or already known.
- Test operator knows whether they are validating a local dev server or a staging deployment.

## Recommended setup
### Option A: local LAN validation
1. Start the web app from `/Users/fanhao/Documents/Playground` with a LAN-reachable hostname.
2. Point the iOS shell base URL to that LAN address.
3. Install and run the shell on the iPhone.

### Option B: staging validation
1. Deploy the current web build.
2. Point the shell to the staging base URL.
3. Install and run the shell on the iPhone.

## Evidence to capture
Capture these artifacts for every run:
- 1 screenshot before tapping `直接拍照`
- 1 screenshot after successful upload showing `原生拍照`
- 1 short note for whether the permission prompt appeared
- Xcode console excerpt or device log for launch / bridge events if available
- network confirmation that `/api/part1/upload` returned `200`
- structured record using `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-template.md`

## Core test cases
### Case 1: first-time permission allow
1. Remove camera permission for the shell app in iPhone Settings.
2. Open `/collect/a` or `/lab/native-handoff/smoke?source=camera`.
3. Tap `直接拍照`.
4. Confirm the iOS camera permission prompt appears.
5. Tap `允许`.
6. Take a photo and confirm use.
7. Verify the web page returns with an uploaded card labeled `原生拍照`.
8. Verify the request lands in `/api/part1/upload` and returns `200`.

Expected result:
- Permission prompt appears once.
- Upload completes without route reset.
- Uploaded card metadata is visible.

### Case 2: permission denied
1. Reset camera permission.
2. Tap `直接拍照`.
3. Deny camera access.
4. Observe returned state in the web UI.

Expected result:
- The flow does not crash.
- User sees a recoverable status.
- Web upload entry remains available.
- Existing uploaded assets, if any, remain unchanged.

### Case 3: capture then cancel
1. Open native camera from the upload card.
2. Cancel before confirming a photo.

Expected result:
- The UI returns to the same Part 1 question.
- No phantom upload is created.
- No previously uploaded assets are removed.

### Case 4: repeat capture on the same question
1. Complete one camera upload on a question.
2. Trigger `直接拍照` again.
3. Capture a second image if the question allows more than one asset.

Expected result:
- The second upload appends correctly when allowed.
- The uploaded-assets panel updates counts and origin summary.
- The API path remains `/api/part1/upload`.

### Case 5: resume stability
1. Open the native camera from Part 1.
2. Background the app before confirming the photo.
3. Return to the app and finish or cancel capture.

Expected result:
- Shell resumes to the same route.
- No broken overlay or blank webview state appears.
- If the capture completes, the upload still returns to the correct question.

### Case 6: cross-module confirmation
Run at least one successful camera upload from each of the following:
- `A2_music_analysis`
- `C1_social_posts_analysis`
- `C2_precious_photo_analysis`

Expected result:
- All three questions accept native camera assets.
- The same upload preview rules apply in every module.

## Regression checks after a successful run
After camera succeeds once, confirm these still work:
- web upload still opens and uploads normally
- native library upload still works
- Part 1 submit still proceeds into the real analysis chain
- uploaded asset preview endpoint still loads thumbnails correctly

## Failure notes template
If a run fails, record it in this shape:
- device:
- iOS version:
- shell build identifier:
- base URL:
- route:
- question id:
- permission state:
- action attempted:
- visible error:
- network status:
- screenshot path:
- reproduction frequency:

## Decision rule
The camera bridge can be considered production-ready for phase 1 only after:
- at least 1 first-run allow path succeeds
- at least 1 deny path fails safely
- at least 1 cancel path fails safely
- at least 1 successful upload is verified from both module A and module C

## Related references
- `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/NativeBridgeContract.md`
- `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/README.md`
- `/Users/fanhao/Documents/Playground/scripts/benyuan-ios-native-smoke.mjs`
- `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke.json`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-template.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-deny.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-cancel.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`
