# 达尔文 iOS / TestFlight 交接手册

这份手册只覆盖 iOS 内测发版最后一段人工流程，不再扩 Flutter 功能。

## 当前已完成

- iOS release 编译通过：
  - `mobile/tradewise_ai/build/internal-beta/latest-build-ios-device.json`
- iOS 品牌配置已接入：
  - App 显示名称：`达尔文`
  - Bundle name：`Darwin`
  - Launcher icon：`mobile/tradewise_ai/ios/Runner/Assets.xcassets/AppIcon.appiconset/`
  - Launch screen：纸页底色 + 达尔文中心图标
- iOS 三个首屏最新截图：
  - `/trade`: `output/darwin-ios-visual-check-2026-04-26-v2/ios-trade-sample-capture.png`
  - `/growth`: `output/darwin-ios-visual-check-2026-04-26-v2/ios-growth-evolution-map.png`
  - `/research`: `output/darwin-ios-visual-check-2026-04-26-v2/ios-research-environment.png`

## 当前工程基线

- Xcode workspace: `mobile/tradewise_ai/ios/Runner.xcworkspace`
- Scheme: `Runner`
- Bundle ID: `com.tradewiseai.tradewiseAi`
- App 名称: `达尔文`
- Bundle name: `Darwin`
- 当前版本: `0.1.0`
- 当前 Build: `1`
- 最低系统版本: `iOS 15.5`
- 权限文案：
  - `NSCameraUsageDescription = 需要使用相机拍摄并识别交易样本。`
  - `NSPhotoLibraryUsageDescription = 需要访问相册导入交易样本图片。`

## 发 TestFlight 前必须确认

### 1. API 地址

- 当前 `mobile/tradewise_ai/.internal-beta.env` 使用的是局域网地址：
  - `http://192.168.1.61:3201/api/tradewise`
- 这只适合同网段真机联调，不适合 TestFlight。
- 真正发 TestFlight 前，先把它改成公网可访问地址，例如：

```bash
TRADEWISE_API_BASE_URL=https://your-domain.com/api/tradewise
```

### 2. Apple 签名主体

- 在 Xcode 中给 `Runner` 选择可用 Team
- 确认该 Team 下允许使用 `com.tradewiseai.tradewiseAi`
- 如果 Bundle ID 已被占用，就在 Xcode 中改成新的唯一值，并同步更新后续发布记录

### 3. App Store Connect 侧准备

- 确认已有对应 App 记录，或准备首次创建
- 准备最小发布信息：
  - App 名称
  - Subtitle / 简介
  - 测试说明
  - 隐私与权限说明

## 本地到 TestFlight 的建议顺序

### A. 先做一次最终自动化检查

```bash
cd /Users/fanhao/Documents/Playground
npx tsc --noEmit --pretty false
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:direct
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:route
npm run smoke:tradewise:research:route
```

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/flutterw analyze
./tool/flutterw test
TRADEWISE_RELEASE_SCOPE=ios ./tool/check_internal_beta_readiness.sh
```

### B. 生成 iOS release 编译产物

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/build_internal_beta.sh ios-device
```

这个命令只验证 release 编译，不会替你做 Xcode 签名或上传。

### C. 打开 Xcode

```bash
open /Users/fanhao/Documents/Playground/mobile/tradewise_ai/ios/Runner.xcworkspace
```

在 Xcode 里检查：

- `Runner` target
- `Signing & Capabilities`
- `Team`
- `Bundle Identifier`
- `Version`
- `Build`

建议把 `Version` / `Build` 与这次内测批次对应起来。

### D. Archive 并上传

1. 顶部设备选择切到 `Any iOS Device (arm64)` 或 Generic iOS Device
2. 菜单 `Product -> Archive`
3. Archive 完成后在 Organizer 中选择最新构建
4. `Distribute App -> App Store Connect -> Upload`
5. 上传完成后等待 TestFlight 处理

## 如果只做 iPhone 同网段联调

如果你现在不急着上 TestFlight，而是先想让同网段 iPhone 跑起来，推荐这样做：

1. 根目录启动 LAN 可访问的 CRS API：

```bash
cd /Users/fanhao/Documents/Playground
npm run dev:tradewise:crs:lan
```

2. 移动端跑 beta profile：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/run_internal_beta.sh ios -d <device_id>
```

## 当前仍未完成的人工项

- 把 `TRADEWISE_API_BASE_URL` 从局域网地址切到公网地址
- 在 Xcode 中选择正式 Team
- 在 App Store Connect 中创建或确认 `达尔文` App 记录
- 完成一次 Archive
- 上传到 TestFlight
- 用真实 iPhone 再走一遍闭环验收并记录结果

## 当前不视为 iOS 阻塞的问题

- Review provider 偶发 schema fallback：只要 UI 来源标识正常、重跑可恢复 live，即不阻塞首轮内测
- Research 默认仍是 fixture/mock：这是当前 beta profile 的设计，不是回归
- Android 尚未补真机验收：不影响先推进 iOS/TestFlight 这条线
