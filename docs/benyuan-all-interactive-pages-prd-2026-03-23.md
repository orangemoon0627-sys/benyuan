# 本源所有交互页面 PRD

- 文档版本：v1.0
- 更新时间：2026-03-23
- 当前基线：以仓库现状为准，结合已落地的沉浸式主流程改造
- 适用对象：产品、设计、前端、iOS shell、测试、Prompt/Agent 协同
- 文档目的：把本源当前所有交互页面的职责、目标用户、信息结构、状态分支、关键动作、数据依赖、边界和后续设计约束一次性梳理清楚

---

## 1. 文档范围

本文件覆盖当前仓库中与本源直接相关、且具有交互性的页面，按三层划分：

### A. 主产品路径

1. `/`
2. `/collect`
3. `/processing/benyuan`
4. `/theater`
5. `/constellation`

### B. 次级产品路径 / 兼容路径 / 调试入口

6. `/collect/a`
7. `/collect/b`
8. `/collect/c`
9. `/processing/[sessionId]`
10. `/report/[sessionId]`
11. `/legacy`
12. `/test`

### C. 内部工作台 / 协作页面

13. `/lab`
14. `/lab/board`
15. `/lab/content`
16. `/lab/kernel`
17. `/lab/kernel-admin`
18. `/lab/drafts`
19. `/lab/delivery`
20. `/lab/release-chain`
21. `/lab/schema`
22. `/lab/runtime`
23. `/lab/status`
24. `/lab/native-handoff`
25. `/lab/native-handoff/smoke`
26. `/lab/golden`
27. `/lab/golden/audit`
28. `/agent/director`
29. `/agent/analyst`

不在本文重点范围：

- `/about`
- 纯 API 路由
- 非本源主题的通用页面

---

## 2. 产品总定义

### 2.1 本源是什么

本源不是传统心理测试，也不是后台工作台。它是一条被设计过的、从“进入”到“被理解”的连续体验链。

目标链路：

`进入 -> 回答 -> 等待显影 -> 剧场映照 -> 星图结果`

### 2.2 主产品价值

对用户：

- 给出一种更细腻的自我描述语言
- 让用户感到“被理解”，而不是“被分类”
- 通过审美、哲思、叙事三条路径收束成一个人格镜像

对内部团队：

- 建立一套从题库、runtime、Agent 到结果输出可追踪、可调试、可回归的体系
- 支持 Web 主流程与 WKWebView iOS shell 的一致交付

### 2.3 页面分层原则

本源所有交互页面必须明确区分三类：

1. `主用户路径`
   - 面向最终用户
   - 信息极少
   - 不暴露工程细节
2. `调试 / 侧入口`
   - 面向验证和定向回归
   - 可保留部分辅助信息
3. `内部工作台`
   - 面向研发、测试、交付
   - 保留完整工程信息

---

## 3. 当前页面总表

