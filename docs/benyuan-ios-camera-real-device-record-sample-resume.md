# Benyuan iPhone Camera Real-Device Record Sample · Resume

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
- camera permission before run: granted
- photo library permission before run: granted
- did permission dialog appear: no
- permission choice made: n/a

## Route under test
- route: `/collect/c`
- question id: `C1_social_posts_analysis`
- module: C
- expected upload range: 1-3

## Action log
1. launch shell
2. enter `/collect/c`
3. tap `直接拍照`
4. native camera opens normally
5. send app to background before confirming photo
6. reopen shell and return to foreground
7. confirm the app returns to the same question without blank webview

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
- other notable requests: route restore completed without creating upload traffic

## Captured evidence
- before-camera screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-resume-before.png`
- after-return screenshot path: `/Users/fanhao/Documents/Playground/output/device-camera-resume-after.png`
- optional screen recording path: `/Users/fanhao/Documents/Playground/output/device-camera-resume.mov`
- log excerpt path: `/Users/fanhao/Documents/Playground/output/device-camera-resume-log.txt`

## Outcome
- result: pass
- severity if failed: none
- reproduction frequency: once
- short summary: background / foreground resume returned to the same upload question and kept the shell stable.

## Notes for follow-up
- bug hypothesis: none in this sample
- likely layer: route recovery path verified
- suggested next action: rerun resume flow after a successful capture to confirm upload completion also survives resume
