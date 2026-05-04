# 本源 Figma 页面内容框架文档（主流程）

- 文档版本：v1.0
- 更新时间：2026-03-23
- 适用对象：Figma 视觉设计、交互设计、前端实现对齐
- 文档目标：把本源主流程每一页需要承载的文字、内容框架、状态分支、动态字段和禁用信息一次性梳理清楚，便于在 Figma 中直接画页面

---

## 0. 文档适用范围

本文件只覆盖主流程 5 个页面：

1. `/`
2. `/collect`
3. `/processing/benyuan`
4. `/theater`
5. `/constellation`

不在本次 Figma 主流程设计范围内：

- `/collect/a`
- `/collect/b`
- `/collect/c`
- `/lab/status`
- `/lab/native-handoff`
- 所有 debug / runtime / demo / test pack / provider 覆盖入口
- 报告页、内部工具页、agent 调试页

这些内部页面和调试入口继续保留在产品里，但不进入主用户路径，不应该被画进主流程设计稿。

---

## 1. 总体验目标

### 1.1 产品体验定义

本源主流程不是后台、问卷工作台、也不是控制台。它应该被设计成一条完整的、低信息量的、移动端优先的探索路径：

`进入 -> 回答 -> 显影等待 -> 剧场 -> 星图结果`

用户在任何时刻都只需要面对一件事：

- 入口页：决定开始
- collect：回答当前题
- processing：等待当前阶段完成
- theater：完成当前一幕
- constellation：阅读当前结果

### 1.2 本轮锁定的视觉语言

设计方向不是继续沿用旧的“哲学舞台页 + 工作台信息块”的混合表达，而是高度靠近参考图的原生 app/onboarding 语言，但颜色继续使用本源自己的体系。

固定视觉判断：

- 主色：黑 / 金 / 灰
- 字体：粗系统无衬线为主，不用 serif 作为主流程主视觉
- 结构：低 chrome、单焦点、大圆角、厚实 CTA、柔和玻璃层
- 情绪：黑底氛围、金色发光、信息极少、内容压屏
- 信息：不出现工程感、调试感、工作台感

### 1.3 主流程页面统一约束

所有主流程页必须遵守：

1. 顶部默认只有：返回 + 2px 细进度 + 极弱阶段感知
2. 页面不出现网站 header、lab 导航、菜单式入口
3. 页面不出现 provider / model / runtime / request id / debug / freeze / test pack
4. 底部只保留一个主动作，最多一个返回类次动作
5. 每屏只允许一个主焦点

---

## 2. 全局 Figma 设计基线

这一节不是代码 token，而是 Figma 出图时的统一基线。

### 2.1 建议的 Figma 设备框架

主设计稿建议至少覆盖以下画板：

- iPhone 15 Pro / 393 x 852
- iPhone 15 Pro Max / 430 x 932

桌面端只做兼容，不单独建立第二套视觉语言。

### 2.2 统一布局骨架

所有主流程页统一使用四层骨架：

1. `Top Shell`
   - 返回按钮
   - 细进度条
   - 极弱阶段提示（如有）
2. `Main Focus`
   - 当前题目 / 当前场景 / 当前结果
3. `Input / Reading Layer`
   - 选项、上传、阅读内容、状态信息
4. `Bottom Action Dock`
   - 主 CTA
   - 一个返回类次动作

### 2.3 统一字体建议

- 主标题 / 问题 / 原型名：
  - `"SF Pro Display", "SF Pro Text", "PingFang SC", -apple-system, sans-serif`
  - 粗字重，强压屏
- 正文 / 说明 / 描述：
  - `"SF Pro Text", "PingFang SC", -apple-system, sans-serif`
- 不在主流程使用 serif 主标题

### 2.4 统一颜色建议

- 画布底色：纯黑到极深黑渐变
- 主要文字：纯白
- 次要文字：中灰
- 弱提示文字：深灰
- 唯一强调：金色
- 不引入蓝紫色、彩色标签、彩色图表

### 2.5 统一组件层级

#### A. 顶部极简壳 Top Shell

固定内容：

- 左：返回按钮
- 中：2px 细进度
- 右：极弱进度文本或空白

不放这些内容：

- 页面大标题
- 长描述
- 分段导航
- debug pill
- runtime 状态

#### B. 主舞台卡 Main Stage

适用页面：

- `/collect`
- `/theater`
- `/constellation` 首屏
- `/processing/benyuan` 被动态中心骨架

要求：

- 大圆角
- 强居中
- 面积大
- 内容少
- 只承载当前主内容

#### C. 大圆角选项卡 Option Card

用于：

- 单选
- 多选
- 剧场选择
- 镜像问题

要求：

- 单列
- 高触达面积
- 默认弱玻璃
- 选中态金色边缘和轻发光
- 编号和辅助标签弱化

#### D. 上传舞台 Upload Stage

