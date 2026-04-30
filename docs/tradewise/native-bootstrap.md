# Native Shell Bootstrap

## 前提

优先使用仓库自带 wrapper，不要求全局 Flutter 在 PATH 中：

```bash
cd mobile/tradewise_ai
./tool/flutterw --version
```

如果仓库根目录存在 `mobile/.flutter-sdk`，`flutterw` 会优先使用它；否则回退到系统 Flutter。

## 执行步骤

```bash
cd mobile/tradewise_ai
./tool/bootstrap_native_shell.sh
./tool/bootstrap_android_sdk.sh
./tool/flutterw pub get
./tool/flutterw pub run build_runner build --delete-conflicting-outputs
./tool/flutterw analyze
./tool/flutterw test
./tool/flutterw devices
./tool/flutterw build apk --debug
./tool/flutterw build ios --simulator
./tool/flutterw build ios --no-codesign
```

## Bootstrap 脚本会做什么

### `bootstrap_native_shell.sh`

- 用 `flutter create` 补齐 `android/` 与 `ios/` native shell
- 固定 Android `minSdk` 为 `24`
- 给 `AndroidManifest.xml` 增加网络、相机、图片读取权限
- 给 `ios/Runner/Info.plist` 增加：
  - `MinimumOSVersion = 15.5`
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryUsageDescription`
- iOS 工程侧同步将 `Podfile` 与 `Runner.xcodeproj` 部署版本拉到 `15.5`

### `bootstrap_android_sdk.sh`

- 在仓库内创建 `mobile/.android-sdk`
- 把 Homebrew 安装的 `cmdline-tools` 映射为本地 SDK 的 `cmdline-tools/latest`
- 预装：
  - `platform-tools`
  - `platforms;android-35`
  - `platforms;android-36`
  - `build-tools;35.0.0`
  - `build-tools;36.0.0`
  - `ndk;28.2.13676358`
  - `cmake;3.22.1`
- 自动接受 Android licenses
- 自动回写 `android/local.properties`
- 若 NDK 已安装，自动写入 `ndk.dir`

## Wrapper

如果仓库根目录存在 `mobile/.flutter-sdk`，可以直接使用 `mobile/tradewise_ai/tool/flutterw`，避免依赖全局 Flutter 安装路径。

`flutterw` 会额外处理：

- 优先导出仓库内 `mobile/.android-sdk`
- 若本机存在 `openjdk@21`，自动导出 `JAVA_HOME`
- 保持 `android/local.properties` 与当前 Flutter / Android SDK 路径一致
- 若检测到本地 NDK，则自动回写 `ndk.dir`

## 首次构建耗时点

### Android

首次 `./tool/flutterw build apk --debug` 可能会额外下载：

- Flutter engine debug artifacts
- Android NDK
- CMake

### iOS

首次 `./tool/flutterw build ios --simulator` 可能会额外下载：

- `sqlite-src-3520000.zip`
- 图片选择等基础 Pods

因此首次构建比日常增量构建慢很多，属于正常现象。

### iOS OCR fallback

为了避免 Apple Silicon + iOS 26 simulator 与上游 Google ML Kit iOS 二进制的架构冲突，当前工程做了两层收口：

- `vendor/google_mlkit_commons` 与 `vendor/google_mlkit_text_recognition` 仅保留 Android 原生插件声明
- Flutter 侧在非 Android 设备上自动切到本地 fallback OCR

这意味着：

- Android 继续使用 ML Kit 真 OCR
- iOS simulator / iOS device 都会得到一份可编辑的 OCR 演示草稿
- 若用户粘贴真实交割单原文，仍会走本地文本解析，不影响页面联调与表单闭环

## 当前本机状态

截至 2026-03-10，这台机器已经具备：

- 可用的仓库内 Android SDK：`/Users/fanhao/Documents/Playground/mobile/.android-sdk`
- 可用的 CocoaPods
- 已安装的 iOS runtime：`iOS 26.3`
- 可识别 simulator：当前脚本会自动选择可用的 iPhone Simulator（优先 `iPhone 17 (mobile)` / `iPhone 17 Pro (mobile)`）
- 已产出 Android debug APK：`/Users/fanhao/Documents/Playground/mobile/tradewise_ai/build/app/outputs/flutter-apk/app-debug.apk`
- 已产出 iOS device Runner：`/Users/fanhao/Documents/Playground/mobile/tradewise_ai/build/ios/iphoneos/Runner.app`
- `capture_visual_baseline.sh` / `live_acceptance_smoke.sh` 现已支持自动解析可用 simulator，无需手动硬编码 UDID

## 后续人工检查

- Android 真机验证相机与图库权限弹窗
- iOS 真机验证拍照、相册与中文输入
- 执行一次 OCR 识别，确认 `google_mlkit_text_recognition` 链路可用
- 在真机上完整走一遍“录交易 -> 生成复盘 -> 查看研报”的闭环
- 若后续要恢复 iOS 真 OCR，可在服务端 OCR 或 device-only iOS 插件分支稳定后再重新接回 ML Kit


## 内测打包辅助

当前仓库已补两条辅助脚本：

- `mobile/tradewise_ai/tool/run_internal_beta.sh`
  - 默认 `TRADEWISE_REVIEW_MODE=live`
  - 默认 `TRADEWISE_REVIEW_FALLBACK_TO_MOCK=true`
  - 默认 `TRADEWISE_RESEARCH_MODE=mock`
- `mobile/tradewise_ai/tool/build_internal_beta.sh`
  - 支持 `android-apk` / `android-appbundle` / `ios-simulator` / `ios-device`

Android release 构建现在会优先读取 `android/key.properties`；可先参考 `android/key.properties.example`。
若未提供 keystore，release 仍会退回 debug signing，仅适合本地验证。
