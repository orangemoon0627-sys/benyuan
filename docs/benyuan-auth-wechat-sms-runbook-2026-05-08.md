# 本源微信登录与阿里云短信上线 Runbook

## 目标

本源 iOS 原生主流程使用 Apple / 微信 / 手机号 / 访客四种身份入口。客户端只保存本源 session token；微信 AppSecret、阿里云短信 AccessKeySecret、短信模板等都只放在 staging 服务器私有环境变量里。

## 当前代码状态

- 后端已提供 `/api/auth/wechat`、`/api/auth/phone/request-code`、`/api/auth/phone/verify-code`、`/api/auth/providers`。
- 阿里云短信 sender 已接入服务端，使用 `ACS3-HMAC-SHA256` 签名请求 `SendSms`。
- iOS 已加入微信回调配置位、URL Scheme、Associated Domains、原生 auth client 和 `onOpenURL` / Universal Link 回调入口。
- 默认 iOS build 不主动拉取 WeChat OpenSDK，避免每次本地构建被 GitHub 网络拖住；真实微信包接入时再显式启用 SDK。

## 阿里云短信需要准备

- 短信服务开通完成。
- 国内短信签名审核通过，例如：`本源`。
- 登录验证码模板审核通过，模板变量使用 `${code}`。
- 服务器侧 AccessKey，建议使用只允许短信发送的 RAM 子账号。

staging 环境变量：

```bash
BENYUAN_SMS_PROVIDER=aliyun
BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID=...
BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET=...
BENYUAN_ALIYUN_SMS_SIGN_NAME=...
BENYUAN_ALIYUN_SMS_TEMPLATE_CODE=...
BENYUAN_AUTH_PHONE_SECRET=...
```

推荐写入方式：

```bash
cd /Users/fanhao/Documents/Playground-benyuan
bash scripts/configure-staging-auth.sh
```

脚本会隐藏输入 secret，更新服务器私有文件：

```text
/opt/apps/benyuan-staging/shared/benyuan-runtime.env
```

并用 `pm2 restart benyuan-staging --update-env` 刷新环境。

本地 mock 验证：

```bash
BENYUAN_BASE_URL=http://127.0.0.1:3026 \
BENYUAN_SMS_PROVIDER=aliyun \
BENYUAN_ALIYUN_SMS_MOCK_PORT=3038 \
npm run smoke:auth:sms-aliyun
```

staging 真实验证：

```bash
BENYUAN_BASE_URL=http://120.26.126.88 npm run smoke:auth:runtime
```

真实短信模式不会返回 `fixture_code`。如果响应 `sms_provider_not_configured`，说明服务器 env 未生效或 PM2 没有 `--update-env` 重启。

## 微信开放平台需要准备

微信开放平台移动应用中填写：

- iOS Bundle ID：`com.fanhao.benyuan.origin.shell`
- Universal Link：使用已备案并可 HTTPS 访问的域名，例如 `https://app.orangemoonai.cn/app/benyuan/`
- iOS URL Scheme：微信 AppID，例如 `wx...`
- 服务端 AppID / AppSecret：只写到 staging env，不进客户端仓库。

服务器环境变量：

```bash
BENYUAN_WECHAT_APP_ID=wx...
BENYUAN_WECHAT_APP_SECRET=...
```

这两个值同样通过 `scripts/configure-staging-auth.sh` 写入服务器，不写入 Git。

iOS Release/Staging build setting：

```text
BENYUAN_WECHAT_APP_ID = wx...
BENYUAN_WECHAT_UNIVERSAL_LINK = https://app.orangemoonai.cn/app/benyuan/
BENYUAN_WECHAT_ASSOCIATED_DOMAIN = applinks:app.orangemoonai.cn
```

域名根路径需要放 Apple Associated Domains 文件：

```text
https://app.orangemoonai.cn/.well-known/apple-app-site-association
```

最小内容示例：

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["<TEAM_ID>.com.fanhao.benyuan.origin.shell"],
        "components": [
          { "/": "/app/benyuan/*", "comment": "本源微信登录回跳" }
        ]
      }
    ]
  }
}
```

## 真机微信 SDK 接入开关

当前工程已预留：

- `BenyuanOriginShell-Bridging-Header.h`
- `BenyuanWechatAuthClient.swift`
- `Info.plist` 的 `CFBundleURLTypes` / `LSApplicationQueriesSchemes`
- `BenyuanOriginShell.entitlements` 的 Associated Domains

接入真实 SDK 时，在 Xcode 或 XcodeGen 加入 `WechatOpenSDK` Swift Package：

```text
https://github.com/yanyin1986/WechatOpenSDK.git
```

然后给 iOS target 增加 Swift 编译条件：

```text
BENYUAN_WECHAT_OPENSDK
```

加完后跑：

```bash
npm run ios:shell:build
xcodebuild -project mobile/benyuan_origin_ios_shell/BenyuanOriginShell.xcodeproj \
  -scheme BenyuanOriginShell \
  -configuration Debug \
  -destination 'platform=iOS,name=<你的真机名称>' \
  test
```

## 发布前检查

```bash
npm run smoke:auth:contract
npm run smoke:auth:runtime
npm run smoke:runtime:client-config
npm run lint
npm run build
npm run ios:shell:build
```

TestFlight 前再跑：

```bash
npm run ios:shell:testflight:preflight
npm run ios:shell:archive
npm run ios:shell:export
```

## 注意事项

- 微信 AppSecret 和阿里云 AccessKeySecret 不进入 Git、不进入 iOS、不进入网页 bundle。
- 低配 ECS 不跑 `next build`，继续使用本地或 GitHub runner 预构建 artifact。
- ICP / HTTPS / Universal Link 没完成前，微信真机登录只能停在客户端发起前或 SDK 回调失败状态。