用于 collect 上传题：

- 一个主上传入口
- 两个同层级副动作：相册 / 拍照
- 一行数量提示
- 一条横向缩略图轨道

禁止：

- 二级“素材状态卡”
- 空态说明面板
- 工具式管理条

#### E. 被动态中心骨架 Passive State

用于：

- processing 正常处理中
- processing 空态
- processing 失败重试态
- theater loading / 无脚本
- constellation loading / 空态

结构固定：

1. 极弱状态眉标
2. 中心主标题
3. 一句短说明
4. 单条进度轨
5. 必要时一个 CTA + 一个返回

#### F. 底部操作条 Bottom Action Dock

只承担操作，不承担信息摘要。

只允许：

- 主 CTA
- 一个返回/上一题按钮

不允许：

- 模块进度说明
- 当前状态摘要
- provider/model 等补充文字

---

## 3. 页面级内容框架

---

## 3.1 `/` 入口页

### 页面目标

让用户进入状态，而不是解释产品。

### 页面情绪

- 仪式感
- 静
- 克制
- 有吸引力但不复杂

### 页面必须出现的内容

1. 品牌主标题
2. 英文副标题
3. 长按开始 CTA
4. 长按进度线
5. 唤醒中的粒子/光点动画

### 页面禁止出现的内容

- 产品介绍长文
- 页面导航
- 功能列表
- 任何调试信息
- 任何“开发中 / beta 工作台”信息

### 页面文字清单

#### 默认态

- 中文主标题：`本源`
- 英文副标题：`THE ORIGIN`
- CTA：`[ 长按开始探索 ]`

#### 长按中

- CTA：`继续按住 3s`
- CTA：`继续按住 2s`
- CTA：`继续按住 1s`

#### 唤醒中

- 文案：`正在唤醒你的星图...`

### Figma 需要设计的状态

1. `landing-idle`
2. `landing-pressing`
3. `landing-awakening`

### 动态行为说明

- 长按完成后跳转 `/collect`
- 数字倒计时不是固定文案，需要能容纳 `3s / 2s / 1s`

### Figma 组件建议

- 品牌标题
- 长按按钮
- 细进度条
- 粒子唤醒层

---

## 3.2 `/collect` 单题采集页

### 页面目标

让用户只面对当前题，不感受到流程面板和工作台。

### 页面情绪

- onboarding 感
- 私密
- 稳定
- 明确

### 页面固定结构

1. `Top Shell`
   - 返回
   - 细进度
   - 极弱 A / B / C 微切换
2. `Question Stage`
   - 弱题号
   - 弱模块标记
   - 当前问题
3. `Input Layer`
   - 单选 / 多选 / distribution / upload 四种之一
4. `Bottom Action Dock`
   - 上一题
   - 主动作

### 页面禁止出现的内容

- 当前状态 / 当前焦点 / 下一步 信息面板
- 模块完成度卡片
- test pack
- freeze demo
- runtime override
- provider/model/base_url
- debug 提示文案
- 技术说明
- “你正在进行 Part 1”这类大标题式抬头

### 顶部内容规则

顶部只保留非常弱的流程感知：

- 返回按钮：纯图标或极短文字
- 细进度：总题进度
- A/B/C：极弱微切换，只提示当前题属于哪个模块

不在顶部放：

- 大标题 `显影`
- `Part 1`
- 长说明
- 状态摘要

### Question Stage 固定内容

#### 弱标记层

- 题次：如 `01 / 13`
- 模块：如 `A`

这两个信息都要弱化，只作为辅助感知，不应抢问题本身的视觉权重。

#### 主问题层

问题文案是整个页面的绝对主角。

文案长度允许从短句到长句，但版式要始终保证：

- 一眼看懂
- 不像说明页
- 文字仍然有压屏感

### Bottom Action Dock 固定文案逻辑

#### 次动作

- `上一题`

#### 主动作，按状态动态切换

- 普通题：`下一题`
- 当前模块最后一题：`下一模块`
- 最后一题完成：`进入剧场`

### 校验错误文案

统一文案基线：

- 通用阻断：`还有一些问题等待你的回答`

按题型的具体校验提示可继续补充为：

- 多选未达最小值：`至少选择 {n} 项`
- distribution 未到 100：`过去 / 现在 / 未来总和需要等于 100`
- 上传数量不足：`至少上传 {n} 张`

设计上错误提示只在阻断时出现，不常驻。

---

### 3.2.1 题型一：Single 单选题

#### 页面内容结构

1. 弱题号
2. 弱模块标记
3. 问题文案
4. 单列选项卡列表
5. 底部操作

#### 设计要求

- 默认首屏能看到 2-4 张卡
- 卡片单列
- 每张卡只保留选项文本
- 不展示内部标签、心理信号、技术分类

#### 交互状态

- default
- hover / press
- selected
- disabled（切换中）

#### Figma 必画状态

