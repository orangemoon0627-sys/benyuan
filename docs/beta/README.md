# 本源 Beta 测试包 v0.1

本目录用于把本源从“页面开发完成”推进到“小范围产品测试”。目标不是一次性发布正式版，而是让 3-5 位测试者能稳定跑完整条链路，并把反馈回收到同一套表格里。

## 当前测试入口

- Web staging: http://120.26.126.88
- 主入口: http://120.26.126.88/collect
- 当前 iOS 形态: SwiftUI + WKWebView 原生壳，Bundle ID 为 `com.fanhao.benyuan.origin.shell`

## 测试前工程闸门

每次发测试链接前，先在 `/Users/fanhao/Documents/Playground-benyuan` 跑：

```bash
npm run test:product:gate
BENYUAN_BASE_URL=http://120.26.126.88 BENYUAN_PACKS=A,B,C npm run test:product:gate
npm run ios:shell:build
```

如果要准备 TestFlight，再继续跑：

```bash
npm run ios:shell:testflight:preflight
npm run ios:shell:archive
npm run ios:shell:export
```

其中 `ios:shell:testflight:preflight` 在签名、Archive 或真机烟测缺失时会失败，这是正常阻塞信号。

## 目录说明

- `tester-guide.md`: 发给测试者的操作说明
- `feedback-form-fields.md`: 反馈表字段设计
- `release-checklist.md`: 每次发测试版前的工程检查
- `known-issues.md`: 当前已知限制
- `ios-testflight-runbook.md`: iOS TestFlight 准备流程

## 当前阶段判断

本源现在适合 Web staging 小范围测试。iOS 侧已经能构建原生壳，但 TestFlight 前还需要完成签名、Archive、Export 和真机烟测。
