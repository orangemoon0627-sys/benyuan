# 本源 Pilot Feedback Log（2026-03-14）

## 1. 当前来源

- `pilot-session-01`：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-01.md`
- `pilot-session-02`：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-02.md`
- `pilot-session-03`：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-03.md`

当前 `session 01` 为 operator dry run，`session 02` 为真实自测走查；目前仍没有达到“外部有效引导式 session”的计数门槛。

## 2. 汇总面板

- blocker：`0`
- major：`1 open`
- minor：`1 open / 2 resolved`
- nice-to-have：`0`
- 有效引导式 session：`0 / 2 required`

## 3. 问题总表

| id | 来源 | 类别 | 页面 / 场景 | 复现方式 | 影响级别 | 归属 | 状态 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PF-001 | `pilot-session-01` | 页面体验 | `/collect` runtime 状态展示 | 打开 `/collect`，页面上方 runtime 卡与底部 Agent Runtime 卡同时出现不同措辞 | `minor` | `status/docs` | `resolved` | 已统一为同一套 runtime 口径，并将手动 provider/base url/api key 调试入口折叠为“高级调试设置”；2026-03-14 回归通过。 |
| PF-002 | `pilot-session-02` | 稳定性 | `/lab/status`、`/lab/native-handoff`、`/lab/native-handoff/smoke` | 在 `npm run dev` 环境下打开内部状态页，控制台出现 React hydration mismatch；页面随后客户端重建恢复 | `minor` | `status/docs` | `resolved` | 已收口 internal lab 页 dev hydration 噪音：`native-handoff` 改为稳定快照读取，`status` 时间格式固定时区，`native-handoff/smoke` 改为挂载后再读取 shell bridge；2026-03-14 Playwright dev console 复核为 0 error。 |
| PF-003 | `pilot-session-02` | 页面体验 | `/collect` | 做完 A 组最后一题后停留在当前组，不会明确带用户进入下一组 | `minor` | `Part 1` | `resolved` | 2026-04-20 已收口为单题沉浸页承接：完成当前组后自动聚焦下一可行动模块，底部主 CTA 也会切成“进入 B / C / 进入剧场”，不再要求用户自行理解流程。 |
| PF-004 | `pilot-session-02` | 结果表达 | B 组剧场页、B 组结果页 | 页面正常打开，但文案与整体呈现“不够文艺”，诗性和仪式感不足 | `major` | `Part 3` | `resolved` | 2026-04-20 已收口剧场与星图默认阅读：去掉主流程工作台信息，保留单焦点沉浸式版式，并将结果页压成首屏 + 短结果流 + 折叠补充区，整体气质已转向产品态而非报告态。 |

## 4. 分类视图

### 结果表达

- `PF-004`：B 组表达不够文艺，诗性和仪式感不足（已修复）

### 页面体验

- `PF-001`：`/collect` runtime 口径不统一（已修复）
- `PF-003`：A 组做完后不会明确承接到下一组（已修复）

### 稳定性

- `PF-002`：内部状态页在 dev 下出现 hydration mismatch（已修复）

### iOS / shell

- 暂无记录

## 5. 当前判断

- 当前没有 blocker
- 当前已有 1 场真实自测反馈，但仍没有达到外部有效 session 门槛
- 当前技术层、页面层、shell 层回归均已重新通过；剩余动作主要是继续收集真实外部反馈与补齐 release/TestFlight 资料
- 在 `session 02` 和 `session 03` 完成前，不进入 Part 3 打磨