| 路由 | 页面名称 | 层级 | 主要用户 | 当前角色 |
| --- | --- | --- | --- | --- |
| `/` | 入口页 | 主路径 | 终端用户 | 长按进入本源 |
| `/collect` | Part 1 主采集页 | 主路径 | 终端用户 | 单题采集 |
| `/processing/benyuan` | 显影处理中页 | 主路径 | 终端用户 | 过渡等待 |
| `/theater` | 剧场体验页 | 主路径 | 终端用户 | Part 2 互动体验 |
| `/constellation` | 星图结果页 | 主路径 | 终端用户 | Part 3 结果阅读 |
| `/collect/a` | 模块 A 定向页 | 调试 | 产品/测试/研发 | 单模块复核 |
| `/collect/b` | 模块 B 定向页 | 调试 | 产品/测试/研发 | 单模块复核 |
| `/collect/c` | 模块 C 定向页 | 调试 | 产品/测试/研发 | 单模块复核 |
| `/processing/[sessionId]` | 旧分析等待页 | 兼容 | 内部/旧链路 | Session 级分析可视化 |
| `/report/[sessionId]` | 旧报告页 | 兼容 | 内部/旧链路 | 旧版结果阅读 |
| `/legacy` | 旧入口页 | 兼容 | 内部/回看 | 归档体验 |
| `/test` | 通用测试页 | 内部 | 研发/验证 | schema 驱动测试 |
| `/lab` | 实验室总览 | 内部 | 产品/研发/交付 | 内部导航总入口 |
| `/lab/board` | 研发看板 | 内部 | 研发/PM | 草稿与推进总览 |
| `/lab/content` | 内容预览台 | 内部 | 内容/产品/研发 | 题库与差异浏览 |
| `/lab/kernel` | 内核工作台 | 内部 | 研发/Prompt | runtime/prompt/schema 联调 |
| `/lab/kernel-admin` | 内核管理台 | 内部 | 研发/平台 | 配置源与影响矩阵 |
| `/lab/drafts` | 草稿会话库 | 内部 | 研发/内容 | draft 资产管理 |
| `/lab/delivery` | 交付调度台 | 内部 | 研发/发布 | freeze/apply/archive 队列 |
| `/lab/release-chain` | 发布链路台 | 内部 | 研发/发布/PM | 统一发布链可视化 |
| `/lab/schema` | 题库结构面板 | 内部 | 内容/研发 | mode/version/flow 合同 |
| `/lab/runtime` | Runtime 面板 | 内部 | 研发 | provider/runtime 运行态 |
| `/lab/status` | 状态面板 | 内部 | 产品/测试/研发 | beta 当前唯一状态源 |
| `/lab/native-handoff` | 原生交接面板 | 内部 | iOS/测试/前端 | shell handoff 和验收 |
| `/lab/native-handoff/smoke` | 原生 smoke 页 | 内部 | iOS/测试 | 模拟器烟测落点 |
| `/lab/golden` | Golden 面板 | 内部 | QA/研发/产品 | 回归基线与样本面板 |
| `/lab/golden/audit` | Golden 审阅面板 | 内部 | QA/产品 | 基线对照与审阅 |
| `/agent/director` | 剧场导演 Agent 页 | 内部 | Prompt/研发 | prompt + schema 说明 |
| `/agent/analyst` | 精神分析师 Agent 页 | 内部 | Prompt/研发 | prompt + schema 说明 |

---

## 4. 全局产品原则

### 4.1 主流程原则

1. 一屏一焦点
2. 顶部 chrome 最小化
3. 不出现工程信息
4. 不出现 debug 入口常驻露出
5. 底部只保留主动作和必要返回

### 4.2 内部页原则

1. 信息完整比情绪优先
2. 允许展示运行态、基线、草稿、链路信息
3. 设计语言可统一，但不强行沉浸化

### 4.3 合同原则

当前页面层默认：

- 不修改 API 路由
- 不修改 storage keys / session keys
- 不修改 native bridge names
- 页面变更只允许：
  - 重排结构
  - 改文案
  - 隐藏工程信息
  - 统一视觉骨架

---

## 5. 主产品路径 PRD

---

## 5.1 `/` 入口页

### 页面目标

让用户进入状态，而不是阅读产品介绍。

### 目标用户

- 第一次进入本源的用户
- 从外部链接或 shell 打开主流程的用户

### 用户任务

- 感知品牌氛围
- 理解“需要主动开始”
- 通过长按进入探索

### 进入条件

- 用户打开站点根路径

### 退出条件

- 长按完成后跳转 `/collect`

### 当前内容结构

1. 品牌主标题：`本源`
2. 英文副标题：`THE ORIGIN`
3. 长按开始按钮
4. 长按进度线
5. 唤醒粒子动画
6. 跳转引导文案

### 关键状态

1. `idle`
2. `pressing`
3. `awakening`

### 主动作

- 长按开始

### 成功标准

- 用户能无说明完成进入动作
- 不需要菜单和多入口
- 第一屏能建立品牌氛围

### 禁止内容

- 网站导航
- 功能说明长文
- Beta / debug 入口

---

## 5.2 `/collect` Part 1 主采集页

### 页面目标

以单题方式完成 Part 1 的 13 题采集，避免问卷感和工作台感。

### 目标用户

- 已进入主流程的终端用户

### 用户任务

- 回答当前题
- 在不被干扰的情况下完成三模块输入
- 在最后一题后进入剧场

### 输入内容类型

- 单选
- 多选
- 分配题
- 图片上传题

### 当前信息结构

1. 顶部极简壳
   - 返回
   - 细进度
   - A / B / C 微切换
2. 当前题目舞台
   - 题号
   - 模块标记
   - 问题文案
3. 输入区
   - 选项卡 / 分配滑杆 / 上传舞台
4. 错误阻断区
5. 底部操作区
   - 上一题
   - 下一题 / 下一模块 / 进入剧场

### 问题总量

- 总题数：13
- 模块 A：5 题
- 模块 B：5 题
- 模块 C：3 题

### 关键状态

1. `single`
2. `multi`
3. `distribution`
4. `upload`
5. `validation_error`
6. `debug_auxiliary_visible`（仅 `debug=1`）

### 主动作

- 上一题
- 下一题
- 下一模块
- 进入剧场

### 次级动作

上传题中存在：

- 网页选择图片
- 原生相册
- 原生拍照

### 数据依赖

- `benyuanPart1Questions`
- `BenyuanQuestion.kind`
- 本地 session 存储
- 原生图片选择能力

### 成功标准

- 用户始终只面对当前题
- debug 信息不在主路径常驻
- 上传题不再像工具面板
- 完成最后一题后平滑进入 processing

### 当前痛点

- 虽然主结构已收缩，但仍需持续压低顶部和底部辅助感
- 调试模式与主路径必须继续隔离

### PRD 约束

- 保留 `/collect/a|b|c` 作为调试页
- 主路径只保留 `/collect`

---

## 5.3 `/processing/benyuan` 显影处理中页

### 页面目标

承接 Part 1 -> Theater 和 Theater -> Constellation 两段处理中转，给用户一个可感知但不过度解释的等待态。

### 目标用户

- 刚完成采集的用户
- 刚完成剧场的用户

### 用户任务

- 等待后台生成完成
- 需要时执行重试或返回

### 当前 phase

1. `part1`
   - 收束特征
   - 解析线索
   - 构建剧场
   - 剧场已就绪
2. `constellation`
   - 记录选择
   - 精神分析
   - 星图显形

### 当前状态

1. `empty`
2. `running`
3. `error/retry`
4. `route fallback`

### 当前信息结构

1. 返回
2. 顶部细进度
3. 极弱状态眉标
4. 中心标题
5. 一句短说明
6. 单条进度轨
7. 错误时 CTA

### 主动作

- 重试当前阶段
- 回到上一步
- 返回 Part 1 / 前往剧场（空态）

### 数据依赖

- `BENYUAN_PENDING_PART1_KEY`
- `BENYUAN_PENDING_PART2_KEY`
- 本地 checkpoint
- `/api/part1/submit`
- `/api/analyze/multimodal`
- `/api/theater/generate`
- `/api/part2/submit`
- `/api/constellation/generate`

### 成功标准

- 用户只看到一组中心信息
- 不出现 provider/model/runtime 等工程内容
- 空态、处理中、失败态视觉骨架一致

### 当前痛点

- 等待页必须持续避免回退成“状态看板”

---

## 5.4 `/theater` 剧场体验页

### 页面目标

把 Part 1 的输入转成四幕互动体验，让用户在选择中完成第二层映照。

### 目标用户

- 已完成 Part 1 的用户

### 用户任务

- 进入场景
- 完成场景选择
- 完成镜像问题
- 进入尾声
- 提交进入星图

### 当前幕结构

1. `act1`
2. `act2`
3. `act3`
4. `epilogue`

### 当前状态

1. `loading`
2. `no-script`
3. `act1`
4. `act2`
5. `act3`
6. `epilogue`

### 当前信息结构

#### Act 1

- 场景主句
- 可折叠尾段
- 继续按钮

#### Act 2

- 当前场景句
- 单列选项卡

#### Act 3

- 当前问题
- 极短镜像提示
- 单列选项卡

#### Epilogue

- 结束语
- 过渡句
- 进入星图按钮

### 主动作

- 继续
- 选择某个方向
- 回答镜像问题
- 进入星图

### 数据依赖

- `/api/theater/[theaterScriptId]`
- `TheaterScriptRecord`
- 本地 `choiceLogs`
- 本地 `mirrorLogs`
- `BENYUAN_PENDING_PART2_KEY`

### 明确不展示的字段

- `trait_signal`
- `response`
- `visual_prompt`
- `ambient_sound`
- `duration`
- hover sequence
- hesitation patterns

### 成功标准

- 用户不感到自己在填表
- 四幕承接明确
- 内部采样逻辑完全隐藏

### 当前痛点

- 说明感必须持续压缩
- 尾声不能重新长成说明块

---

## 5.5 `/constellation` 星图结果页

### 页面目标

把用户结果呈现成一条短结果流，优先给“原型显形”而不是报告感。

### 目标用户

- 已完成 Part 1 + Theater 的用户

### 用户任务

- 快速理解自己当前原型
- 阅读核心结果
- 决定是否分享、保存、重新探索
- 需要时继续展开完整结果

### 当前结构

1. Hero 首屏
   - archetype 中文名
   - archetype 英文名
   - essence
   - 分享 / 保存 / 重新探索
2. 默认短结果流
   - 本质
   - 结构
   - 此刻
3. 折叠区
   - 更多张力
   - 更多路径
   - 地形
   - 回响
   - 完整结构图

### 当前状态

1. `loading`
2. `empty`
3. `result`
4. `expanded`

### 主动作

- 分享
- 保存
- 重新探索
- 展开全部结果

### 数据依赖

- `/api/constellation/[constellationId]`
- `PsycheConstellation`
- `seven_dimensions`
- `core_tensions`
- `growth_suggestions`
- `recommendations`
- 本地分享与 PNG 导出能力

### 明确不展示的字段

- `generated_at`
- runtime/provider/model
- `constellation_id`
- support tone 内部判断

### 成功标准

- 首屏能独立成立
- 默认阅读不超过“首屏 + 3 段短结果 + 1 个折叠入口”
- 推荐区保留数据能力但不抢主结果

### 当前痛点

- 结果页容易重新长成报告
- 完整内容要保留，但默认显示必须继续克制

---

## 6. 次级路径 / 调试路径 PRD

---

## 6.1 `/collect/a`、`/collect/b`、`/collect/c`

### 页面目标

按模块定向查看采集页，用于调试、回归、录屏和定向 review。

### 目标用户

- 产品
- 设计
- QA
- 前端

### 页面特征

- 复用 `/collect` 主工作流组件
- 限制在单模块内
- 默认带“返回调试入口”链接

### 使用场景

- 单模块视觉打磨
- 某题型回归
- 上传能力单独验证

### 产品约束

- 这些路由不能作为主路径露出
- 只能出现在 lab 或 debug 模式中

---

## 6.2 `/processing/[sessionId]`

### 页面目标

用于旧版 session 分析链路的可视化处理页。

### 目标用户

- 研发
- PM
- 老链路调试人员

### 当前内容

- pipeline stage map
- lifecycle status
- runtime 状态
- provider 增强状态
- 结果跳转

### 页面定位

- 兼容路径
- 不属于本源当前主用户路径

### 产品约束

- 可保留，不纳入新的主流程视觉标准

---

## 6.3 `/report/[sessionId]`

### 页面目标

承载旧链路的报告结果页。

### 目标用户

- 内部复核
- 历史 session 查看

### 页面行为

- 若报告不存在，跳转到 `/processing/[sessionId]`
- 若 session 不存在，404

### 产品定位

- 兼容页，不是当前本源主结果页

---

## 6.4 `/legacy`

### 页面目标

保留历史版本入口，用于回看和兼容验证。

### 目标用户

- 内部团队

### 产品定位

- 归档

---

## 6.5 `/test`

### 页面目标

作为通用 schema 驱动评估测试台。

### 目标用户

- 研发
- 测试
- 内容同学

### 当前内容

- schema 解析
- question rendering
- draft persistence
- native presentation hints

### 产品定位

- 内部验证台
- 非本源主产品页面

---

## 7. 内部工作台 PRD

这一组页面全部属于内部产品，不面向终端用户。它们的主要价值是让团队对“题库、runtime、草稿、交付、iOS shell、golden、发布链”有统一事实来源。

---

## 7.1 `/lab` 实验室总览

### 页面目标

作为所有内部工作台的总导航和状态总览。

### 核心内容

- 题库结构摘要
- 内核配置摘要
- 最近 session 摘要
- 交付状态摘要
- 所有 lab 路由入口

### 主要用户

- PM
- 研发
- 测试
- 交付协同

### 成功标准

- 团队能从这一页进入所有内部面板
- 不再把内部入口塞进主流程

---

## 7.2 `/lab/board` 研发看板

### 页面目标

把草稿工作流、runtime、golden、路由覆盖、交付状态和里程碑放进同一面板。

### 核心内容

- Draft Workflow
- Runtime Snapshot
- Golden Audit
- 当前推进
- 草稿优先队列
- Route Review Completion
- 研发主线

### 主要用户

- PM
- Tech Lead
- 研发协作人

---

## 7.3 `/lab/content` 内容预览台

### 页面目标

作为题库和配置内容的可视化审阅面板。

### 核心内容

- 当前查看上下文
- manifest 概览
- question source 地图
- mode/version 差异
- patch blueprint
- 预保存校验
- 只读 editor

### 主要用户

- 内容设计
- PM
- 前端 / schema 研发

---

## 7.4 `/lab/kernel` 内核工作台

### 页面目标

承载 runtime 组合、prompt/schema 对照、session 生命周期和内核预览矩阵。

### 核心内容

- Runtime 组合沙盒
- selected preview
- runtime preview matrix
- prompt registry / diff
- schema registry / diff
- session lifecycle

### 主要用户

- Prompt 研发
- 后端 / 前端联调

---

## 7.5 `/lab/kernel-admin` 内核管理台

### 页面目标

集中管理配置源、默认组合、影响矩阵与可编辑化入口。

### 核心内容

- config sources
- defaults by mode
- draft surfaces
- impact map
- registry summary

### 主要用户

- 平台研发
- Prompt 维护者

---

## 7.6 `/lab/drafts` 草稿会话库

### 页面目标

管理所有 draft 资产与草稿会话。

### 核心内容

- 草稿概览
- 草稿列表
- kind 分类
- 关联关系
- apply simulation 相关信息

### 主要用户

- 内容/研发协作

---

## 7.7 `/lab/delivery` 交付调度台

### 页面目标

把 freeze、apply、archive 三层交付队列和 checklist 统一到一个执行面。

### 核心内容

- 总体摘要
- 冻结层
- 应用层
- 归档层
- route load
- action stack
- Release Chain 快照

### 主要用户

- 发布负责人
- PM
- 研发负责人

---

## 7.8 `/lab/release-chain` 发布链路台

### 页面目标

把内容、schema、native、analysis、delivery 串成统一发布图谱。

### 核心内容

- 统一链路摘要
- owner load
- blocker
- release lane
- 当前路线和下一步动作

### 主要用户

- 发布协调者
- 研发负责人
- PM

---

## 7.9 `/lab/schema` 题库结构面板

### 页面目标

可视化展示题库版本、mode、phase、迁移账本和影响链。

### 核心内容

- 版本总览
- question range
- phase coverage
- source files
- version matrix
- delta radar
- migration ledger
- impact chain

### 主要用户

- 内容架构
- 前端
- QA

---

## 7.10 `/lab/runtime` Runtime 面板

### 页面目标

展示 provider/runtime/payload 运行状态和阶段快照。

### 核心内容

- scenario 组合
- live pipeline
- run trace
- prompt shaping
- payload excerpt

### 主要用户

- 研发
- Prompt 联调

---

## 7.11 `/lab/status` 状态面板

### 页面目标

作为“当前 beta 的唯一状态源”，统一收口 freeze、benchmark、demo、golden、pilot 和 debug 入口。

### 核心内容

- pilot readiness
- current phase
- latest benchmark
- latest constellation
- freeze 基线
- automation 护栏
- debug entry
- guided pilot 执行情况

### 特殊定位

- 主产品页移出的所有测试入口都应该回收到这里

### 主要用户

- 产品
- QA
- 研发

---

## 7.12 `/lab/native-handoff` 原生交接面板

### 页面目标

作为 iOS shell / 真机回归 / handoff 的唯一操作页。

### 核心内容

- shell environment
- base URL
- test/debug/status links
- acceptance board
- automation 状态
- regression/native smoke 状态

### 主要用户

- iOS
- QA
- Web 前端

---

## 7.13 `/lab/native-handoff/smoke`

### 页面目标

作为模拟器 smoke 的目标页和占位页。

### 主要用户

- QA
- iOS

---

## 7.14 `/lab/golden`

### 页面目标

展示 golden 样本、冻结基线和主要审阅结果。

### 核心内容

- baseline summary
- sample profile
- runtime output
- tensions
- overview excerpt

### 主要用户

- QA
- 产品
- 研发

---

## 7.15 `/lab/golden/audit`

### 页面目标

审阅当前基线为什么冻结、和新结果有什么差异。

### 核心内容

- baseline selection
- freeze checklist
- rationale
- audit result cards

### 主要用户

- QA
- 产品 owner

---

## 7.16 `/agent/director`

### 页面目标

解释剧场导演 Agent 的输入、运行机制、输出结构和 prompt。

### 核心内容

- Input
- Runtime
- Output
- Prompt excerpt
- theater_script schema

### 主要用户

- Prompt 研发
- 前端
- 产品

---

## 7.17 `/agent/analyst`

### 页面目标

解释精神分析师 Agent 的输入结构、分析流、prompt 和 constellation schema。

### 核心内容

- Input structure
- 7 步分析流
- Prompt excerpt
- psyche_constellation schema

### 主要用户

- Prompt 研发
- 前端
- 产品

---

## 8. 页面间跳转关系

### 8.1 主路径跳转

```text
/ -> /collect -> /processing/benyuan?phase=part1 -> /theater -> /processing/benyuan?phase=constellation -> /constellation
```

### 8.2 调试路径跳转

```text
/lab/status -> /collect/a|b|c
/lab/status -> demo / freeze / debug routes
/lab/native-handoff -> shell / smoke / status / test
```

### 8.3 兼容路径跳转

```text
/report/[sessionId] -> if no report -> /processing/[sessionId]
```

---

## 9. 页面级成功指标建议

### 主路径

| 页面 | 核心指标 |
| --- | --- |
| `/` | 进入率、长按完成率 |
| `/collect` | 完成率、每题放弃率、上传成功率 |
| `/processing/benyuan` | 中断率、重试率、处理完成跳转成功率 |
| `/theater` | 第二幕完成率、第三幕完成率、尾声提交率 |
| `/constellation` | 首屏停留、折叠展开率、分享率、保存率、重新探索率 |

### 内部页

| 页面组 | 核心指标 |
| --- | --- |
| `/lab/*` | 查找效率、状态定位效率、发布前复核效率 |
| `/agent/*` | Prompt/Schema 对齐效率 |
| `/processing/[sessionId]` + `/report/[sessionId]` | 旧链路可回溯性 |

---

## 10. 当前信息治理结论

### 必须继续留在主路径之外的内容

- test pack
- freeze demo
- runtime override
- provider/model/base_url
- request id
- telemetry / hesitation / hover
- benchmark / regression 统计
- handoff / shell 状态

### 主路径允许看到的唯一流程辅助信息

- 当前进度
- 当前问题 / 当前场景 / 当前结果
- 一个主动作
- 一个返回类动作

---

## 11. 设计与前端的协作约束

### 对设计

- 主路径设计稿不能把内部信息重新带回来
- 每屏只保留一个主焦点
- loading / empty / retry 必须并入同一语言

### 对前端

- 继续保证主路径和内部页分层
- debug 模式必须显式触发，不默认露出
- internal route 不要误并入沉浸主路径导航

### 对 iOS shell

- 顶部返回、细进度、底部 CTA、安全区、按压反馈保持一致
- 非输入区域禁选词策略不变

---

## 12. 后续文档拆分建议

如果后续要继续深化，建议从这份总 PRD 再拆成 4 份专项文档：

1. `主流程体验 PRD`
2. `内部工作台 PRD`
3. `Agent 协同 PRD`
4. `iOS shell / native handoff PRD`

这样总文档保留全景，专项文档负责落地。

---

## 13. 最终判断

当前本源的页面体系已经不是单一产品页，而是一个双层结构：

1. `用户主路径`
   - 极低信息量
   - 强沉浸
   - 面向最终体验
2. `内部工作体系`
   - 高信息密度
   - 强追踪性
   - 面向研发、验证、交付

这两层必须继续严格分离。主流程越沉浸，内部页越要完整；内部页越完整，主流程越不应该背负工程噪音。
