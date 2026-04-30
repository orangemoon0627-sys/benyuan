# Benyuan iPhone Camera Real-Device Record Sample

## Session meta
- test date: 2026-03-10
- operator: Codex
- device model: iPhone 17 Pro
- iOS version: 26.0
- shell build identifier: BenyuanOriginShell debug local build
- app source: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell`
- base URL: `http://192.168.31.24:3015`
- environment: local-lan

## Permission baseline
- camera permission before run: not-determined
- photo library permission before run: granted
- did permission dialog appear: yes
- permission choice made: allow

## Route under test
- route: `/collect/c`
- question id: `C2_precious_photo_analysis`
- module: C
- expected upload range: 1-1

## Action log
1. launch shell
2. enter `/collect/c`
3. tap `直接拍照`
4. native camera opens normally
5. capture one test photo and confirm use
6. shell returns to the same question card
7. upload completes and card metadata renders

## UI verification
- returned to same route: yes
- source badge shows `原生拍照`: yes
- thumbnail rendered: yes
- file size rendered: yes
- upload time rendered: yes
- uploaded count updated: yes
- web upload still usable after run: yes
- native library still usable after run: yes

## Network verification
- `/api/part1/upload` status: 200
- request timestamp: 2026-03-10 16:42 CST
- upload preview endpoint status: 200
- other notable requests: `/api/part1/uploaded/{assetId}` returned thumbnail normally

## Captured evidence
- before-camera screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-before.png`
- after-upload screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-after.png`
- optional screen recording path: `/Users/fanhao/Documents/Playground/output/device-camera-run.mov`
- log excerpt path: `/Users/fanhao/Documents/Playground/output/device-camera-log.txt`

## Outcome
- result: pass
- severity if failed: none
- reproduction frequency: once
- short summary: real-device camera capture returned through the same Part 1 upload chain and rendered correctly in the uploaded-assets panel.

## Notes for follow-up
- bug hypothesis: none in this sample
- likely layer: verified shell + bridge + web upload chain
- suggested next action: rerun deny / cancel paths and record them with the same template
