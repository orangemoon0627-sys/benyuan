# 本源 iOS / TestFlight 交接手册（2026-04-20）

这份手册只覆盖当前 `WKWebView + 原生壳` 方案进入 TestFlight 前的最后一段收口，不涉及改 Web contract，也不展开纯 SwiftUI 重写。

## 当前已完成

- Web 主流程自动化已重新验证通过：
  - `npm run build`
  - `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden`
  - `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:regression`
  - `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:native-smoke`
- iOS shell 构建脚本已打通：
  - `npm run ios:shell:build`
  - `npm run ios:shell:archive`（默认 unsigned archive，用于本地 release 验证）
- 当前最新验证产物：
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-shell-build.json`
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke.json`
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke-library.png`
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke-camera.png`
  - `/Users/fanhao/Documents/Playground/output/benyuan-ios-shell-archive.json`
- iOS shell release 配置已经显式分成 `Debug / Staging / Release`，不再在 release 配置下静默回退 localhost。
- AppIcon 资产已补齐到 `Assets.xcassets/AppIcon.appiconset/`。

## 当前工程基线

- iOS shell 目录：`/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell`
- Scheme：`BenyuanOriginShell`
- Bundle ID：`com.fanhao.benyuan.origin.shell`
- App 名称：`本源`
- 最低系统：`iOS 18.0`
- 当前版本号：
  - `MARKETING_VERSION = 0.2.0`
  - `CURRENT_PROJECT_VERSION = 2`

## 当前仍然阻塞 TestFlight 的项

### 1. 真实 release URL 还没填

当前 `project.yml` 里仍是占位值：

- `https://staging.benyuan.invalid`
- `https://app.benyuan.invalid`

这意味着：

- `Debug` 可本地联调
- `Staging / Release` 可验证壳层逻辑
- 但 **不能** 直接发给外部测试用户

### 2. 还没有正式签名主体

当前仓库里没有可直接复用的：

- Apple Team ID
- provisioning profile / signing identity
- App Store Connect 对应 app 记录状态

因此当前只做到了：

- simulator build
- native smoke
- unsigned release archive

还没有做到：

- signed archive
- App Store Connect upload

### 3. 真机闭环还没记到当前 release candidate

当前已有相机验收文档基础，但还需要按本次 release candidate 再做一轮：

- 相机权限
- 相册选图
- 分享面板
- 外链跳转
- 冷启动 / 热恢复
- 安全区与底部 CTA

## 建议执行顺序

### A. 先跑当前预检

```bash
cd /Users/fanhao/Documents/Playground
npm run ios:shell:testflight:preflight
```

这个命令会检查：

- release URL 是否还是占位值
- AppIcon 是否完整
- 最近 shell build / native smoke 产物是否存在

当前预期：**会失败**，因为 release URL 仍然是 `.invalid` 占位域名。

### B. 填真实环境地址

把以下值替换成真实公网域名：

- `INFOPLIST_KEY_BenyuanShellStagingBaseURL`
- `INFOPLIST_KEY_BenyuanShellProductionBaseURL`

修改文件：

- `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/project.yml`

### C. 重跑自动化护栏

```bash
cd /Users/fanhao/Documents/Playground
npm run build
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:regression
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:native-smoke
npm run ios:shell:archive
```

如果要做 signed archive，改用：

```bash
cd /Users/fanhao/Documents/Playground
BENYUAN_IOS_DEVELOPMENT_TEAM=<YOUR_TEAM_ID> npm run ios:shell:archive
```

### D. 在 Xcode 里做签名与上传

```bash
open /Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/BenyuanOriginShell.xcodeproj
```

Xcode 中需要检查：

- `Signing & Capabilities`
- `Team`
- `Bundle Identifier`
- `Version`
- `Build`

然后执行：

1. 选择 `Any iOS Device (arm64)` 或 Generic iOS Device
2. `Product -> Archive`
3. Organizer 中选择最新 archive
4. `Distribute App -> App Store Connect -> Upload`

### E. 真机回归

至少跑一轮完整链路：

1. 冷启动进入 `/collect`
2. 上传 / 相册 / 拍照
3. `/processing/benyuan -> /theater -> /constellation`
4. 分享
5. 外链
6. 后台恢复

记录建议继续落到：

- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md`
- `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-template.md`

## 上线门槛

以下项目同时满足，才算“可发 TestFlight”：

- `npm run build` 通过
- `smoke:benyuan:golden` 通过
- `ios:shell:regression` 通过
- `ios:shell:native-smoke` 通过
- `ios:shell:testflight:preflight` 通过
- `Staging / Release` 都指向真实公网地址
- 至少完成一次 signed archive
- 至少完成一次真机闭环记录
- `PF-003` 与 `PF-004` 不再作为 blocker

## 当前剩余时间判断

以 2026-04-20 为基线，当前代码和自动化已经到位，剩余主要是 release 运维和设备验收：

- **1–2 天**：补真实 URL、签名、archive、首轮 TestFlight 上传
- **2–4 天**：真机回归、内部安装验证、修一轮反馈
- **总计约 5–7 个工作日**：做到可发 TestFlight 的稳定版本
- 如果要再补更稳妥的外部内测闭环，按 **7–10 个工作日** 看更合理

## 当前不再是主要阻塞的项

- Web 主流程 contract
- storage keys / session keys
- native bridge names：`share` / `openExternal` / `pickImages`
- simulator-native smoke 环境本身
- 生产依赖的 `npm audit` 高危漏洞
