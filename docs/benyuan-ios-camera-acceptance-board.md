# Benyuan iPhone Camera Acceptance Board

## How to use
- Run every line item on a physical iPhone.
- Mark `done` only when UI evidence and network evidence both exist.
- If one item fails, paste the matching record file path beside it.

## Panel sync note
- `/lab/status` and `/lab/native-handoff` now read this matrix directly to determine manual readiness.
- To mark a check complete, set the `Status` cell to `[x]` and paste at least one evidence path into `Evidence`.
- Prefer absolute repo paths in `Evidence` so the panels can surface the latest completed item automatically.

## Current automated evidence
- `ios:shell:regression` latest output: `/Users/fanhao/Documents/Playground/output/benyuan-ios-regression.json`
- latest rerun: `2026-03-14T09:24:22.451Z` · `18 / 18` passed · base URL `http://127.0.0.1:3015`
- `ios:shell:native-smoke` latest output: `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke.json`
- latest rerun: `2026-03-14T09:24:43.068Z` · simulator `iPhone 17` · `library + camera` both returned screenshots
- `smoke:benyuan:golden` latest output: `/Users/fanhao/Documents/Playground/output/benyuan-golden-audit.json`
- latest rerun: `2026-03-14T09:25:27.844112Z` · `8 / 8` passed
- smoke screenshots:
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke-library.png`
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke-camera.png`
- These two outputs prove the current shell + simulator path is still usable; the physical-device gap is closed separately by the manual evidence block below.

## Current manual evidence
- real-device record: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md`
- current board state: `10 / 10` complete
- panel status: `/lab/status` and `/lab/native-handoff` should both read this board as `ready`

## Acceptance matrix
| Check item | Route / question | Target result | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| Allow path | `/collect/c` · `C2_precious_photo_analysis` | returns to same question and uploads through `/api/part1/upload` | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | UI-confirmed on physical iPhone; upload card rendered with native badge and metadata. |
| Deny path | `/collect/c` · `C2_precious_photo_analysis` | fails safely, no upload created, web fallback remains | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Returns `camera_permission_denied`; no phantom upload from deny action; library fallback remains usable. |
| Cancel path | `/collect/a` · `A2_music_analysis` | returns safely, no phantom upload created | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Native camera cancel returned to current question without phantom upload. |
| Resume path | any upload question | background / foreground does not break shell route | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Background/foreground resume preserved route and interactivity. |
| Module A success | `/collect/a` · `A2_music_analysis` | native camera asset lands with `原生拍照` badge | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Upload visible after flow advanced into next question; native badge, thumbnail, metadata intact. |
| Module C social success | `/collect/c` · `C1_social_posts_analysis` | native camera asset lands with `原生拍照` badge | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Upload visible after auto-advance; native badge, thumbnail, metadata intact. |
| Module C photo success | `/collect/c` · `C2_precious_photo_analysis` | native camera asset lands with `原生拍照` badge | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Native camera upload rendered correctly on return to question. |
| Web fallback intact | any upload question | web upload still usable after camera flow | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Page-level file picker still uploads successfully after native-flow testing. |
| Library fallback intact | any upload question | native library still usable after camera flow | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Native library picker remained usable after deny-path validation. |
| Thumbnail preview | any successful run | preview card shows thumbnail / size / upload time | [x] | `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md` | Successful runs rendered thumbnail, source badge, file size, and upload time. |

## Required artifacts per run
- before-action screenshot
- after-return screenshot
- network confirmation for `/api/part1/upload` when success path is expected
- record file path from one of the templates below

## Recommended record files
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-template.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-deny.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-cancel.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-sample-resume.md`
