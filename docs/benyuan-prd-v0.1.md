# 「本源」MVP Product Requirements Document v0.1

## 1. Product Summary

「本源」MVP 是一个面向深度自我探索用户的 AI 驱动体验产品。

它不是传统人格测试工具，也不试图给用户一个固定标签。MVP 的目标是：
- 通过 10-15 分钟的轻量测试采集用户输入，
- 生成一份有结构、有美感、有节制的精神画像初版，
- 让用户在第一次体验中产生“被理解”的感觉，
- 为后续深度版、变化追踪、长图分享打下基础。

MVP 只验证两件事：
1. 用户是否愿意完成这套体验；
2. 结果是否足够有共鸣，值得保存或分享。

## 2. Product Goal

### 2.1 Business Goal

在最短时间内验证：
- 是否存在愿意为“深度自我理解体验”停留和传播的种子用户；
- 是否能用结构化输入 + Agent 叙事生成稳定地产出高质量初画像；
- 哪类内容最能驱动分享、回访、收藏。

### 2.2 User Goal

用户希望获得的不是一个结论，而是：
- 一种更细腻的自我描述语言；
- 一份足够像自己的精神画像；
- 一个能解释自己当前状态的视角；
- 一个可保存、可回看、可分享的“自我镜像”。

### 2.3 MVP Success Definition

若满足以下条件，则 MVP 成功：
- 测试完成率达到可接受水平；
- 报告阅读完成率高；
- 收藏/截图/分享意愿明显；
- 用户主观反馈中频繁出现“像我”“被说中”“有共鸣”；
- 低质量输出有明确可回溯原因。

## 3. MVP Scope

### 3.1 In Scope

MVP 只做以下能力：
- 模式一：分层渐进式轻量测试
- 三个维度：审美语法、情感气候、时间哲学
- 结构化选择题 + 少量开放题
- 异步分析生成
- 结果页文本报告
- 基础分享卡片/长图结构预留
- 安全与敏感表达降级

### 3.2 Out of Scope

本阶段不做：
- 七维完整体系
- 剧场沉浸式模式
- 用户上传创作物分析
- AI 精神肖像绘图生成
- 变化追踪
- 社区内容流
- 付费咨询对接

## 4. Target Users

MVP 重点覆盖以下用户：
- 会主动做人格、审美、心理类测试的人
- 对“我是谁”“我现在怎么了”有持续兴趣的人
- 对书、歌、电影、氛围有较强偏好表达欲的人
- 愿意为高质量文案和被理解感停留的人

不优先覆盖：
- 只想快速拿到结论的人
- 只关注科学量表准确性的人
- 明确寻求心理诊断或治疗建议的人

## 5. Core Value Proposition

### 5.1 Core Promise

你不是被定义的，而是被理解的。

### 5.2 User Value

用户完成 MVP 后，至少应得到：
- 一段能概括当前精神状态的总览文字；
- 三个维度的细致解读；
- 两组内在张力描述；
- 一个诗意但不僵化的精神原型；
- 一组可行动但不说教的推荐内容。

## 6. Experience Principles

### 6.1 不像测试，更像被引导进入自己
题目避免生硬人格测试话术，改用场景、隐喻、审美偏好作为入口。

### 6.2 不急于建议，先让用户被看见
结果页先给洞察，再给建议。

### 6.3 不强调科学诊断，强调语言与镜像
所有文案都避免“准确率”“人格类型”等强科学化包装。

### 6.4 不制造命运感，强调流动性
用户当前状态被呈现为一个阶段，而不是永久身份。

## 7. User Journey

### 7.1 Entry

用户从落地页进入，理解三个信息：
- 这不是普通人格测试；
- 整体耗时约 10-15 分钟；
- 结果会是一份精神画像，而不是类型标签。

### 7.2 Lightweight Test

用户依次完成：
- 基础信息
- 情绪状态选择
- 审美相关题目
- 情感节律/深度题目
- 时间感知与生命叙事题目
- 1-2 个开放题

### 7.3 Submission and Waiting

提交后进入分析态：
- 呈现非机械式等待文案
- 避免“正在计算你的分数”
- 强调“正在整理你的精神线索”

### 7.4 Result Page

结果页按如下顺序展示：
1. 精神地形总览
2. 三维解读
3. 内在张力
4. 精神原型
5. 推荐内容与小练习
6. 保存/分享入口

## 8. Information Architecture

