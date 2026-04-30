# Benyuan iOS Regression Baseline

更新时间：2026-03-11

## Automated checks
- Primary flow routes respond with HTTP 200:
  - `/`
  - `/collect`
  - `/processing/benyuan`
  - `/theater`
  - `/constellation`
  - `/lab/status`
- Demo routes from the frozen A / B / C benchmark respond with HTTP 200
- Runtime and Part 1 schema endpoints respond with HTTP 200
- Pack-specific theater and constellation APIs respond with HTTP 200
- Latest benchmark result records no fallback events in `events`

## Manual checks for the shell app
- Launch app from cold start and verify landing page shows
- Enter `/collect`, background the app, return to app, verify route resumes
- Open a frozen demo theater route and verify the page stays inside WebView
- Open a non-Benyuan external link and verify Safari opens
- Trigger a long-running processing route and verify loading overlay remains visible
- Disable network and confirm offline banner appears
- Trigger native share bridge from JS once the web layer binds to `window.BenyuanNativeShell.share`
- Trigger photo-library and camera upload through the native bridge and confirm files still enter `/api/part1/upload`

## Frozen demo routes
- A:
  - `/theater?part1_id=part1_i2ffoggu&theater_script_id=theater_c8wkeirl`
  - `/constellation?constellation_id=const_9pfnj81l`
- B:
  - `/theater?part1_id=part1_h9zwr2ii&theater_script_id=theater_f86ga7vv`
  - `/constellation?constellation_id=const_332xc7ue`
- C:
  - `/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m`
  - `/constellation?constellation_id=const_an86s1af`

## Baseline artifacts
- Latest web regression JSON: `/Users/fanhao/Documents/Playground/output/benyuan-ios-regression.json`
- Latest benchmark JSON pointer: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark.json`
- Latest benchmark snapshot: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-10T17-44-42.json`
- Current beta freeze archive: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2-r2.tar.gz`
- Current beta freeze folder: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2`
