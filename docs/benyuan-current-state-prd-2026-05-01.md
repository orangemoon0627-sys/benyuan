# 本源当前状态 PRD（截至 2026-05-01）

## 1. 文档摘要

本文档用于同步「本源」到目前为止的产品、技术、部署、iOS 真机测试与上线状态。当前阶段的核心目标不是扩展新功能，而是把现有 `Web 主流程 + iOS WKWebView 原生壳` 打通到可稳定真机测试，并为后续 TestFlight / App Store 上线保留清晰路径。

### 当前一句话状态

本源 Web 主流程已经具备可构建、可部署、可通过 iOS 壳安装到真机的基础能力；当前最大阻塞不是业务功能，而是公网访问稳定性、TestFlight 发布权限，以及主流程 UI 仍需按新生成式宇宙感方向继续收口。

### 当前优先级

1. 先保障真机可测：用开发签名包 + 本地/隧道 Web 服务跑通主流程。
2. 再解决公网 Web 稳定入口：Railway 域名当前在本机与手机侧不可稳定访问，需要换稳定域名或 Cloudflare 正式隧道。
3. 最后处理 TestFlight：当前 Apple ID 无 App Store Connect 发布权限，不能上传 TestFlight。

---

## 2. 产品定位

### 产品名称

本源

### 产品形态

- Web 主流程：Next.js 应用，承载采集、处理、剧场、星图结果。
- iOS App：SwiftUI + WKWebView Hybrid 壳，承载原生启动、相机/相册、分享、外链、路由恢复与安全区体验。

### 产品目标

让用户通过一次沉浸式精神探索，完成从自我素材采集到剧场选择，再到星图结果显形的完整体验。

### 当前体验关键词

- 沉浸式
- 移动端优先
- 单焦点
- 生成式 UI
- 深邃宇宙感
- 黑洞 / 星云 / 银白 / 暗紫 / 金色点亮
- 原生 iPhone App 手感

---

## 3. 当前产品范围

### 主流程页面

| 页面 | 路径 | 当前定位 | 当前状态 |
|---|---|---|---|
| 采集页 | `/collect` | Part 1，用户回答题目并上传素材 | 已存在，已多轮沉浸化，但仍需按新宇宙生成式 UI 继续重构 |
| 处理页 | `/processing/benyuan` | 显影等待、恢复、跳转承接 | 已存在，目标是单中心等待态 |
| 剧场页 | `/theater` | Part 2，沉浸场景与选择 | 已存在，目标是一幕一屏 |
| 星图页 | `/constellation` | Part 3，结果呈现 | 已存在，目标是短结果流 |

### 内部/调试页面

| 页面 | 路径 | 当前定位 |
|---|---|---|
| Lab 状态页 | `/lab/status` | 内部状态、回归、调试信息 |
| Native Handoff | `/lab/native-handoff` | iOS shell/native bridge 验收 |
| Runtime/Lab 其他页 | `/lab/*` | 内部工具页，不纳入主流程沉浸体验 |

### 明确不在当前上线闭环内

- `/report/[sessionId]` 旧报告体验
- `/lab/kernel`、`/lab/runtime` 等内核工具页
- 纯 SwiftUI 重写
- API contract / schema / storage key 改造

---

## 4. 当前主流程信息架构

### 4.1 `/collect`

用户目标：

- 回答当前题目。
- 根据题型进行单选、多选、文本输入或图片上传。
- 完成 A / B / C 三组采集后进入剧场生成。

当前要求：

- 只保留当前题、输入/选项、进度、前后操作。
- A / B / C 只作为极轻量微切换，不成为大面板。
- 测试包、runtime、debug、provider、demo 不进入主路径。
- 上传题只保留主上传入口、相册/拍照入口、缩略图轨道、最小数量提示。

待优化：

- 当前页面仍需要按「黑洞升空太空」的生成式 UI 重新视觉化。
- 需要进一步减少说明文字和工作台感。

### 4.2 `/processing/benyuan`

用户目标：

- 等待系统从采集结果生成剧场或星图。
- 在失败/恢复时能继续流程。

当前要求：

