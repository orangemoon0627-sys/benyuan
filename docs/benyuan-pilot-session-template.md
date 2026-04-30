# 本源 Pilot Session 模板

## 1. 基本信息

- session id：`pilot-session-xx`
- 日期：`YYYY-MM-DD`
- 类型：`guided` / `operator-dry-run`
- 参与者：`name / role`
- 主持人：`name`
- 环境：`mac` / `simulator` / `iphone`
- base URL：`http://127.0.0.1:3015` 或当次 LAN 地址
- freeze：`beta-2026-03-11-r2`
- handoff：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-handoff-2026-03-14.md`
- runbook：`/Users/fanhao/Documents/Playground/docs/benyuan-guided-pilot-runbook-2026-03-14.md`

## 2. 事实来源

- freeze 文档：`/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`
- 真机验收板：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`
- 状态面板：`http://127.0.0.1:3015/lab/status`
- native handoff：`http://127.0.0.1:3015/lab/native-handoff`

## 3. 演示路径

1. `/collect`
2. A demo：`/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf` → `/constellation?constellation_id=const_noogky5i`
3. B demo：`/theater?part1_id=part1_b0gtt7ez&theater_script_id=theater_p04f5cyf` → `/constellation?constellation_id=const_8bctm6xu`
4. C demo：`/theater?part1_id=part1_e9r3lhca&theater_script_id=theater_wawfzaja` → `/constellation?constellation_id=const_c3px9v98`
5. `/lab/status`
6. `/lab/native-handoff`
7. 如参与者要求，再额外演示 `/collect -> /processing/benyuan`

## 4. 预检清单

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| `/lab/status` 显示 ready | `pending` | |
| `/lab/native-handoff` 可打开 | `pending` | |
| 真机验收板为 `10/10` | `pending` | |
| freeze / benchmark / golden / iOS 信息可见 | `pending` | |
| A/B/C demo route 可打开 | `pending` | |

## 5. 反馈记录

| 类别 | 页面 / 场景 | 复现方式 | 影响级别 | 归属 | 记录 |
| --- | --- | --- | --- | --- | --- |
| 结果表达 |  |  | `minor` | `Part 3` |  |
| 页面体验 |  |  | `minor` | `Part 1` / `Part 2` / `Part 3` |  |
| 稳定性 |  |  | `minor` | `status/docs` |  |
| iOS / shell |  |  | `minor` | `iOS shell` |  |

## 6. 会后结论

- 结论：`continue` / `conditional` / `blocked`
- 是否达到“有效 session”：`yes` / `no`
- 是否出现 blocker：`yes` / `no`
- 下一步：
  - 
  - 