1. `collect-single-default`
2. `collect-single-selected`
3. `collect-single-error`

---

### 3.2.2 题型二：Multi 多选题

#### 页面内容结构

与单选题一致，但允许多张卡选中。

#### 文案规则

- 不额外增加长解释
- 最多可在题目下方保留一条最弱辅助文案，例如：
  - `至少选 2 个`
  - `至少选 1 个`

#### 交互状态

- 未选
- 单项选中
- 多项选中
- 校验阻断

#### Figma 必画状态

1. `collect-multi-default`
2. `collect-multi-multi-selected`
3. `collect-multi-error`

---

### 3.2.3 题型三：Distribution 分配题

#### 页面内容结构

1. 弱题号
2. 问题文案
3. 三个滑杆块
   - 过去
   - 现在
   - 未来
4. 总和提示
5. 底部操作

#### 页面固定文字

- 题目：使用题库中的原题
- 辅助文案：`三个滑块总和必须等于 100%。`
- 维度标签：
  - `过去`
  - `现在`
  - `未来`

#### 设计要求

- 视觉重点仍然是题目，不是控件本身
- 三个分配块应属于同一舞台，不拆成多个卡片系统
- 100% 检查结果只在必要时提示

#### Figma 必画状态

1. `collect-distribution-default`
2. `collect-distribution-adjusting`
3. `collect-distribution-error`

---

### 3.2.4 题型四：Upload 上传题

#### 页面内容结构

1. 弱题号
2. 问题文案
3. 数量提示
4. 主上传入口
5. 副动作
   - `相册`
   - `拍照`
6. 缩略图横向轨道
7. 上传错误提示（只在失败时显示）
8. 底部操作

#### 页面固定文字

主上传入口建议文案：

- `选择图片`

副动作建议文案：

- `相册`
- `拍照`

数量提示建议按动态数据输出：

- 空态：`至少 1 张 · 最多 3 张`
- 已上传：`已加入 1 / 3 张 · 还可补充 2 张`
- 已满：`已加入 3 / 3 张`

上传过程辅助文案：

- 初始：`点击选择图片，或直接拖进来。`
- 上传中：`正在整理素材。`
- 拖拽中：`松开即可完成加入。`
- 可补充：`还可补充 {n} 张。`
- 已足够：`这一题的数量已经足够。`

#### 上传题禁止出现的内容

- “素材管理”
- “素材状态”
- 第二层空态卡
- 冗长隐私说明块
- 测试素材入口

#### Figma 必画状态

1. `collect-upload-empty`
2. `collect-upload-filled`
3. `collect-upload-full`
4. `collect-upload-uploading`
5. `collect-upload-error`

---

### 3.2.5 `/collect` 动态字段映射

| 界面位置 | 字段来源 | 说明 |
| --- | --- | --- |
| 顶部细进度 | 当前题序号 / 总题数 | 全局 13 题进度 |
| 微切换 A/B/C | `question.module` | 只做弱感知 |
| 弱题号 | 当前题序号 | 格式建议 `01 / 13` |
| 问题文案 | `question.prompt` | 页面主焦点 |
| 单选文本 | `question.options[].text` | 只显示文本 |
| 多选文本 | `question.options[].text` | 只显示文本 |
| distribution 标签 | `distributionKeys[].label` | 过去/现在/未来 |
| distribution 数值 | 当前滑杆值 | 0-100 |
| upload 数量范围 | `uploadRange.min/max` | 生成数量提示 |
| upload 帮助文字 | `helperText` | 设计上不建议常驻，只在必要时轻量出现 |
| 错误文本 | 本地校验逻辑 | 阻断态展示 |
| 主 CTA 文案 | 当前题位置 | 下一题 / 下一模块 / 进入剧场 |

---

## 3.3 `/processing/benyuan` 显影等待页

### 页面目标

把“处理中”收成一个中心焦点等待态，不像工作台，不像状态页。

### 页面情绪

- 稳定
- 安静
- 在进行中
- 有承接感

### 页面统一骨架

1. 返回
2. 顶部细进度
3. 极弱阶段提示
4. 中心主标题
5. 一句短说明
6. 单条进度轨
7. 必要时 CTA

### 页面禁止出现的内容

- provider / model / request id
- 多组状态卡并列
- 阶段 chips 一排展开
- 预计剩余时间
- 工程术语说明
- 多层重复“正在处理中 / 正在显影 / 即将完成”

---

### 3.3.1 要设计的 4 种状态

1. `processing-empty`
2. `processing-running`
3. `processing-retry`
4. `processing-route-fallback`

这四种状态必须使用同一视觉骨架，只换文案和按钮。

---

### 3.3.2 phase = `part1` 阶段序列