- 只显示一个中心焦点：阶段名、短句、单条进度。
- 不显示 provider/model/request id/预计时间/工程术语。
- 空态、失败态、处理中态使用同一视觉骨架。

待优化：

- 等待页应更像太空显影仪式，而不是状态面板。

### 4.3 `/theater`

用户目标：

- 进入生成的剧场场景。
- 做出关键选择。
- 完成镜像对话并进入星图。

当前要求：

- 一幕一屏。
- 第一幕只保留场景主句和继续动作。
- 第二幕只保留场景句和单列选项。
- 第三幕只保留问题、极短镜像句和选项。
- 尾声只保留结束语、过渡句、进入星图 CTA。
- 不展示 hover、trait、hesitation、telemetry 等内部采样信息。

待优化：

- 需要继续去掉说明页感，让剧场更像原生沉浸流程。

### 4.4 `/constellation`

用户目标：

- 快速获得自己的精神原型与核心摘要。
- 继续阅读结构、张力、路径等结果。
- 分享、保存或重新探索。

当前要求：

- 首屏只承担：原型名、英文副标题、本质一句、动作区。
- 默认结果流压成三段：本质、结构、此刻。
- 完整结构图、地形、回响、其余张力、其余路径全部折叠。
- 不展示 runtime/mode/platform/生成技术信息。

待优化：

- 结果页需要从“报告感”进一步收成“星图显形”的短阅读流。

---

## 5. UI / 视觉方向当前结论

### 旧方向问题

此前黑金后现代极简方向可作为基础，但用户反馈：

- 纯黑金偏旧。
- 紫色不能塑料感，要更深、更融合。
- 整体需要更深邃、更现代、更生成式。
- 不应被旧 PRD 里的“哲学舞台卡 / 大框架信息”束缚。

### 新方向

「从黑洞升空太空」的生成式宇宙 UI。

### 色彩方向

- 主背景：深黑、黑洞、宇宙暗场。
- 次氛围：深紫、暗蓝紫、星云雾化渐变。
- 高光：银白、月白、冷白、存在金。
- 按钮：不再使用突兀红色；主 CTA 应从红色转向银白金 / 暗金发光 / 深紫金边。

### 版式方向

- 以 iPhone 17 Pro Max 为基准。
- 大字号、粗无衬线。
- 超低 chrome。
- 大圆角、玻璃、柔雾、星云背景。
- 一屏一个主任务。
- 底部单主 CTA。

### 当前实现状态

- Web 端已有多轮沉浸化代码基础。
- iOS 壳已有暗色原生外壳、启动 overlay、错误态、分享、相册/拍照桥接。
- 最新宇宙生成式 UI 尚未完全落地到四个主流程页面。

---

## 6. Web 部署状态

### Railway 项目

- Project：`empathetic-delight`
- Environment：`production`
- Service：`benyuan`
- Railway URL：`https://benyuan-production.up.railway.app`
- Volume：`benyuan-volume`
- Volume mount：`/app/data`

### 已完成

- GitHub 仓库已同步完整部署代码。
- Dockerfile 已修复 Railway 不支持 `VOLUME` 的问题。
- Next server 已修复为监听 `0.0.0.0`。
- Railway 部署曾成功完成。
- iOS project.yml 已写入 Railway URL。

### 当前问题

`https://benyuan-production.up.railway.app` 在当前 Mac 和 iPhone 上均出现访问问题：

- Mac 侧对 `railway.app / up.railway.app` TLS 握手阶段会 reset。
- iPhone 壳层访问 Railway URL 显示「未能找到使用指定主机名的服务器」。

### 当前结论

Railway 容器启动本身不是主要问题；当前更像本地网络/运营商/DNS/域名访问层问题。短期真机测试不应继续依赖该 Railway 默认域名。

### 建议

短期：

- 使用 ngrok / Cloudflare Tunnel / 本地局域网进行开发测试。

中期：

- 绑定自定义域名。
- 优先使用 Cloudflare 托管 DNS + 正式 Tunnel 或稳定 Web hosting。

---

## 7. iOS Shell 状态

### 架构

- SwiftUI App
- WKWebView 承载 Web 主流程
- Native bridge 支持：
  - `share`
  - `openExternal`
  - `pickImages`

