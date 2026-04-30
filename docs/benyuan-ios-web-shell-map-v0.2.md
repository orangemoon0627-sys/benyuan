# 本源 Web → iOS Shell 映射图 v0.2

更新时间：2026-03-11
目标：把当前已经稳定的 Web beta 链路，转换成一份 iOS shell 视角下可直接执行的页面映射与职责拆分说明。

---

## 1. 当前迁移原则

当前阶段不是“把 Web 重写成原生”，而是：
- 先用 iOS shell 稳定承接当前 Web 主链路
- 保持 API contract、session key、benchmark pack 不变
- 只把系统能力和外层体验放到原生层

因此现阶段优先级是：
- Web 继续拥有业务逻辑和主数据流
- Native 负责容器、权限、分享、恢复、外部打开和系统能力桥接

---

## 2. 页面映射

| Web 路由 | 当前角色 | iOS shell 对应层 | 当前建议 |
| --- | --- | --- | --- |
| `/` | 入口与品牌启幕 | `BenyuanShellRootView` + WebView 首屏 | 保持 Web 页面渲染，Native 只接启动与 loading |
| `/collect` | Part 1 采集主入口 | WebView 主屏 + 原生图片桥 | 继续用 Web；相册/拍照从 Native bridge 接入 |
| `/processing/benyuan` | 慢任务等待页 | WebView 主屏 + Native loading overlay | 先保留 Web，必要时叠加 Native loading / offline |
| `/theater` | Part 2 剧场体验 | WebView 主屏 | 先维持 Web，保留沉浸和记录逻辑一致性 |
| `/constellation` | Part 3 星图结果页 | WebView 主屏 + Native share/openExternal | 分享、外部打开走原生桥；结果结构仍由 Web 驱动 |
| `/lab/status` | 内部稳定性面板 | Web 调试页 | 研发用，后续可做 native debug 面板镜像 |
| `/lab/native-handoff/smoke` | 壳级链路验收 | Native smoke 专用入口 | 保留给模拟器 / 真机验收 |

---

## 3. 状态与恢复映射

### 3.1 Web 持有的关键状态

这些状态现在已经稳定，不建议在 iOS phase 1 重命名：
- `benyuan-v3-part1-answers`
- `benyuan-v3-runtime-override`
- `benyuan-v3-last-session`
- `benyuan-v3-part1-started-at`
- `benyuan-v3-pending-part1`
- `benyuan-v3-pending-part2`

### 3.2 Native 持有的关键状态

Native 当前应持有：
- 当前 WebView URL
- 是否正在 loading
- 网络是否在线
- 最近一次 route recovery URL
- share sheet 状态
- native picker request / response 生命周期

### 3.3 Route Recovery 规则

当前 `BenyuanRouteRecovery.swift` 应只恢复这些 in-flow 路由：
- `/`
- `/collect`
- `/processing/benyuan`
- `/theater`
- `/constellation`
- `/lab/native-handoff`

如果以后新增原生 screen，不应直接破坏这条恢复规则；而应增加一层 native route → web route 映射。

---

## 4. 职责拆分

### 4.1 Web 持续负责

- Part 1 表单结构、题目与素材上传入口
- Part 1 / Part 2 / Part 3 API 调用
- 导演 Agent / 分析师 Agent 请求与 fallback 逻辑
- benchmark、status panel、constellation rendering
- A / B / C test pack 与 demo link 管理

### 4.2 Native 当前负责

- WebView 容器
- 冷启动 loading
- offline banner
- open external
- share sheet
- photo library / camera bridge
- route recovery

### 4.3 暂时不要原生化的层

以下层在当前 beta 不建议立刻拆成原生：
- Part 1 问题逻辑与验证
- processing 的 API 轮询机制
- theater 的选择记录结构
- constellation 的报告 schema

原因：这些层已经和 benchmark、demo route、状态面板绑定，先拆会失去对照基线。

---

## 5. 当前可复用层

### 5.1 可直接复用到 iOS shell 的现有文件

- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellApp.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellRootView.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanWebContainerView.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeBridge.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanRouteRecovery.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellState.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNetworkMonitor.swift`
- `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShareSheet.swift`
- `mobile/benyuan_origin_ios_shell/BenyuanDesignTokens.swift`

### 5.2 Web 侧已经为 iOS shell 准备好的能力

- `pickImagesWithBenyuanNativeShell(...)`
- `shareWithBenyuanNativeShell(...)`
- `openWithBenyuanNativeShell(...)`
- `/lab/native-handoff/smoke`
- `/lab/status`

---

## 6. 当前最适合的原生化顺序

### Phase 1：壳层稳定
- 目标：把当前 Web beta 放进稳定 shell
- 保持所有主路由仍由 Web 渲染
- 用最新 A / B / C demo route 做入口和回归

### Phase 1.5：系统能力补齐
- 原生拍照
- 原生相册
- 原生分享
- 外部浏览器打开
- 网络状态提示

### Phase 2：局部原生 chrome
- 顶层 loading / offline / retry 做得更像原生
- 首页启幕、分享确认、结果操作条可逐步原生化
- 但 Web 主页面仍保留

### Phase 3：选择性原生页面
- 如果要继续原生化，优先考虑：
  - landing / loading
  - constellation 顶部摘要区
  - share sheet / export entry
- 最后才考虑彻底重写 collect / theater 主流程

---

## 7. 与当前 freeze 对齐的 demo route

| Pack | Theater | Constellation |
| --- | --- | --- |
| A | `/theater?part1_id=part1_i2ffoggu&theater_script_id=theater_c8wkeirl` | `/constellation?constellation_id=const_9pfnj81l` |
| B | `/theater?part1_id=part1_h9zwr2ii&theater_script_id=theater_f86ga7vv` | `/constellation?constellation_id=const_332xc7ue` |
| C | `/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m` | `/constellation?constellation_id=const_an86s1af` |

这些路径应视为当前 iOS shell demo / smoke 的默认基线。

---

## 8. 下一步建议

1. 所有 iOS shell smoke 与 README 默认改为使用本次 freeze 的 demo route
2. 后续每次大改 UI 后，优先回归 `/collect`、`/theater`、`/constellation` 和 `/lab/status`
3. 真机验证继续沿用 `pickImages -> /api/part1/upload -> store` 这条单入口，不要分叉第二条素材入库路径
4. 真要拆原生页面时，先保持 Web contract 完整不动，再做薄层替换
