# 达尔文内测发版清单

## 当前 beta profile

首轮内测固定使用这组运行策略：

- Review: `live + fallback mock`
- Research: `mock / local fixture`
- iOS OCR: `manual / fallback accepted`
- Android OCR: `ML Kit primary`

对应 Flutter define：

- `TRADEWISE_REVIEW_MODE=live`
- `TRADEWISE_REVIEW_FALLBACK_TO_MOCK=true`
- `TRADEWISE_RESEARCH_MODE=mock`
- 可选：`TRADEWISE_API_BASE_URL=<remote-api-base>`

## 环境文件

推荐先复制一份内测环境文件：

```bash
cd /Users/fanhao/Documents/Playground
cp docs/tradewise/internal-beta.env.example mobile/tradewise_ai/.internal-beta.env
```

如需放到别处，可通过 `TRADEWISE_INTERNAL_BETA_ENV_FILE=/abs/path/to/file` 让 `run_internal_beta.sh`、`build_internal_beta.sh`、`live_acceptance_smoke.sh`、`collect_internal_beta_artifacts.sh`、`check_internal_beta_readiness.sh` 自动加载。

## 发版前命令

### Web / Provider

```bash
cd /Users/fanhao/Documents/Playground
npx tsc --noEmit --pretty false
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:direct
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:route
npm run smoke:tradewise:research:route
```

若已有可用外部 server，再补一轮：

```bash
cd /Users/fanhao/Documents/Playground
BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:all
```

### 一键生成占位模板

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/bootstrap_internal_beta_release_prep.sh
```

这个脚本会在缺失时自动生成 `mobile/tradewise_ai/.internal-beta.env` 与 `android/key.properties`，并创建 `mobile/tradewise_ai/keystores/` 目录，但不会替你填写真实远端地址或签名密钥。

### Flutter

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/flutterw analyze
./tool/flutterw test
```

### 自动产物汇总

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/collect_internal_beta_artifacts.sh
./tool/check_internal_beta_readiness.sh
```

前者会把自动化检查日志、最新视觉基线引用和人工验收模板统一写到 `mobile/tradewise_ai/build/internal-beta/`；后者会额外输出 `latest-readiness.md/json`，明确当前距离“正式内测候选包”还差哪些环境或签名条件。

如果当前按 iOS-first 策略推进、Android 暂时后置，可使用：

```bash
TRADEWISE_RELEASE_SCOPE=ios ./tool/check_internal_beta_readiness.sh
```

该模式只把 iOS 必需条件作为阻塞项，Android 构建与真机验收会保留状态展示但不阻塞当前轮次。

### 视觉基线

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/capture_visual_baseline.sh ios all
```

## 运行与打包

### 本地 beta profile 运行

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/run_internal_beta.sh ios -d <device_id>
./tool/run_internal_beta.sh android -d <device_id>
```

### 打包命令

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_API_BASE_URL=https://<host>/api/tradewise ./tool/build_internal_beta.sh android-apk
TRADEWISE_API_BASE_URL=https://<host>/api/tradewise ./tool/build_internal_beta.sh android-appbundle
TRADEWISE_API_BASE_URL=https://<host>/api/tradewise ./tool/build_internal_beta.sh ios-device
```

## Android 签名

- 若要产出可分发 release 包，请先复制：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
cp android/key.properties.example android/key.properties
```

- 然后填入你的 keystore 信息。
- 若 `android/key.properties` 不存在，当前 release 构建仍会退回 debug signing，只适合本地验证，不适合正式内测分发。
- 当前 Android release / appbundle 默认关闭 `minify` / `shrinkResources`，并为 appbundle 保留 `SYMBOL_TABLE` 级别的 native symbols，以绕过 vendored ML Kit OCR 在 R8 与 symbol strip 下的构建问题；这适用于首轮内测，不建议直接沿用到商店正式首发。

## iOS 人工步骤

- `./tool/build_internal_beta.sh ios-device` 只验证 release 编译，不负责签名上传；每次运行会生成 `mobile/tradewise_ai/build/internal-beta/latest-build-ios-device.json`
- 真正上 TestFlight 仍需在 Xcode 中：
  - 选择正式 Team
  - 校验 Bundle Identifier
  - Archive
  - 上传 App Store Connect
- 当前工程已核对的 iOS 发布基线：
  - Workspace: `mobile/tradewise_ai/ios/Runner.xcworkspace`
  - Scheme: `Runner`
  - Bundle ID: `com.tradewiseai.tradewiseAi`
  - Display Name: `达尔文`
  - Bundle Name: `Darwin`
  - Version / Build: `0.1.0` / `1`
  - Minimum iOS: `15.5`
  - Launcher icon: 已使用达尔文图标生成到 `mobile/tradewise_ai/ios/Runner/Assets.xcassets/AppIcon.appiconset/`
  - Launch screen: 已使用纸页底色与达尔文中心图标
  - 权限文案：相机 / 相册已配置在 `mobile/tradewise_ai/ios/Runner/Info.plist`
- 如果你只是做同网段 iPhone 联调，可先保留 `mobile/tradewise_ai/.internal-beta.env` 里的局域网地址；如果你要发 TestFlight，必须先把 `TRADEWISE_API_BASE_URL` 改成公网可访问地址。
- 更细的 iOS/TestFlight 操作清单见：`docs/tradewise/ios-testflight-handoff.md`

## 真机验收

### Android

- 拍照 / 相册导入交割单
- OCR 草稿可编辑并带 warning
- 保存交易后，Growth 页可手动生成今日复盘
- 研报详情收藏 / 取消收藏后重启仍保留
- 记录结果到 `mobile/tradewise_ai/build/internal-beta/latest-manual-acceptance-template.md` 或复制其内容到正式验收单

### iOS

- 手动 / fallback OCR 路径能完整走通
- 保存交易后，Growth 页可手动生成今日复盘
- 研报详情收藏 / 取消收藏后重启仍保留
- 记录结果到 `mobile/tradewise_ai/build/internal-beta/latest-manual-acceptance-template.md` 或复制其内容到正式验收单

## 发布门槛

以下四项同时满足，才算内测可发：

- 三大页无 blocker
- Review 即使 fallback，也能从 UI 与 smoke 一眼看出原因
- Research 在默认 fixture 模式下稳定可读
- iOS / Android 至少各完成一次真机闭环记录
- `mobile/tradewise_ai/build/internal-beta/latest-summary.md`、最新 build report 和视觉基线截图可直接交给测试或外部同事复核
