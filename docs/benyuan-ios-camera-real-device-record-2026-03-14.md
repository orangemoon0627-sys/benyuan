# Benyuan iPhone Camera Real-Device Record · 2026-03-14

## Session meta
- test date: 2026-03-14
- operator: fanhao + Codex
- device model: user iPhone (model not recorded)
- iOS version: not recorded
- shell build identifier: BenyuanOriginShell debug local build
- app source: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell`
- base URL: `http://192.168.1.61:3015`
- environment: local-lan

## Evidence note
- primary evidence source: real-device manual verification in the Codex thread
- screenshots: captured in chat thread, not exported into repo
- network trace: not separately persisted; successful upload is inferred from returned upload cards, thumbnail rendering, file metadata, and continued Part 1 flow

## Result matrix

### Allow path · `/collect/c` · `C2_precious_photo_analysis`
- result: pass
- native camera opened
- captured photo returned to the same question flow
- upload card rendered with `原生拍照`
- thumbnail, file size, MIME type, and upload time were visible
- no crash

### Deny path · `/collect/c` · `C2_precious_photo_analysis`
- result: pass
- camera permission disabled before run
- tapping `直接拍照` did not enter camera
- web layer showed `camera_permission_denied`
- no phantom upload created by the deny action itself
- native library fallback remained usable
- no crash

### Cancel path · `/collect/a` · `A2_music_analysis`
- result: pass
- camera permission enabled
- native camera opened
- user cancelled from the system camera without capturing
- returned to current question
- no phantom upload created
- no crash

### Resume path · upload flow background / foreground
- result: pass
- app sent to background and resumed to foreground during upload flow
- no white screen
- current flow remained intact
- app remained operable
- no crash

### Module A success · `/collect/a` · `A2_music_analysis`
- result: pass
- camera capture completed
- flow advanced into `文学共鸣`
- returning to the question showed `原生拍照`, thumbnail, and file metadata
- no crash

### Module C social success · `/collect/c` · `C1_social_posts_analysis`
- result: pass
- camera capture completed
- flow auto-advanced to the next question after upload
- returning to the previous question showed `原生拍照`, thumbnail, and file metadata
- no crash

### Module C photo success · `/collect/c` · `C2_precious_photo_analysis`
- result: pass
- camera capture completed
- upload card rendered correctly on return
- thumbnail and file metadata visible
- no crash

### Library fallback intact
- result: pass
- after deny path, `从相册选择` still worked
- selected asset uploaded successfully
- thumbnail and file metadata rendered
- no crash

### Web fallback intact
- result: pass
- page-level `选择文件` still worked after native-flow testing
- selected file uploaded successfully in `C1`
- thumbnail and file metadata rendered
- no crash
- note: upload completion auto-advanced to the next question in current collect flow

### Thumbnail preview
- result: pass
- successful uploads showed thumbnail, source badge, file metadata, and upload time

## Outcome
- overall result: pass
- shell / bridge / web upload / route recovery all verified on a physical iPhone for the tested matrix
- remaining follow-up: if pilot handoff requires archive-grade evidence, export one success screenshot pair and one deny screenshot pair into `/Users/fanhao/Documents/Playground/output/`
