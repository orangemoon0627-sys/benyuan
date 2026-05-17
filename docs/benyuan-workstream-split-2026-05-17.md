# 本源工作流分区与 Web 会话交接

## 目标

把当前本源开发拆成清晰的并行工作区，避免 iOS 登录排障、TestFlight 发布、Web 官网重做、服务器运维互相污染。

## 会话分区

### 1. iOS / TestFlight 会话

只处理：

- 原生 iOS App
- Apple 登录、微信登录、手机号登录
- TestFlight 打包、上传、真机回归
- 星图页、剧场页、首页等原生 SwiftUI 体验
- iOS 侧 API baseURL / fallback / 日志排障

不处理：

- Web 官网视觉重做
- `/about`、`/test`、官网交互页
- Web 端营销文案与官网游戏流程

当前重点：

- Apple 登录失败已定位为 Apple 授权后提交服务器阶段的网络/fallback 问题。
- Release 主线路应为 `https://staging-benyuan.orangemoonai.cn`。
- Release 备用线路应为 `http://120.26.126.88`。
- 需要重新打新 Build 上传 TestFlight，旧包不会自动获得 fallback 修复。

### 2. Web 官网 / 测试游戏会话

只处理：

- 本源 Web 官网
- `/`、`/about`、`/test`、`/collect` 等 Web 页面
- 官网版测试游戏流程
- 宇宙穿梭、纵向闯关、账户入口、下载入口
- Web 视觉风格、动效、响应式、浏览器验证

不处理：

- iOS SwiftUI 文件
- TestFlight 打包上传
- 原生 Apple 登录排障
- 服务器数据清理和用户账号问题

设计方向：

- 参考 `https://apechain.com/` 的自由版式、纵向推进、空间感和动效节奏。
- 保留本源自己的视觉语言：深黑、月、黑洞、星体、暗金、银白、精神星图。
- 不沿用老 `/about` 内容；Web 端可以重新开始。
- Web 测试流程应尽量对齐 App 当前核心流程：信息收集 → 剧场四轮选择 → 星图结果。
- 不需要和 App UI 一比一复刻，Web 可以更自由、更像官网级互动体验。

### 3. Server / 数据 / 运维会话

只处理：

- staging 服务器
- nginx / TLS / 域名 / ICP
- beta/public 数据隔离
- 用户数据清理
- 登录 API、短信、微信服务端配置
- PM2、部署、日志排障

不处理：

- iOS UI
- Web 视觉页
- 文案体验重写

## Git 与交付规则

- iOS 修复和 Web 官网重做不要混成一个 commit。
- Web 会话可以基于当前已有 Web 改动继续，但提交时只 stage Web 相关文件。
- iOS 会话提交时只 stage `mobile/benyuan_origin_ios_shell/**`、相关 iOS smoke scripts、必要 docs。
- 上传 TestFlight 前先确认当前 archive 是新构建，不能复用旧 `output/BenyuanOriginShell.xcarchive`。

## Web 新会话提示词

复制下面这段到新会话即可：

```text
我们现在单独开一个本源 Web 官网会话。请只处理 `/Users/fanhao/Documents/Playground-benyuan` 里的 Web 端，不要碰 iOS SwiftUI、TestFlight、服务器数据清理。

当前目标：基于本源现在 iOS App 的完成度，重做 Web 官网和 Web 版测试游戏。旧 `/about` 页面内容可以全部删掉，Web 端相当于重新开始做。

设计参考：
- 版式、页面推进、自由度、空间感参考 https://apechain.com/
- 也可以参考之前提到的 Montblanc The Run 那种纵向推进/闯关式互动，但不要照抄品牌或视觉元素
- 本源自己的风格保持：深黑宇宙、月、黑洞、星体、暗金、银白、精神星图、克制神秘感
- 不要做普通 SaaS 官网，不要卡片堆叠，不要老式 about 页面
- 页面要像一个可以进入测试的互动官网：从首页直接进入纵向测试游戏

功能目标：
1. 首页就是强视觉入口，不要老内容。
2. 右上角保留账户/登录注册/软件下载入口。
3. Web 测试流程尽量和 App 当前核心流程一致：
   - 信息收集
   - 剧场四轮题，每轮 4 个选项
   - 生成精神星图结果
4. 测试游戏采用纵向推进，一题一题往前走，有在宇宙中穿梭的感觉。
5. 视觉上可以比 App 更自由，但精神分析、星图、标签体系不能乱改。
6. 如果需要保留数据接口，优先复用现有 API；如果只是官网交互原型，也要把后续接真实 API 的结构留好。

工程要求：
- 先快速检查当前 Web 文件结构和已有改动。
- 不要回滚 iOS 或服务器相关改动。
- 实现后运行 lint/build。
- 用浏览器打开 `http://localhost:3000` 和关键页面截图验证。
- 如果 dev server 样式缓存异常，清理 `.next` 后重启。

请先给出你对 Web 端重做的页面结构和实现切分，然后直接开始实现。
```

