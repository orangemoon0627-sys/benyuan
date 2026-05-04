# 本源 Generative Cosmic UI PRD

> 版本：vNext · Generative Cosmic Edition
> 日期：2026-04-25
> 范围：主流程 `/collect → /processing/benyuan → /theater → /constellation`
> 原则：不改功能、不改 API、不改 schema，只重构视觉语言、信息层级、交互手感与状态表达。

---

## 1. 设计定位

本源不再沿用旧版“黑金哲学卡片 / 工作台式流程 / PRD 面板感”的表达。新版以“从黑洞升空进入太空”为核心隐喻，把用户的回答、等待、选择与结果呈现为一段从事件视界中生成自我的旅程。

### 核心体验

用户不应感觉自己在填写测试表，也不应感觉自己在操作一个分析工具。用户应感觉自己正在进入一个被实时生成的精神宇宙：问题像引力场，选择像轨道偏转，等待像物质显影，结果像星图成形。

### 关键词

- 生成式 UI
- 黑洞升空
- 深空星云
- 银白月光
- 香槟金微光
- 深紫黑星尘
- 暗紫星云
- 后现代主义
- 原生 iOS onboarding
- 单焦点沉浸
- 情绪化空间

### 必须摆脱的旧表达

- 不再是纯黑金奢华风
- 不再是哲学舞台卡片堆叠
- 不再是工作台 / 控制台 / debug 面板
- 不再用大量说明文案解释用户正在做什么
- 不再把页面做成网站导航或 SaaS 流程页

---

## 2. 功能边界

### 不变

- API 路由与返回结构不变
- Part 1 / Part 2 / Part 3 schema 不变
- storage key / pending key / session key 不变
- native bridge message 不变：`share`、`openExternal`、`pickImages`
- Web 主流程 + WKWebView iOS shell 架构不变
- 题目语义、选项语义、结果字段能力不变

### 允许变化

- 页面布局
- 默认显示内容
- 文案语气
- 视觉 token
- 共享 UI primitives
- loading / empty / retry / fallback 的视觉骨架
- 主流程页面是否显示某些辅助字段

### 禁止回流

主产品流程不显示：

- runtime / provider / model
- request id
- debug 控制
- demo / test pack
- 开发进度
- 采样解释
- hover / hesitation / trait signal
- benchmark / freeze / internal status

这些内容只允许存在于 lab、debug query 或内部工具页。

---

## 3. 新视觉概念：Event Horizon Ascension

新版本源的视觉不是“黑底加金字”，而是一个从黑洞事件视界向上升空的生成场。

### 视觉叙事

1. `/collect`：事件视界
   用户面对第一个引力问题。回答不是选择按钮，而是让自己靠近某条轨道。

2. `/processing/benyuan`：物质显影
   用户的线索被吸入、压缩、升空，形成可见结构。

3. `/theater`：轨道偏转
   剧场不是说明页，而是一个生成场景。用户每次选择都像一次轨道偏转。

4. `/constellation`：星图成形
   结果不是报告，而是一个短结果流。原型先显形，完整解释默认折叠。

### 空间语言

- 主要视觉从页面底部或中下部升起，形成“从深处向上”的动势。
- 背景不是平面渐变，而是由引力环、星尘、淡紫星云、银白光柱组成的生成场。
- 卡片不再是主角；卡片只是漂浮在生成场上的信息容器。
- 选项与按钮具有物质感：月光玻璃、液态金属、柔和折射、轻微发光。

---

## 4. 色彩系统

新版保留本源的黑 / 金 / 灰基础，但引入银白与淡紫星云，避免旧黑金的陈旧感。

```css
:root {
  --void-black: #030305;
  --singularity-black: #07070B;
  --graphite-glass: rgba(22, 22, 28, 0.62);
  --deep-space: #0D0D14;

  --starlight-white: #F7F4EC;
  --moon-silver: #D8D6DE;
  --mist-gray: #A8A4AE;
  --shadow-gray: #5F5B66;

  --champagne-gold: #E7C27A;
  --soft-gold: #BFA16A;
  --gold-haze: rgba(231, 194, 122, 0.32);

  --nebula-violet: #7F6AA8;
  --nebula-violet-dim: rgba(127, 106, 168, 0.22);
  --cosmic-lilac: #B9ADD8;
  --aubergine-black: #15111F;

  --glass-line: rgba(247, 244, 236, 0.16);
  --glass-fill: rgba(255, 255, 255, 0.055);
}
```

### 使用比例