| 阶段序号 | 阶段名 | 短说明 | 设计备注 |
| --- | --- | --- | --- |
| 1 | 收束特征 | 正在写回这一轮回答。 | 很短，不解释 API |
| 2 | 解析线索 | 正在整理你的素材线索。 | 不显示“多模态分析” |
| 3 | 构建剧场 | 正在生成接下来的剧场。 | 不显示导演、provider |
| 4 | 剧场已就绪 | 准备带你进入下一幕。 | 作为结束前过渡 |

#### 推荐状态文案

- 顶部阶段感知：`第 1 段 / 4`
- 中心标题：`收束特征`
- 中心说明：`正在写回这一轮回答。`

---

### 3.3.3 phase = `constellation` 阶段序列

| 阶段序号 | 阶段名 | 短说明 | 设计备注 |
| --- | --- | --- | --- |
| 1 | 记录选择 | 正在写回你的剧场轨迹。 | 不显示 part2 submit |
| 2 | 精神分析 | 正在把这些线索显影成星图。 | 不显示 analyst/runtime |
| 3 | 星图显形 | 准备进入结果页。 | 结束过渡 |

#### 推荐状态文案

- 顶部阶段感知：`第 2 段 / 3`
- 中心标题：`精神分析`
- 中心说明：`正在把这些线索显影成星图。`

---

### 3.3.4 空态文案

#### 从 Part 1 进入时

- 标题：`等待开始`
- 说明：`当前还没有待继续的显影任务。`
- CTA：`返回 Part 1`

#### 从 Theater 进入时

- 标题：`等待开始`
- 说明：`当前还没有待继续的星图任务。`
- CTA：`前往剧场`

---

### 3.3.5 失败重试态文案

- 标题：使用当前阶段名
- 说明：使用当前阶段短说明，或更短错误说明
- 主 CTA：`重试当前阶段`
- 次动作：`回到上一步`

禁止：

- 错误堆栈
- request id
- provider error
- 原始异常串

---

### 3.3.6 `/processing/benyuan` 动态字段映射

| 界面位置 | 字段来源 | 说明 |
| --- | --- | --- |
| 顶部细进度 | 阶段总进度 | 百分比即可 |
| 极弱阶段感知 | 当前阶段索引 / 总阶段数 | 如 `第 2 段 / 4` |
| 中心标题 | 当前阶段 `title` | 收束特征 / 精神分析 等 |
| 中心说明 | 当前阶段 `detail` | 一句短说明 |
| 进度轨 | 平滑推进后的 `progress` | 只显示一层 |
| CTA | 状态决定 | 空态跳回 / 错误重试 |

---

## 3.4 `/theater` 剧场体验页

### 页面目标

让用户进入连续的四幕流程，而不是阅读说明。

### 页面情绪

- 沉浸
- 戏剧感
- 私密
- 带一点未知感

### 页面统一要求

- 顶部只保留返回 + 细进度
- 一幕一屏
- 一屏只做一件事
- 不暴露任何 telemetry / trait / hover / hesitation / personalization_summary

### 页面禁止出现的内容

- 幕标题栏
- 时长
- 风格标签
- 心理信号
- trait signal
- 内部记录说明
- “你现在正在做什么”的解释性标签

---

### 3.4.1 要设计的 6 个状态

1. `theater-loading`
2. `theater-empty`
3. `theater-act1-collapsed`
4. `theater-act1-expanded`
5. `theater-act2`
6. `theater-act3`
7. `theater-epilogue`

如果要把 fallback 单独画出来，可作为 loading 的变体，不需要第二套语言。

---

### 3.4.2 Loading 态

- 标题：`剧场正在就位。`
- 说明：`脚本一旦就位，就会直接进入这一幕。`
- 极弱眉标：`剧场装载`

不出现：

- skeleton 列表
- 多卡占位
- 技术等待说明

---

### 3.4.3 Empty 态（无脚本）

- 标题：`还没有可体验的剧场脚本。`
- 说明：`先完成当前输入，再回来进入这一幕。`
- CTA：`回到收集`
- 极弱眉标：`暂无剧场`

---

### 3.4.4 第一幕 Act 1

#### 页面结构

1. 顶部极简壳
2. 主场景句
3. 极弱展开入口（可选）
4. 主 CTA

#### 页面文字框架

- 主句来源：`act1.scene_description`
- 如果文案很长，分成：
  - `lead`：首段，默认显示
  - `tail`：其余文字，点击后展开

#### 固定文字

- 展开入口：`展开场景`
- 收起入口：`收起`
- 主 CTA：`继续`

#### 设计要求

- 主场景句必须是唯一视觉中心
- 展开入口必须弱，不应像第二个 CTA
- 不出现“第一幕”标签或说明文案

---

### 3.4.5 第二幕 Act 2

#### 页面结构

1. 顶部极简壳
2. 当前场景句
3. 单列选项卡

#### 页面文字框架

- 标题：`act2.choices[current].scene` 的短句版
- 选项：`act2.choices[current].options[].text`

#### 设计要求

- 当前场景句就是唯一标题
- 选项卡单列、大圆角、玻璃感
- 不显示“选一个方向”这类辅助标题
- 不显示选中后的解释文案

#### Figma 交互状态

1. 未选择
2. 按压
3. 已选择 / 正在切换下一题

---

### 3.4.6 第三幕 Act 3

#### 页面结构

1. 顶部极简壳
2. 问题
3. 极短镜像提示
4. 单列选项卡

#### 页面文字框架

- 问题：`act3.mirror_questions[current].question`
- 极短镜像提示：从 `act3.mirror_final_words` 提炼的短句
- 选项：`act3.mirror_questions[current].options[].text`

#### 设计要求

- 问题是主角
- 镜像提示只能是一句非常短的次级文字
- 不出现“只回答这一句”“面对自己”等说明式标签

---

### 3.4.7 尾声 Epilogue

#### 页面结构

1. 中心结束语
2. 一句过渡句
3. 主 CTA
4. 必要时弱状态字

#### 页面固定文字

- 结束语：`旅程结束。`
- CTA：`进入星图`
- 提交中：`正在绘制你的精神星图...`

#### 动态文字来源

- 过渡句 1：`epilogue.scene_description` 的短句版
- 过渡句 2：`epilogue.closing_text` 的短句版

#### 禁止出现的内容

- “尾声”大标题
- 长段收束说明
- 提交细节

---

### 3.4.8 `/theater` 动态字段映射

| 界面位置 | 字段来源 | 说明 |
| --- | --- | --- |
| 顶部细进度 | 当前幕进度 | 1/4 到 4/4 |
| 第一幕主句 | `act1.scene_description` | 可拆 lead/tail |
| 第一幕展开入口 | tail 是否存在 | 仅在超长文案时出现 |
| 第二幕标题 | `act2.choices[].scene` | 取短句版 |
| 第二幕选项 | `act2.choices[].options[].text` | 只展示文本 |
| 第三幕问题 | `act3.mirror_questions[].question` | 主焦点 |
| 第三幕镜像提示 | `act3.mirror_final_words` | 只取极短版 |
| 第三幕选项 | `act3.mirror_questions[].options[].text` | 只展示文本 |
| 尾声过渡 | `epilogue.scene_description` / `closing_text` | 短句化 |

#### 明确不展示的字段

- `visual_prompt`
- `ambient_sound`
- `duration`
- `personalization_summary`
- `trait_signal`
- `response`
- 所有 runtime 信息

---

## 3.5 `/constellation` 星图结果页

### 页面目标

让结果首先像一个被揭示出来的原型，而不是一份报告。

### 页面情绪

- 完成
- 收束
- 稳定
- 有份量

### 页面统一结构

1. 顶部极简壳
2. 首屏 hero
3. 默认短结果流
4. 关闭态折叠区

### 页面禁止出现的内容

- 生成时间
- constellation id
- runtime/provider/model
- sticky 锚点导航
- 速读摘要四宫格
- 一开始就展开完整报告
- 技术 pills

---

### 3.5.1 要设计的 5 个状态

1. `constellation-loading`
2. `constellation-empty`
3. `constellation-hero`
4. `constellation-short-flow`
5. `constellation-foldout-expanded`

---

### 3.5.2 Loading 态

- 极弱眉标：`星图装载`
- 标题：`星图正在显形。`
- 说明：`结果一旦返回，这里就会把原型接出来。`

---

### 3.5.3 Empty 态

- 极弱眉标：`暂无星图`
- 标题：`还没有可展示的精神星图。`
- 说明：`先完成剧场体验，再回来查看结果。`
- CTA：`回到剧场`

---

### 3.5.4 Hero 首屏

#### 页面结构

1. 原型中文名
2. 英文副标题
3. 一句本质摘要
4. 动作区

#### 固定动作

- `分享`
- `保存`
- `重新探索`

#### 动作区设计要求

- 视觉权重低于原型文本
- 不能抢走首屏主体
- 允许纵向堆叠

#### 动态字段来源

- 中文名：`archetype.name`
- 英文名：`archetype.english_name`
- 本质一句：`archetype.core_essence`

---

### 3.5.5 默认短结果流

默认只保留 3 段。

#### A. 本质

目标：给出当前结果的主线，不拉长。

固定标题：

- 标签：`本质`
- 标题：`这一刻`

内容结构：

1. 当前主线
2. 次级支撑

动态来源：

- 主线：得分最高的维度
- 次级支撑：得分第二高的维度

示例框架：

- `当前主线`
- `{最高维度标签} {score}%`
- `次级支撑：{第二维度标签} {score}%`

#### B. 结构

目标：给出前三股力量，而不是先给完整雷达图。

固定标题：

- 标签：`结构`
- 标题：`前三股力量`

内容结构：

1. 前三维微切换
2. 当前维度详情卡

动态来源：

- `seven_dimensions` 中得分最高的前三项
- 每项展示：
  - 标签
  - 分数
  - 简短 interpretation

完整结构图放进折叠区，不默认展开。

#### C. 此刻

目标：把张力和路径收成一条可带走的结论。

固定标题：

- 标签：`此刻`
- 标题：`先带走这一条`

内容结构：

1. 当前张力
2. 当前动作

动态来源：

- 当前张力：`core_tensions[0]`
- 当前动作：`growth_suggestions[0]`
- 当前动作点：`growth_suggestions[0].actionable_steps[0]`

---

### 3.5.6 折叠区

折叠入口统一文案：

- `继续阅读全部结果`

折叠区内容统一放这里：

1. 更多张力
2. 更多路径
3. 地形
4. 回响
5. 完整结构图

#### 更多张力

来源：

- `core_tensions[1...]`

每项展示：

- tension name
- tension description
- growth direction

#### 更多路径

来源：

- `growth_suggestions[1...]`

每项展示：

- title
- description
- actionable_steps

#### 地形

来源：

- `narrative_overview`

建议切成段落卡。

#### 回响

来源：

- `recommendations.books`
- `recommendations.films`
- `recommendations.music`

每一组展示：

- 名称
- 作者 / 导演 / 艺术家与专辑
- 推荐理由

---

### 3.5.7 `/constellation` 动态字段映射

| 界面位置 | 字段来源 | 说明 |
| --- | --- | --- |
| Hero 中文名 | `archetype.name` | 主视觉 |
| Hero 英文名 | `archetype.english_name` | 弱副标题 |
| Hero 本质一句 | `archetype.core_essence` | 首屏摘要 |
| 本质主线 | Top 1 dimension | 标签 + 分数 |
| 本质支撑 | Top 2 dimension | 标签 + 分数 |
| 结构前三维 | Top 3 dimensions | 微切换 |
| 结构短解释 | `dimension.interpretation` | 只取短版 |
| 此刻张力 | `core_tensions[0]` | 名称 + 简述 |
| 此刻动作 | `growth_suggestions[0]` | 标题 + 简述 + 一步行动 |
| 完整结构图 | `seven_dimensions` 全量 | 折叠区 |
| 地形 | `narrative_overview` | 折叠区 |
| 回响 | `recommendations` | 折叠区 |

#### 明确不展示的字段

- `generated_at`
- `constellation_id`
- runtime 相关信息
- 内部 support tone
- 调试提示

---

## 4. 主流程状态矩阵（Figma 出图最少集合）

如果要一次性把主流程画全，最少应有以下画板：

### `/`

1. `landing-idle`
2. `landing-pressing`
3. `landing-awakening`

### `/collect`

4. `collect-single-default`
5. `collect-single-selected`
6. `collect-multi-default`
7. `collect-distribution-default`
8. `collect-upload-empty`
9. `collect-upload-filled`
10. `collect-upload-error`
11. `collect-validation-error`

### `/processing/benyuan`

12. `processing-empty-part1`
13. `processing-running-part1`
14. `processing-retry-part1`
15. `processing-empty-constellation`
16. `processing-running-constellation`
17. `processing-retry-constellation`

### `/theater`

18. `theater-loading`
19. `theater-empty`
20. `theater-act1-collapsed`
21. `theater-act1-expanded`
22. `theater-act2`
23. `theater-act3`
24. `theater-epilogue`

### `/constellation`

25. `constellation-loading`
26. `constellation-empty`
27. `constellation-hero`
28. `constellation-short-flow`
29. `constellation-foldout-expanded`

---

## 5. 组件清单（Figma 组件库最小集合）

建议先做这批组件，再拼页面：

1. `Top Shell / Back + Thin Progress`
2. `Micro Switch / A-B-C`
3. `Stage Card / Hero`
4. `Option Card / Default`
5. `Option Card / Selected`
6. `Option Card / Disabled`
7. `Upload Stage / Empty`
8. `Upload Thumbnail`
9. `Bottom CTA / Primary`
10. `Bottom CTA / Secondary`
11. `Passive State / Loading`
12. `Passive State / Empty`
13. `Passive State / Retry`
14. `Result Section / Header`
15. `Dimension Chip / Active`
16. `Dimension Chip / Default`
17. `Foldout / Collapsed`
18. `Foldout / Expanded`

---

## 6. 设计中必须避免的内容回流

以下内容即使产品里仍存在，也不能回流到主路径设计稿：

- 开发进度
- 测试包
- demo 入口
- freeze route
- runtime/provider/model/base_url
- trait_signal
- hover/hesitation
- request id
- benchmark / shell 状态
- internal note
- 工程式阶段卡
- 网站导航

---

## 7. Appendix A：`/collect` 题库完整清单

本节用于 Figma 在需要逐题设计或做示例填充时直接使用。

### 模块 A：审美

#### A1 `A1_core_image`

- 题型：single
- 标题：`A1. 核心意象`
- 题目：`闭上眼睛，想象一个让你感到“这就是我”的画面。它可能是……`
- 选项数：7
- 选项：
  1. `🌌 无边际的星空与大海交界`
  2. `🏔️ 孤独的雪山之巅`
  3. `🌿 被藤蔓包围的古老图书馆`
  4. `🔥 燃烧的森林与新生的绿芽`
  5. `🏡 温暖灯光的小屋，窗外是雨夜`
  6. `🎭 空无一人的剧场舞台`
  7. `🌫️ 迷雾中若隐若现的小径`

#### A2 `A2_music_analysis`

- 题型：upload
- 标题：`A2. 音乐偏好`
- 题目：`上传你最近常听的歌单截图（网易云 / QQ 音乐 / Spotify 等）。我们会分析你的音乐品味，但不会保存或分享你的数据。`
- 帮助文字：`上传 1-3 张歌单截图，后续多模态分析会自动识别歌曲、艺术家、流派和情绪标签。`
- 上传范围：`1-3`

#### A3 `A3_literature`

- 题型：multi
- 标题：`A3. 文学共鸣`
- 题目：`以下哪些作家 / 作品，曾让你产生强烈共鸣？（多选，至少选 2 个）`
- 最少选择：`2`
- 选项数：10
- 选项：
  1. `卡夫卡《变形记》`
  2. `加缪《局外人》`
  3. `村上春树《挪威的森林》`
  4. `博尔赫斯《小径分岔的花园》`
  5. `弗吉尼亚·伍尔夫《到灯塔去》`
  6. `马尔克斯《百年孤独》`
  7. `陀思妥耶夫斯基《罪与罚》`
  8. `黑塞《悉达多》`
  9. `卡尔维诺《看不见的城市》`
  10. `三岛由纪夫《金阁寺》`

#### A4 `A4_cinema`

- 题型：single
- 标题：`A4. 电影美学`
- 题目：`哪位导演的电影，最接近你内心的“美”？（单选）`
- 选项数：8
- 选项：
  1. `安德烈·塔可夫斯基《镜子》`
  2. `大卫·林奇《穆赫兰道》`
  3. `王家卫《花样年华》`
  4. `韦斯·安德森《布达佩斯大饭店》`
  5. `特伦斯·马力克《生命之树》`
  6. `阿巴斯《樱桃的滋味》`
  7. `克里斯托弗·诺兰《星际穿越》`
  8. `是枝裕和《小偷家族》`

#### A5 `A5_inspiration_scene`

- 题型：single
- 标题：`A5. 灵感场景`
- 题目：`你最容易产生灵感或深刻思考的场景是？（单选）`
- 选项数：7
- 选项：
  1. `深夜的图书馆或书房`
  2. `行驶的列车或飞机上`
  3. `清晨的公园或山林`
  4. `喧闹的咖啡馆`
  5. `深夜的街道或城市`
  6. `洗澡或游泳时`
  7. `音乐会或剧场中`

### 模块 B：哲思

#### B1 `B1_night_thoughts`

- 题型：single
- 标题：`B1. 深夜思考`
- 题目：`深夜无法入睡时，你的脑海中最常出现的是……（单选）`
- 选项数：7
- 选项：
  1. `“我是谁？我为何存在？”`
  2. `“我做的选择对吗？如果当初……”`
  3. `“明天 / 未来会怎样？”`
  4. `某个具体的人或关系`
  5. `创意、灵感、想做的事`
  6. `宇宙、时间、生命的意义`
  7. `很少深夜思考，通常很快入睡`

#### B2 `B2_decision_style`

- 题型：single
- 标题：`B2. 决策风格`
- 题目：`面对重要决定时，你更倾向于……（单选）`
- 选项数：6
- 选项：
  1. `列出所有利弊，理性分析`
  2. `相信直觉和第一感觉`
  3. `咨询他人意见，寻求共识`
  4. `拖延到最后一刻，被迫选择`
  5. `快速决定，然后全力以赴`
  6. `寻找“完美”选项，很难下决定`

#### B3 `B3_emotion_pattern`

- 题型：single
- 标题：`B3. 情绪模式`
- 题目：`用一个意象来形容你的情绪模式……（单选）`
- 选项数：7
- 选项：
  1. `平静的湖面，偶尔涟漪`
  2. `深海的暗流，表面平静`
  3. `突然的暴风雨，来去匆匆`
  4. `持续的阴雨天`
  5. `火山，长期积累后爆发`
  6. `多变的天气，难以预测`
  7. `灿烂的阳光，偶有乌云`

#### B4 `B4_time_philosophy`

- 题型：distribution
- 标题：`B4. 时间哲学`
- 题目：`如果用百分比分配，你的注意力在……（拖动分配，总和 100%）`
- 维度：
  - `过去`
  - `现在`
  - `未来`
- 帮助文字：`三个滑块总和必须等于 100%。`

#### B5 `B5_relationship_philosophy`

- 题型：single
- 标题：`B5. 关系哲学`
- 题目：`你理想的社交状态是……（单选）`
- 选项数：6
- 选项：
  1. `大部分时间独处，偶尔高质量社交`
  2. `有 2-3 个深度连接的人就够了`
  3. `喜欢热闹，享受群体活动`
  4. `需要一个人完全理解我`
  5. `保持距离，不想被过度了解`
  6. `在不同圈子扮演不同角色`

### 模块 C：叙事

#### C1 `C1_social_posts_analysis`

- 题型：upload
- 标题：`C1. 社交动态`
- 题目：`上传 1-3 张你最喜欢的社交动态截图（朋友圈、微博、小红书、备忘录等，任何记录你真实想法的内容）。`
- 帮助文字：`后续分析会识别文本情感、主题、表达风格、自我呈现与时间线索。`
- 上传范围：`1-3`

#### C2 `C2_precious_photo_analysis`

- 题型：upload
- 标题：`C2. 珍贵照片`
- 题目：`上传一张对你来说最特别的照片（可以是风景、人物、物品，任何承载重要意义的影像）。`
- 帮助文字：`后续分析会抽取视觉内容、构图、光线、色彩与象征元素。`
- 上传范围：`1`

#### C3 `C3_resonance_moments`

- 题型：multi
- 标题：`C3. 共鸣时刻`
- 题目：`哪些时刻，你会感到强烈的“被理解”或“找到共鸣”？（多选）`
- 最少选择：`1`
- 选项数：7
- 选项：
  1. `深夜独自听歌时`
  2. `读到某句话产生强烈共鸣时`
  3. `与某人深度对话后`
  4. `看到某个场景或画面时`
  5. `独自旅行或行走时`
  6. `创作或表达时`
  7. `很少有这种感觉`

---

## 8. Appendix B：`/theater` 与 `/constellation` 字段字典

### 8.1 Theater 字段

#### `TheaterScript`

- `act1.scene_description`
  - 第一幕主场景文案
  - 主页面使用
- `act1.visual_prompt`
  - 仅供生成，不展示
- `act1.ambient_sound`
  - 不展示
- `act1.duration`
  - 不展示

- `act2.choices[].scene`
  - 第二幕每一步场景句
  - 用作当前标题
- `act2.choices[].options[].text`
  - 第二幕选项文本
- `act2.choices[].options[].trait_signal`
  - 不展示
- `act2.choices[].options[].response`
  - 不展示

- `act3.mirror_questions[].question`
  - 第三幕问题主句
- `act3.mirror_questions[].options[].text`
  - 第三幕选项文本
- `act3.mirror_questions[].options[].trait_signal`
  - 不展示
- `act3.mirror_final_words`
  - 第三幕镜像提示的来源，只取极短一句

- `epilogue.scene_description`
  - 尾声过渡句 1
- `epilogue.closing_text`
  - 尾声过渡句 2
- `epilogue.transition_prompt`
  - 不展示
- `epilogue.transition_animation`
  - 不展示

### 8.2 Constellation 字段

#### `PsycheConstellation`

- `archetype.name`
  - Hero 中文名
- `archetype.english_name`
  - Hero 英文副标题
- `archetype.core_essence`
  - Hero 本质一句
- `archetype.visual_prompt`
  - 不直接展示

- `seven_dimensions`
  - 结构数据来源
  - 默认只展示前三维
- `narrative_overview`
  - 地形段落
  - 默认折叠
- `core_tensions`
  - 当前张力 + 更多张力
- `growth_suggestions`
  - 当前动作 + 更多路径
- `recommendations.books`
  - 书籍推荐
- `recommendations.films`
  - 电影推荐
- `recommendations.music`
  - 音乐推荐

---

## 9. Appendix C：Figma 出图顺序建议

建议按下面顺序画，效率最高：

1. 先做全局组件：
   - Top Shell
   - CTA
   - Option Card
   - Passive State
2. 再画 `/collect`
3. 再画 `/processing/benyuan`
4. 再画 `/theater`
5. 最后画 `/constellation`

这样做的原因：

- `/collect` 决定输入组件语言
- `/processing` 决定被动态语言
- `/theater` 决定沉浸内容页语言
- `/constellation` 决定阅读结果页语言

---

## 10. 交付给前端时的建议

设计稿交付前，建议你在 Figma 中把这些内容都明确标出来：

1. 哪些是固定文案
2. 哪些是动态字段
3. 哪些是可折叠内容
4. 哪些状态是互斥状态
5. 哪些内容严格禁止进入主路径

最关键的是：主流程不是把所有信息摆出来，而是把“当前必须面对的内容”放到屏幕中央。
