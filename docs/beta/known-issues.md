# 本源 Beta 已知问题

这份清单用于发测试前同步预期，避免测试者把阶段性限制误解成正式缺陷。

## 当前限制

- 本源 staging 当前默认保持 stub/fallback runtime，不开启真实 LLM live 模式。
- Web staging 当前使用 IP 地址 `http://120.26.126.88`，正式域名需要等 ICP 和域名配置稳定后再切换。
- 固定 demo constellation id 不一定存在于 staging 的持久数据里；公网视觉 QA 应通过 A/B/C benchmark 现场生成新结果。
- iOS 当前是 SwiftUI + WKWebView 原生壳，不是全量 SwiftUI 原生页面重写。
- iOS 相机真机体验需要真实设备验收，模拟器只做 fixture-backed smoke。
- TestFlight 前仍需要签名、Archive、Export 和 App Store Connect 配置。

## 测试者可能遇到的情况

- 某些生成阶段会等待数秒，这是当前 stub 链路的正常表现。
- 如果刷新结果页后数据不存在，请重新从 `/collect` 完成一次流程。
- 分享能力依赖浏览器或 iOS shell 环境；Web 浏览器不支持系统分享时，请重点测试保存。
- 结果内容是理解性镜像，不作为医疗或心理诊断。

## 本轮不解决的事项

- 不切换正式 live LLM。
- 不承诺正式域名访问。
- 不做 App Store 外部大规模发布。
- 不把所有 Web 页面重写为全原生 iOS。
