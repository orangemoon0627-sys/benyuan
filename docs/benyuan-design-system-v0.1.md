# 「本源」Design System v0.1

由于本机 `ui-ux-pro-max` skill 的脚本路径异常，本文件按该 skill 的设计原则手动整理。

## Visual Direction

- 产品类型：self-exploration web app
- 风格方向：poetic minimalism + nocturnal editorial
- 目标感受：安静、被理解、略有神秘感，但不玄

## Core Design Decisions

- 不走亮白心理测试 UI，而走深色夜读质感
- 用编辑感大标题 + 克制卡片系统，而不是 dashboard 风格表格
- 通过暖琥珀、旧玫瑰、暗松绿做气氛层次，不用常见紫色 AI 配色
- 强调结果页的“截图价值”与段落可读性

## Color Tokens

- background: `#0a0d10`
- background-soft: `#151a1f`
- ink: `#f4eee8`
- muted: `#b7aca1`
- amber: `#d9b98d`
- rose: `#8f5f67`
- sage: `#6f8c7a`

## Typography

- Heading stack: `Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, `Georgia`, `serif`
- Body stack: `Avenir Next`, `Segoe UI`, `sans-serif`

## Interaction Rules

- 最小可点击区域：44px
- 所有主要按钮保留清晰 focus/hover 状态
- loading 态不出现“算分”，而出现“整理线索”类文案

## Layout Rules

- 页面最大宽度 72rem-80rem
- 长文本宽度控制，避免通栏阅读疲劳
- 结果页区块化，每个 section 可独立截图

## Anti-Patterns

- 不用紫白 SaaS 默认感
- 不用过亮渐变和浮夸玻璃拟态
- 不用 MBTI 式彩色雷达图首屏
- 不把主 CTA 做成游戏化过强的按钮