### iOS 项目路径

`mobile/benyuan_origin_ios_shell`

### Bundle

- Bundle ID：`com.fanhao.benyuan.origin.shell`
- Display Name：`本源`
- Version：`0.2.0`
- Build：`2`

### 已完成

- AppIcon 存在。
- Camera / Photo Library 权限文案存在。
- Staging / Production URL 已指向 Railway URL。
- 可生成 Development signed archive。
- 可导出 Development IPA。
- 可安装到 iPhone 17 Pro Max。
- 用户已在手机上信任开发者证书。

### 最新 iOS 代码改动

已加入或调整：

- 显式 `Info.plist`
- `NSAppTransportSecurity`
  - `NSAllowsArbitraryLoads = true`
  - `NSAllowsLocalNetworking = true`
- `NSLocalNetworkUsageDescription`
- WKWebView 初始请求加入 `ngrok-skip-browser-warning` header

注意：

- `ngrok-skip-browser-warning` header 已写入源码，但在用户切换到测试另一个项目前，尚未完成重新归档、重装和验证。

### 当前真机测试状态

已验证：

- 真机连接成功。
- Development 包安装成功。
- 信任开发者后 App 可启动。
- 使用 launch arguments 可让壳层尝试访问指定 base URL。
- 壳层日志确认可读取 `--benyuan-base-url` 与 `--benyuan-route`。

未完成：

- 未最终确认手机端完整加载 `/collect` UI。
- 原因是当前手机优先用于另一个项目测试，本源真机测试已暂停。

---

## 8. TestFlight / 发布状态

### 当前不能 TestFlight 的原因

当前 Apple ID 无 App Store Connect 发布权限。

用户截图显示：

> 要访问 App Store Connect，你必须是 Apple Developer Program 中的个人或团队成员，或受个人邀请访问其 App Store Connect 内容。

### 当前签名状态

已生成的是 Development signed archive：

- Signing identity：`Apple Development`
- Profile：development profile
- 有 `ProvisionedDevices`
- 没有 `beta-reports-active`

因此：

- 可真机开发测试。
- 不可上传 TestFlight。

### 当前 Team 信息

真实 Development Team ID：

`CY3DD3J5CU`

注意：

证书显示括号中的 `C732AJFWK7` 不是用于 `DEVELOPMENT_TEAM` 的值；真正应使用 profile 的 `TeamIdentifier = CY3DD3J5CU`。

### TestFlight 还需要

- Apple Developer Program / App Store Connect provider 权限。
- Apple Distribution 证书。
- App Store Connect provisioning profile。
- 可导出 `app-store-connect` method 的 IPA。
- App Store Connect 上创建 App 记录并上传构建。

---

## 9. 当前本地开发 / 测试工具状态

### 可用脚本

| 命令 | 用途 |
|---|---|
| `npm run build` | Web 构建 |
| `npm run ios:shell:archive` | 生成 iOS archive |
| `npm run ios:shell:export` | 导出 Development IPA |
| `npm run ios:shell:export:testflight` | 尝试导出 TestFlight 包 |
| `npm run ios:shell:testflight:preflight` | 发布前预检 |
| `npm run ios:shell:native-smoke` | Native smoke |
| `npm run ios:shell:regression` | iOS shell 回归 |

### 当前已生成产物

- Development IPA：
  - `output/development-export/BenyuanOriginShell.ipa`
- iOS archive：
  - `output/BenyuanOriginShell.xcarchive`

### 当前调试发现

- 端口 `3201` 当前有另一个 Next 服务，疑似另一个项目占用。
- 本源真机测试已经暂停，以免干扰另一个项目。
- 本源相关 ngrok / cloudflared / localtunnel / 3015 服务已停止。

---

## 10. 当前阻塞项

### P0：手机真机页面未完成最终确认

状态：

- App 可安装、可启动。
- 但 `/collect` 页面在手机上最终加载成功尚未确认。

原因：

- Railway 默认域名不可达。
- 局域网方案受本地服务稳定性/端口冲突影响。
- ngrok 方案已打通到 `3201`，但用户切换到另一个项目测试，未继续验证。

建议：

