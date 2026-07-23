# 本源 iOS TestFlight Runbook

本源 iOS 当前以原生 SwiftUI 承载登录、采集、剧场、星图和账户主流程；WebView 仅保留开发调试用途。Bundle ID：

`com.fanhao.benyuan.origin.shell`

## 当前工程位置

- 项目根目录: `/Users/fanhao/Documents/Playground-benyuan`
- iOS shell: `mobile/benyuan_origin_ios_shell`
- XcodeGen 配置: `mobile/benyuan_origin_ios_shell/project.yml`
- 原生 bridge: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeBridge.swift`
- App Icon: `mobile/benyuan_origin_ios_shell/Assets.xcassets/AppIcon.appiconset`
- 当前版本: `0.2.1 (21)`

## 本地构建

```bash
npm run ios:shell:build
```

这个命令用于确认 SwiftUI 壳能在模拟器构建。它不代表 TestFlight ready。

## TestFlight 预检

```bash
npm run ios:shell:testflight:preflight
```

预检会检查 Bundle ID、版本号、图标、构建产物、原生 smoke、Archive、签名状态，以及四类产物是否来自同一份干净源码且在 24 小时内按顺序生成。如果源码未提交、产物过期或缺少 provenance，它会失败，这是发版前应该保留的红灯。

## Archive

开发者账号和签名准备好后：

```bash
BENYUAN_IOS_DEVELOPMENT_TEAM=<Apple Team ID> npm run ios:shell:archive
```

没有签名时只允许内部验证 unsigned archive，不要把 unsigned archive 当成可上传包。

## Export

准备上传 TestFlight 时：

```bash
BENYUAN_IOS_DEVELOPMENT_TEAM=<Apple Team ID> BENYUAN_IOS_EXPORT_METHOD=app-store-connect npm run ios:shell:export
```

生成的 ipa 路径会写入 `output/benyuan-ios-shell-export.json`。

## Upload

本机 Xcode 账号已具备发布权限时，可直接上传当前 archive：

```bash
BENYUAN_IOS_DEVELOPMENT_TEAM=<Apple Team ID> npm run ios:shell:upload
```

上传脚本会先强制执行 TestFlight 预检；预检失败时不会开始上传。上传结果会写入 `output/benyuan-ios-shell-upload.json`。看到 `Uploaded BenyuanOriginShell` 后，进入 App Store Connect 等待 Apple 处理 build。

## App Store Connect 手动项

- 创建 App，Bundle ID 使用 `com.fanhao.benyuan.origin.shell`
- 填写 App 名称、分类、隐私说明、支持 URL
- 添加内部测试者邮箱
- 上传 ipa 后等 Apple 处理 build
- 安装 TestFlight 后做真机 smoke

## 真机 smoke 必测

- 冷启动进入本源首页
- `/collect` 上传或选择内容
- 相册选择
- 相机拍摄
- `/processing/benyuan` 等待
- `/theater` 完成选择
- `/constellation` 查看结果
- 分享
- 保存
- 重新探索
- 后台切回恢复
- 断网/弱网提示