- 60% 黑 / 深石墨 / 紫黑
- 20% 银白 / 月光灰
- 12% 暗紫星云
- 6% 香槟金
- 2% 高亮白光

### 色彩规则

- 金色不再是唯一强调色，只用于进度、关键命中状态和局部高光。
- 淡紫必须压深，融进黑色和银白光里；禁止出现塑料感、糖果感、亮紫按钮。
- 银白用于现代感和原生感，承担主 CTA 的高级质感。
- 主 CTA 不使用红色；默认使用月白到银白，再带一点香槟金内光。
- 背景必须有深度：至少包含径向光、噪声、星尘或引力环的一种。

### 禁止色彩问题

- 红色 CTA
- 高饱和紫色按钮
- 纯黑金老派奢华
- 大面积蓝紫霓虹
- 亮紫塑料渐变
- 多彩赛博朋克

---

## 5. 字体与排版

### 字体策略

主流程全部放弃 serif 主标题。新版使用粗无衬线，形成更现代、更原生、更具压屏感的界面。

```css
--font-display: "SF Pro Display", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: "SF Pro Text", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "SF Mono", "JetBrains Mono", monospace;
```

### 字号建议

- Hero 问题：44-56px，700-800
- 页面主句：36-48px，700-800
- 卡片标题：16-20px，600-700
- 正文说明：14-16px，400-500
- 元信息：11-12px，500，字距 0.08em

### 排版规则

- 一屏只能有一个真正的大标题。
- 大标题允许断行，甚至应主动断行制造压迫感。
- 说明文案控制在 1-2 行。
- 不用长段落解释功能。
- 中文文案要短，英文只作为气质标签，不承担理解成本。

---

## 6. Generative UI 规则

生成式 UI 不是“随机背景图”，而是让界面看起来像由用户数据和流程状态实时生成。

### 必须具备

- 生成场：背景由星云、粒子、引力环、光柱、星图线构成。
- 状态映射：进度、阶段、选择状态影响视觉强度。
- 非对称构图：不要所有页面都是居中卡片。
- 流体深度：使用 blur、mask、radial-gradient、conic-gradient、noise。
- 物质感控件：按钮像发光物体，不像网页按钮。
- 紫色要像黑暗中的星云密度，而不是界面涂层。
- 每个屏幕背景要有“从深处升起”的方向性，避免静态壁纸感。

### 不允许

- 只有普通卡片和普通按钮
- 纯黑金老派奢华
- 彩色 cyberpunk neon
- 科幻 dashboard
- 复杂图表占主视觉
- 背景与内容完全无关

### 推荐 CSS 实现

- 多层 `radial-gradient`
- `conic-gradient` 做引力环
- `mask-image` 做边缘消隐
- `backdrop-filter: blur(24px)`
- 伪元素生成星尘
- 少量 canvas / SVG 生成 constellation field
- 页面进入时使用 600-900ms 慢显影动画

---

## 7. 共享组件需求

### 7.1 `GenerativeAppShell`

主流程四页统一壳层。

必须包含：

- iOS safe area
- 顶部返回
- 2px 细进度线
- 当前阶段弱标记
- 背景生成场插槽
- 页面内容插槽
- 底部 CTA 安全区

不包含：

- 网站导航
- lab 入口
- 页面大标题栏
- 状态摘要条

### 7.2 `CosmicField`

背景生成场组件。

输入：

- `phase`: `collect | processing | theater | constellation`
- `progress`: 0-1
- `intensity`: `quiet | active | radiant`

表现：

- collect：黑洞事件视界从底部升起
- processing：银白光柱从黑洞中心向上
- theater：空间打开为舞台 / 轨道门
- constellation：星图节点连接成精神地图

### 7.3 `LuminousCTA`

底部主按钮。

特征：

- 56-64px 高
- pill 圆角
- 月白 / 银白 / 香槟金内光渐变
- 黑色文字
- 按压时轻微缩放与光晕收缩
- 禁止红色按钮和饱和紫色按钮

### 7.4 `MatterOption`

选项卡。

特征：

- 28-32px 圆角
- 半透明玻璃
- 左侧或右侧生成式 glyph
- 选中态产生银白 / 淡紫 / 金色折射边缘
- 不显示技术解释

### 7.5 `PassiveState`

loading / empty / retry / fallback 共用被动态。

结构：

- 中央生成物体
- 一个短标题
- 一句说明
- 一条进度或一个 CTA

禁止：

- 多块信息卡
- 工程错误说明
- 复杂步骤列表

---

## 8. 页面 PRD

## 8.1 `/collect`

### 页面目标

让用户只面对当前问题。页面不再表达“模块、工作流、状态板”，而表达“一个问题正在形成你的轨道”。

### 默认可见结构

1. 顶部返回 + 细进度
2. 极轻量 A / B / C 微切换
3. 当前题目主舞台
4. 当前输入或选项
5. 底部：上一题 + 主 CTA

### 内容规则

- 题号放进舞台内部，弱化为小字。
- 模块归属只允许出现为 A / B / C 微切换。
- 辅助提示最多一行。
- 校验错误只在用户尝试继续时出现。

### 单选 / 多选

选项卡应像漂浮物体：

- 大圆角
- 强纵向间距
- 选中后边缘出现淡紫银光和微金核心
- 多选使用多个发光节点，而不是 checkbox 工具感

### 文本输入

输入框不再像表单：

- 作为一个“问题容器”浮在黑洞上方
- placeholder 短句化
- 输入光标可使用淡紫 / 银白

### 上传题

上传题是“素材进入事件视界”。

默认结构：

- 一个主上传入口
- 相册 / 拍照作为同层弱动作
- 一行数量提示
- 横向缩略图轨道

不显示：

- 素材状态块
- 工具面板说明
- 文件格式长说明
- debug 上传状态

### CTA 文案

- 下一题：继续
- 下一模块：进入下一层
- 进入剧场：进入剧场
- 上一题：返回

---

## 8.2 `/processing/benyuan`

### 页面目标

等待页不是进度页，而是显影仪式。用户只需要知道：正在发生、发生到哪里、如果失败能恢复。

### 默认结构

1. 顶部返回 + 细进度
2. 中央黑洞 / 光柱 / 星尘生成物
3. 阶段名
4. 一句短说明
5. 单条进度轨

### 阶段文案

- 收束特征
- 解析线索
- 构建剧场
- 剧场就绪
- 记录选择
- 精神显影
- 星图成形

### 状态规则

真实处理中：

- 只展示当前阶段，不展示完整阶段列表。
- 只展示一条进度，不展示预计剩余时间。

空任务：

- 标题：还没有可显影的线索
- CTA：回到问题

失败重试：

- 标题：显影被中断
- 说明：线索仍在，可以重新进入。
- CTA：重新显影
- 次动作：回到问题

route fallback：

- 使用同一 `PassiveState`，不出现 `SectionTitle` 式说明卡。

---

## 8.3 `/theater`

### 页面目标

剧场是一次轨道选择，不是问卷第二部分。用户只需要看到场景、选择和继续。

### 全局结构

- 顶部返回 + 细进度
- 当前幕内容
- 单一主 CTA 或选项确认
- 不显示 telemetry / trait / hover / hesitation

### 第一幕：场景

只显示：

- 场景主句
- 一个极弱“展开场景”入口
- 继续 CTA

不显示：

- 幕标题大栏
- 时长
- 步骤轨道
- 解释性标签

### 第二幕：选择

只显示：

- 当前场景短句
- 选项卡
- 主 CTA

选项语言：

- 靠近某种方向
- 不解释内部采样
- 不显示 trait signal

### 第三幕：镜像

结构：

- 问题
- 极短镜像句
- 选项

镜像句限制：

- 最多 2 行
- 不做心理学诊断
- 不出现“你应该”

### 尾声

只显示：

- 一句结束语
- 一句过渡
- 进入星图 CTA

---

## 8.4 `/constellation`

### 页面目标

结果页不是报告，而是一张刚刚成形的星图。首屏完成身份命中，后续只给短结果流。

### 首屏结构

1. 顶部返回 + 完成进度
2. 生成式星图 / 核心节点
3. 原型中文名
4. 英文副标题
5. 一句本质摘要
6. 弱动作区：分享 / 保存 / 重新探索

### 默认正文

只展开三段：

1. 本质
2. 结构
3. 此刻

### 本质

只显示：

- 一个主线判断
- 一个次级支撑

不恢复四宫格摘要。

### 结构

只显示：

- 前三维微切换
- 一段短解释

完整七维图默认折叠。

### 此刻

合并张力与路径：

- 一条核心张力
- 一条可执行方向

避免恢复长报告。

### 折叠区

入口文案：

- 继续阅读全部星图

折叠内容：

- 完整结构图
- 其余张力
- 其余路径
- 地形
- 回响
- 推荐

---

## 9. Motion 需求

### 全局

- 页面进入：生成场先出现，内容随后浮现。
- 选项按压：物体轻微下沉，边缘光收缩。
- CTA 按压：按钮变短、亮度集中。
- 切页：不是网页跳转，而是空间推进。

### 页面 Motion

`/collect`：

- 星尘缓慢上升
- 选项进入时 80ms stagger

`/processing/benyuan`：

- 黑洞环持续旋转
- 进度光线沿轨道推进

`/theater`：

- 场景背景缓慢打开
- 选项像轨道物体进入

`/constellation`：

- 节点先亮起，再连线
- 结果文字延迟浮现

### 性能限制

- 移动端优先 60fps
- 避免大面积 JS 粒子计算
- 默认用 CSS / SVG，canvas 只用于轻量背景
- 尊重 `prefers-reduced-motion`

---

## 10. iOS 壳层适配

### 设计基准

主视觉基准按 iPhone 17 Pro Max 建立：

- 物理屏幕：6.9-inch Super Retina XDR
- 设备像素：2868 × 1320
- 设计画布：1320 × 2868 portrait
- 前端逻辑基准：约 440 × 956 CSS px 的 Pro Max 竖屏视口，并通过 `100dvh`、safe area 和响应式缩放适配其他设备

### 触控

- 所有可点区域至少 44px
- CTA 高度 56-64px
- 底部使用 `env(safe-area-inset-bottom)`

### 长按

- 非输入区域禁选词
- 可复制结果区显式允许选择

### 桥接动作

分享 / 保存 / 选图 / 拍照必须有视觉承接：

- 唤起前按钮有 pressed 反馈
- 回到 WebView 后页面状态不跳变
- 权限失败使用 `PassiveState` 或局部轻提示，不显示工程错误

---

## 11. 文案系统

### 语气

- 短
- 深
- 不解释功能
- 不像心理测试
- 不像报告
- 不命令用户

### 页面文案示例

`/collect`：

- 有什么一直在召唤你？
- 哪个答案更靠近你？
- 把这一瞬交给深处。

`/processing/benyuan`：

- 线索正在升空。
- 模式正在显影。
- 星图正在成形。

`/theater`：

- 你站在自己的剧场之前。
- 选择一条更接近你的轨道。
- 镜像已经出现。

`/constellation`：

- 你不是一个答案。
- 你是一组正在运动的星。
- 此刻，你的结构被照亮。

---

## 12. 视觉验收标准

### 必须达到

- 第一眼像原生 iOS app，不像网页。
- 第一眼有“黑洞升空 / 深空生成”的情绪。
- 主流程四页风格统一。
- 每页只有一个主焦点。
- 银白、淡紫、香槟金共同构成现代感，不回到旧纯黑金。
- 不出现开发感、工作台感、说明页感。

### 不通过

- 页面主要由普通黑色卡片构成。
- 金色占比过高，像旧奢侈品 UI。
- 淡紫变成大面积蓝紫 neon。
- 文案超过用户当前动作所需。
- 顶部 chrome 抢走注意力。
- 结果页默认像长报告。

---

## 13. 生成图基准

当前 image2 生成图保存路径：

- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-generative-cosmos-ui-v2-1.png`
- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-generative-cosmos-ui-v2-2.png`
- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-generative-cosmos-ui-v3-1.png`
- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-generative-cosmos-ui-v3-2.png`
- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-17pm-collect-generative-v4-1.png`
- `/Users/fanhao/Documents/Playground/output/imagegen/benyuan-17pm-collect-generative-v4-2.png`

建议实现基准：

- `v3-2`：最适合作为产品 UI 结构参考
- `v4-2 collect`：最适合作为 iPhone 17 Pro Max 单页比例、深紫黑融合、银白香槟 CTA 的参考
- `v2-1`：黑洞升空与电影感最强
- `v2-2`：淡紫星云与现代感更强

---

## 14. 实施顺序

1. 重建主流程视觉 token
2. 新建 `GenerativeAppShell`、`CosmicField`、`LuminousCTA`、`MatterOption`、`PassiveState`
3. 改 `/collect`
4. 改 `/processing/benyuan`
5. 改 `/theater`
6. 改 `/constellation`
7. 统一 empty / retry / route fallback
8. 跑自动化与 iPhone shell 回归

---

## 15. 自动化验收

固定跑：

```bash
npm run build
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:regression
BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:native-smoke
```

人工检查：

- `/collect` 默认题目态、上传态、校验阻断态
- `/processing/benyuan` 空态、真实处理中、失败重试
- `/theater` 第一幕、第二幕、第三幕、尾声、无脚本态
- `/constellation` 首屏、三段短结果、折叠区、无结果态