- 等手机空闲后，重新执行本源真机验证。
- 使用 ngrok 指向稳定运行的本源 Web 服务。
- 确认源码里的 `ngrok-skip-browser-warning` header 已重新打包进手机 App。

### P0：TestFlight 发布权限缺失

状态：

- 无 App Store Connect provider。
- 无 iOS App Store provisioning profile 权限。

建议：

- 自己 Apple Developer Program 申诉/开通完成后继续。
- 或由可信团队账号邀请，不建议租用陌生账号。

### P1：公网入口不稳定

状态：

- Railway 默认域名在当前网络不可用。

建议：

- 绑定自定义域名。
- 或改用 Cloudflare 正式 Tunnel / Pages / Workers / 其他稳定 Web hosting。

### P1：UI 最终方向未完全落地

状态：

- 已有沉浸化基础。
- 最新「黑洞升空太空 / 深紫银白金 / 生成式 UI」方向尚未完整实现。

建议：

- 下一轮以设计稿为准重构四个主流程页面。

---

## 11. 下一步执行建议

### 11.1 如果目标是今天继续真机测试

1. 暂停另一个项目对真机和端口的占用。
2. 启动本源 Web 服务到固定端口，例如 `3015`。
3. 启动 ngrok 指向本源端口。
4. 重新归档/安装包含最新 WKWebView header 的 iOS 包。
5. 使用 launch args：

```bash
xcrun devicectl device process launch \
  --device D9E6E103-375A-559D-84D7-2ADCAC0CF98C \
  --terminate-existing \
  --activate \
  com.fanhao.benyuan.origin.shell \
  --benyuan-environment development \
  --benyuan-base-url "<ngrok-url>" \
  --benyuan-route /collect \
  --benyuan-debug-ui 1
```

6. 手机确认 `/collect` 是否加载。

### 11.2 如果目标是上线 TestFlight

1. 先解决 Apple Developer Program / App Store Connect 权限。
2. 获取 Apple Distribution 能力。
3. 重新导出：

```bash
npm run ios:shell:export:testflight
```

4. 上传 App Store Connect。
5. 完成内部 TestFlight 安装验证。

### 11.3 如果目标是继续做 UI

1. 锁定 iPhone 17 Pro Max 设计基准。
2. 用最新宇宙生成式 PRD 重新设计四页：
   - `/collect`
   - `/processing/benyuan`
   - `/theater`
   - `/constellation`
3. 先出 Figma / image2 高保真方向图。
4. 再转 Next.js 前端实现。
5. 最后装入 iOS shell 真机验收。

---

## 12. 当前验收标准

### 真机开发测试验收

- iPhone 可安装本源 App。
- 信任开发者后可启动。
- 进入 `/collect` 不出现「不能正常加载」。
- 上传/拍照/相册权限弹窗正常。
- `processing -> theater -> constellation` 主链路可连续跑通。
- 分享、外链、后台恢复无阻断。

### TestFlight 验收

- `npm run ios:shell:testflight:preflight` 无 blockers。
- archive 使用 Apple Distribution 签名。
- embedded profile 有 `beta-reports-active`。
- `npm run ios:shell:export:testflight` 成功。
- App Store Connect 能看到构建。
- 至少一台内部测试设备安装成功。

### UI 验收

- 主流程不出现开发感信息。
- 每屏只有一个主焦点。
- 视觉符合深邃宇宙生成式方向。
- 按钮、进度、输入、选项都有原生 iOS 手感。
- 结果页不再像报告，而像星图显形。

---

## 13. 结论

本源当前已经从「概念与 Web 原型」推进到「可安装 iOS 开发包 + 可启动原生壳 + 可继续真机调试」阶段。

下一步不应该继续分散处理所有问题，而应按目标拆成三条线：

1. **真机测试线**：解决稳定 Web 入口，完成 `/collect` 加载与全链路跑通。
2. **上线发布线**：解决 Apple Developer / App Store Connect 权限。
3. **体验设计线**：按新的深邃宇宙生成式 UI 方向重构主流程四页。

当前最现实的短期动作是：等手机从另一个项目测试释放后，继续本源真机验证，并优先使用稳定 HTTPS 隧道而不是 Railway 默认域名。
