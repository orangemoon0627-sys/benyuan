# Benyuan iPhone Camera Real-Device Record Template

## Session meta
- test date:
- operator:
- device model:
- iOS version:
- shell build identifier:
- app source:
- base URL:
- environment: local-lan / staging / production-like

## Permission baseline
- camera permission before run: not-determined / granted / denied
- photo library permission before run:
- did permission dialog appear: yes / no
- permission choice made:

## Route under test
- route:
- question id:
- module:
- expected upload range:

## Action log
1. launch shell
2. enter route
3. tap `直接拍照`
4. native camera status:
5. capture or cancel:
6. return-to-web status:
7. upload status:

## UI verification
- returned to same route: yes / no
- source badge shows `原生拍照`: yes / no
- thumbnail rendered: yes / no
- file size rendered: yes / no
- upload time rendered: yes / no
- uploaded count updated: yes / no
- web upload still usable after run: yes / no
- native library still usable after run: yes / no

## Network verification
- `/api/part1/upload` status:
- request timestamp:
- upload preview endpoint status:
- other notable requests:

## Captured evidence
- before-camera screenshot path:
- after-upload screenshot path:
- optional screen recording path:
- log excerpt path:

## Outcome
- result: pass / fail / blocked
- severity if failed: blocker / major / minor
- reproduction frequency: always / intermittent / once
- short summary:

## Notes for follow-up
- bug hypothesis:
- likely layer: shell / bridge / web upload / routing / permissions / environment
- suggested next action:
