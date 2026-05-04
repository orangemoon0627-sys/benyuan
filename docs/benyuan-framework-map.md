# 本源框架可修改地图

更新时间：2026-03-09

这份地图不是产品文案，而是开发入口说明。
目标是让你在不打乱整体结构的前提下，知道：
- 该改哪里
- 会影响什么
- 先后顺序怎么排

---

## 1. 现在最适合优先修改的层

### A. 测试框架层
适合改：模式、阶段、题量、题型、单题推进节奏。

核心文件：
- `src/config/assessment/version-manifests.ts`
- `src/config/assessment/question-sources.ts`
- `src/features/assessment/question-content-lite.ts`
- `src/features/assessment/question-content-lite-v2.ts`
- `src/features/assessment/question-content-deep.ts`
- `src/features/assessment/question-types.ts`
- `src/features/assessment/flow.ts`
- `src/lib/assessment-schema.ts`
- `src/lib/assessment-client-contract.ts`

你改这个层时，主要是在决定：
- 保不保留 `lite / deep`
- 每个 mode 有几个 phase
- 每个 phase 放哪些 module
- 每个版本的题目集用哪套 source
- 单题推进时每步如何组织与校验

会影响：
- `/test`
- `/api/test/schema`
- `/lab/content`
- `/lab/schema`
- `/lab/native-handoff`

最适合你先动的内容：
- phase 顺序
- lite/deep 的差异
- 开放题位置
- 是否增加“剧场模式”的独立版本

---

### B. 分析报告框架层
适合改：七维顺序、张力模块、原型命名、建议结构、叙事风格。

核心文件：
- `src/config/analysis/prompt-templates.ts`
- `src/config/analysis/report-schemas.ts`
- `src/config/analysis/runtime-preview-presets.ts`
- `src/lib/analysis/prompt-shaping.ts`
- `src/lib/analysis/report-schemas.ts`
- `src/lib/analysis/pipeline.ts`
- `src/lib/report-builder.ts`
- `src/features/assessment/analysis-mapping.ts`

你改这个层时，主要是在决定：
- 报告更偏“诗性理解”还是“结构洞察”
- 七维如何排序
- 张力模块前置还是后置
- 原型命名是否更文学化
- 推荐书单/建议块的比重

会影响：
- `/processing/[sessionId]`
- `/report/[sessionId]`
- `/api/analysis`
- `/lab/kernel`
- `/lab/kernel-admin`
- `/lab/runtime`
- `/lab/golden`

最适合你先动的内容：
- 报告大纲
- prompt 风格
- archetype 命名方式
- recommendation 的输出结构

---

### C. 内容-契约联动层
适合改：让未来 iOS App、Web、内部控制台都用同一套结构语言。

核心文件：
- `src/lib/types.ts`
- `src/lib/store.ts`
- `src/features/assessment/content-workbench.ts`
- `src/lib/release-chain.ts`
- `src/lib/native-reference.ts`
- `src/lib/lab-route-meta.ts`

你改这个层时，主要是在决定：
- 草稿如何跟踪
- schema 迁移怎么记录
- native handoff 如何承接
- release chain 怎么调度

会影响：
- `/lab/board`
- `/lab/delivery`
- `/lab/release-chain`
- `/lab/schema`
- `/lab/native-handoff`

这一层不建议你频繁大改底层字段命名。
更适合在框架稳定后做扩展，不适合当前大幅推翻。

---

## 2. 页面和内部面板分别看什么

### 产品页
- `src/app/test/page.tsx`
  - 看测试主体验
  - 适合调单题推进、文案、节奏
- `src/app/processing/[sessionId]/page.tsx`
  - 看处理中间态
- `src/app/report/[sessionId]/page.tsx`
  - 看最终报告体验

### 内部面板
- `src/app/lab/content/page.tsx`
  - 看题库版本、source、diff
- `src/app/lab/schema/page.tsx`
  - 看 version / phase / flow / native drift
- `src/app/lab/kernel/page.tsx`
  - 看 analysis 内核、prompt/schema/preset
- `src/app/lab/kernel-admin/page.tsx`
  - 看可管理的配置面
- `src/app/lab/delivery/page.tsx`
  - 看 freeze/apply/archive 执行状态
- `src/app/lab/release-chain/page.tsx`
  - 看 content -> schema -> native -> analysis -> delivery 的统一发布链
- `src/app/lab/native-handoff/page.tsx`
  - 看 iOS/RN 承接结构
- `src/app/lab/board/page.tsx`
  - 看整体开发进度

---

## 3. 推荐修改顺序

### 第一优先级：先定测试框架
先回答这 5 个问题：
1. 只保留 `lite / deep`，还是增加第三种模式
2. 每个模式分几段 phase
3. 每段 phase 用什么题型
4. 开放题是穿插还是结尾集中
5. 是否要把“剧场式体验”做成单独版本而不是直接覆盖现有 `/test`

对应先改：
- `src/config/assessment/version-manifests.ts`
- `src/features/assessment/question-content-*.ts`

### 第二优先级：再定报告框架
再回答这 5 个问题：
1. 七维是不是固定都要出现
2. 张力模块放在中段还是前段
3. 原型命名更诗性还是更克制
4. 推荐部分占比多大
5. deep 模式是否允许更文学化输出

对应先改：
- `src/config/analysis/prompt-templates.ts`
- `src/config/analysis/report-schemas.ts`
- `src/features/assessment/analysis-mapping.ts`

### 第三优先级：最后再做 UI 和 App 承接
当上面两层相对稳定后，再去统一：
- `/test` 的正式视觉
- `/report` 的长图/卡片样式
- iOS App 的 screen sequence

对应看：
- `src/app/test/page.tsx`
- `src/app/report/[sessionId]/page.tsx`
- `src/lib/assessment-client-contract.ts`
- `src/lib/native-reference.ts`

---

## 4. 如果你想改不同目标，该从哪里下手

### 目标：改题目内容
先改：
- `src/features/assessment/question-content-lite.ts`
- `src/features/assessment/question-content-lite-v2.ts`
- `src/features/assessment/question-content-deep.ts`

再检查：
- `/lab/content`
- `/lab/schema`

### 目标：改测试结构
先改：
- `src/config/assessment/version-manifests.ts`
- `src/features/assessment/flow.ts`
- `src/lib/assessment-client-contract.ts`

再检查：
- `/test`
- `/lab/schema`
- `/lab/native-handoff`

### 目标：改分析风格
先改：
- `src/config/analysis/prompt-templates.ts`
- `src/config/analysis/report-schemas.ts`

再检查：
- `/lab/kernel`
- `/lab/runtime`
- `/report/[sessionId]`

### 目标：改七维映射逻辑
先改：
- `src/features/assessment/analysis-mapping.ts`
- `src/lib/analysis/input.ts`
- `src/lib/analysis/deterministic-engine.ts`

再检查：
- `/lab/kernel`
- `/lab/golden`
- `/report/[sessionId]`

### 目标：以后做 iOS App
先看：
- `src/lib/assessment-client-contract.ts`
- `src/lib/native-reference.ts`
- `/lab/native-handoff`
- `/lab/schema`
- `/lab/release-chain`

---

## 5. 当前不建议你现在就大改的地方

这些地方现在属于“核心通路”，可以优化，但不建议先大推翻：
- `src/lib/types.ts`
- `src/lib/store.ts`
- `src/app/api/analysis/route.ts`
- `src/app/api/test/submit/route.ts`（如果后续有）
- `src/lib/release-chain.ts`

原因：
- 它们现在承接了题库、分析、草稿、交付、内部控制台
- 这里大改容易把整个可观察链路打断

更好的方式是：
- 先改内容层和配置层
- 再看是否需要扩展底层类型

---

## 6. 最推荐你的实际工作方式

如果你准备开始单独改本源框架，建议你按下面节奏进行：

### 路线 1：先改测试框架
- 先在 `version-manifests` 定 phase
- 再在 `question-content-*` 改题
- 用 `/lab/schema` 看迁移影响
- 用 `/lab/native-handoff` 看 app 承接

### 路线 2：先改报告框架
- 先在 `prompt-templates` 改语气与原则
- 再在 `report-schemas` 改输出结构
- 用 `/lab/kernel` 和 `/lab/runtime` 看运行结果
- 用 `/report/[sessionId]` 看最终感受

### 路线 3：先定 App 化方向
- 先不碰 UI 细节
- 先收敛 step contract / screen sequence / native blueprint
- 用 `/lab/native-handoff` + `/lab/release-chain` 作为主控制台

---

## 7. 现在一句话建议

如果你现在要开始真正主导“本源框架内容”的修改，最推荐你先从：
- `src/config/assessment/version-manifests.ts`
- `src/features/assessment/question-content-lite-v2.ts`
- `src/config/analysis/prompt-templates.ts`
- `src/config/analysis/report-schemas.ts`

这 4 个点开始。

因为它们分别对应：
- 测试结构
- 题目内容草案
- 分析语气
- 报告结构

这四块一旦定住，后面的 UI、App、内部控制台都会更稳。