### 8.1 Pages

MVP 建议页面：
- `/`
  - Landing page
- `/test`
  - 测试流程页
- `/processing/:sessionId`
  - 分析等待页
- `/report/:sessionId`
  - 结果页
- `/about`
  - 方法说明与边界说明

### 8.2 Core Components

- Hero promise block
- Test intro block
- Question card
- Mood selector
- Aesthetic picker
- Text answer block
- Processing state module
- Overview report block
- Dimension reading block
- Tension block
- Archetype block
- Recommendation list
- Share/save block
- Safety note block

## 9. Functional Requirements

### FR-1 Start Test
用户可以从首页进入轻量测试，并看到预计耗时、体验说明与隐私边界。

### FR-2 Answer Questions
系统支持单选、多选、量表、短文本题型，并保存原始答案。

### FR-3 Submit Session
用户完成测试后可提交，系统创建 `TestSession`。

### FR-4 Trigger Analysis
系统基于会话数据生成 `FeatureVector`，并发起异步 `AnalysisJob`。

### FR-5 Render Processing State
用户在等待页可看到分析中的状态，不暴露生硬技术细节。

### FR-6 Retrieve Report
分析完成后，用户可以查看 `ReportPayload`。

### FR-7 Render Structured Result
结果页必须渲染：
- overview
- 3 dimension readings
- 2 tensions
- 1 archetype
- recommendations
- safety note when needed

### FR-8 Share/Save Entry
用户可执行基础保存/截图/分享行为，即使分享能力先为占位态也要预留位置。

### FR-9 Safety Downgrade
若检测到敏感内容、低信息量或高不确定性，系统必须应用降级表达策略。

## 10. Non-Functional Requirements

- 首次体验必须在移动端和桌面端都可顺畅完成
- 轻量测试总时长目标为 10-15 分钟
- 结果页正文必须结构清晰，适合长时间阅读
- 所有生成内容必须带版本号
- 报告必须可追溯到输入与 prompt/schema 版本

## 11. Result Structure Requirements

### 11.1 Overview
- 一段完整、较强氛围感的总览文字
- 不做诊断式判断
- 不出现 MBTI/依恋标签化结论

### 11.2 Dimension Readings
必须包含：
- 审美语法
- 情感气候
- 时间哲学

每个维度都应：
- 有标题
- 有 1 段主解释
- 有证据特征支撑
- 有置信度层级

### 11.3 Tensions
默认展示两组张力：
- 张力名称
- 两极
- 描述
- 与之相处的建议

### 11.4 Archetype
必须包含：
- 原型名称
- 一段描述
- 原型与结果内容之间的连贯性

### 11.5 Recommendations
推荐内容包含：
- 哲学建议
- 书目
- 音乐
- 小练习

## 12. Content Strategy

### 12.1 Tone
整体语气要求：
- 温柔
- 克制
- 有质感
- 不油腻
- 不假装无所不知

### 12.2 Forbidden Tone
禁止：
- 居高临下
- 伪心理诊断
- 强行煽情
- 虚假承诺
- 宿命式表达

## 13. Safety and Boundary Rules

MVP 必须在产品层明确：
- 这不是医学或心理诊断工具
- 分析结果是理解性镜像，不替代专业帮助
- 当出现极端痛苦、自伤等信号时，结果需要降级并提示寻求现实支持

## 14. Measurement and Analytics

MVP 需要埋点以下事件：
- landing_view
- test_start
- question_answered
- test_submit
- analysis_started
- report_view
- report_scroll_depth
- share_click
- save_click
- feedback_submit

关键观察指标：
- 测试开始率
- 测试完成率
- 报告查看率
- 报告读完率
- 分享点击率
- 用户主观共鸣评分

## 15. Open Questions

当前仍待后续版本确认：
- 首页是否先直接进入测试，还是先看样例报告
- 报告是否需要“短版摘要 + 长版全文”双层结构
- 分享卡片用文本化设计还是图像化设计
- 开放题数量控制在 1 题还是 2 题更优

## 16. Release Recommendation

第一版建议作为受控试点发布，先邀请小规模种子用户验证：
- 是否愿意完成整套流程
- 是否觉得结果像自己
- 是否愿意截图/转发
- 哪个模块最打动人，哪个模块最空泛

如果共鸣强于预期，再进入下一阶段：
- 扩题库
- 扩维度
- 增加视觉化结果
- 增加变化追踪
