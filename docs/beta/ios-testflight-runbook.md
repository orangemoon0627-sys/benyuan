# 本源 iOS TestFlight Runbook

本源 iOS 当前是原生 SwiftUI 壳承载 Web 主流程，原生能力通过 bridge 接入。Bundle ID：

`com.fanhao.benyuan.origin.shell`

## 当前工程位置

- iOS shell: `mobile/benyuan_origin_ios_shell`
- XcodeGen 配置: `mobile/benyuan_origin_ios_shell/project.yml`
- 原生 bridge: `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeBridge.swift`
- App Icon: `mobile/benyuan_origin_ios_shell/Assets.xcassets/AppIcon.appiconset`

## 本地构建

```bash
npm run ios:shell:build
```

这个命令用于确认 SwiftUI 壳能在模拟器构建。它不代表 TestFlight ready。

## TestFlight 预检

```bash
npm run ios:shell:testflight:preflight
```

预检会检查 Bundle ID、版本号、图标、构建产物、原生 smoke、Archive 和签名状态。如果缺签名或 Archive，它会失败，这是发版前应该保留的红灯。

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
