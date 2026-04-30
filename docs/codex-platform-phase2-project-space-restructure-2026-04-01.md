# Codex Platform Phase 2 · Project Space 重整规划

日期：2026-04-01

## 目标

在一期已经完成 `Codex-first Web control plane + local companion/runtime` 基础上，二期的目标不是继续给 Benyuan 专用工作台打补丁，而是把：

- 本源 / Benyuan
- 达尔文 / TradeWise
- 胚胎 / Embryo

统一纳入 `ProjectSpace` 框架，并把平台级能力与项目级能力彻底分层。

## 已落地的二期起点

当前仓库已经有以下基础，可以作为二期的真实起跑线：

1. `src/lib/codex-platform/project-manifests.ts`
   - 为 `codex / benyuan / tradewise / embryo` 定义了 `workbenches`、`boundaries`、`nextMilestones`
   - 明确区分 `platform` 与 `project` ownership
2. `src/lib/codex-platform/bootstrap.ts`
   - 会把 `projectManifests` 连同 sessions / tools / agents / permissions / runtime events 一起送到 Web 主控台
3. `/codex` 与 `/workspace/[spaceId]`
   - 已能按空间展示 focus workspace、工作台入口、边界和下一步推进项
4. companion / permission / runtime stream
   - 已能承接 shell.exec 审批闭环与运行时事件流

## 二期分层原则

### 平台层 Platform-Owned

这些能力以后不允许再写死 Benyuan 或 TradeWise 术语：

- Session / Agent / Tool Runtime
- Permission / Approval Loop
- Memory / Skills / Bootstrap
- Plugin / MCP Registry
- Unified Delivery / Release Chain
- Workspace Navigation / Shell / Health Panels

平台层的代码落点：

- `src/lib/codex-platform/*`
- `src/app/api/internal/codex/*`
- `/codex`
- `/workspace/*`

### 项目层 Project-Owned

这些必须留在各项目空间自己的 manifest 和模块里：

- Benyuan
  - assessment schema
  - theater / constellation prompts
  - native handoff artifacts
- TradeWise
  - review contract / prompt / provider logic
  - research feed schema / provider logic
  - mobile delivery cadence
- Embryo
  - future schema / prompt / delivery definition

项目层后续落点：

- `src/lib/benyuan-*`
- `src/features/assessment/*`
- `src/lib/tradewise/*`
- 未来 `src/lib/embryo/*`

## 二期执行顺序

### Phase 2A · Benyuan 拆壳

目标：把现在散落在 `/lab/*`、`/agent/*`、`native-handoff` 里的内部能力，变成 `workspace/benyuan` 下真正的项目空间工作台。

动作：

- 先保留旧路由
- 增加 `workspace/benyuan/*` 新入口
- 用 adapter 将旧页面与新 workspace 绑定
- 最后逐步把页面内容迁到 workspace 内页

验收：

- `/collect -> /processing/benyuan -> /theater -> /constellation` 不断
- `/workspace/benyuan` 能看到 schema / runtime / agent / native / delivery 全部工作台入口

### Phase 2B · TradeWise 独立空间化

目标：不再把 TradeWise 当“共用 lab 里的一个 API 子树”，而是成为真正的独立项目空间。

动作：

- 新建 `workspace/tradewise` 下的 review / research / handoff / delivery 页面
- 将现有 `review-contract` / `research-contract` / provider 接进统一 runtime、permission、delivery
- 从共用 lab 面板中逐步淡出 TradeWise 专属说明

验收：

- `workspace/tradewise` 可直接浏览 review / research / mobile handoff 的项目事实来源
- 平台层不出现 Benyuan 术语硬编码

### Phase 2C · Embryo 作为新项目模板

目标：让 Embryo 成为第一个“从一开始就按 ProjectSpace 接入”的项目，而不是再复制旧模式。

动作：

- 用 `project manifest` 注册新空间
- 先定义 schema / prompt / delivery ownership
- 最后才补页面和产品链路

验收：

- 新项目接入时无需复制 `/lab/*` 体系
- 只需补 manifest、contracts、workspace 页面即可进入平台

## 代码改造准则

### 1. 先加 manifest，不先散落页面

任何新项目功能先回答：

- 属于哪个 `ProjectSpace`
- 属于哪个 `boundary`
- 是 `platform-owned` 还是 `project-owned`

若这三个问题答不上来，不允许直接加页面或 API。

### 2. 旧路由只做兼容壳

二期不要求立即删掉：

- `/lab/*`
- `/agent/*`
- `/lab/native-handoff`

但要求这些路由后续只承担：

- 兼容入口
- 回退入口
- 老链接承接

而不是继续作为新功能主入口。

### 3. 平台 API 不带项目术语

`/api/internal/codex/*` 中：

- 不写死 `benyuan`
- 不写死 `tradewise`
- 不直接依赖项目私有 schema

项目私有逻辑通过：

- project manifest
- adapters
- project-owned contracts

接入平台。

## 下一轮推荐施工单

1. 新建 `workspace/benyuan/schema`、`workspace/benyuan/runtime`、`workspace/benyuan/agents`、`workspace/benyuan/native`
2. 新建 `workspace/tradewise/review`、`workspace/tradewise/research`、`workspace/tradewise/handoff`
3. 将共用 lab 页面改为 “legacy / compatibility” 标签
4. 把 delivery / release / golden / audit 从 Benyuan 视角抽到真正的 platform 视角

## 当前结论

二期现在不是“从零重新想”，而是已经具备了真实落点：

- 代码分层起点：`project-manifests.ts`
- 运行时起点：`runtime-service.ts` + companion approval loop
- UI 起点：`/codex` + `/workspace/[spaceId]`

后续只要坚持“manifest 先行、adapter 过渡、平台与项目 ownership 分离”，就能把本源、达尔文、胚胎真正收编到同一套 Codex 平台框架里。
