# Benyuan iPhone Camera Real-Device Record Sample · Deny

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
- permission choice made: deny

## Route under test
- route: `/collect/c`
- question id: `C2_precious_photo_analysis`
- module: C
- expected upload range: 1-1

## Action log
1. launch shell
2. enter `/collect/c`
3. tap `直接拍照`
4. permission dialog appears
5. tap `不允许`
6. shell returns to the same upload question
7. no upload request is created

## UI verification
- returned to same route: yes
- source badge shows `原生拍照`: no
- thumbnail rendered: no
- file size rendered: no
- upload time rendered: no
- uploaded count updated: no
- web upload still usable after run: yes
- native library still usable after run: yes

## Network verification
- `/api/part1/upload` status: not triggered
- request timestamp: none
- upload preview endpoint status: not triggered
- other notable requests: no additional upload traffic

## Captured evidence
- before-camera screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-deny-before.png`
- after-return screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-deny-after.png`
- optional screen recording path: `/Users/fanhao/Documents/Playground/output/device-camera-deny.mov`
- log excerpt path: `/Users/fanhao/Documents/Playground/output/device-camera-deny-log.txt`

## Outcome
- result: pass
- severity if failed: none
- reproduction frequency: once
- short summary: deny path failed safely, returned to the same question, and preserved all fallback upload options.

## Notes for follow-up
- bug hypothesis: none in this sample
- likely layer: permissions path verified
- suggested next action: rerun after permission reset to confirm allow path still succeeds
