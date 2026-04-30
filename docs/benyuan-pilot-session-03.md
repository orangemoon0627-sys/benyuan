# 本源 Pilot Session 03

## 1. 基本信息

- session id：`pilot-session-03`
- 日期：`pending`
- 类型：`guided` 或 `validation-only`
- 参与者：`pending`
- 主持人：`pending`
- 环境：`mac` 或 `iphone`
- base URL：`http://127.0.0.1:3015`（若真机则改为当次 LAN 地址）
- freeze：`beta-2026-03-11-r2`

## 2. 目标

- 如果前两场反馈仍在扩散：继续收集新问题
- 如果前两场反馈已高度收敛：只做复核，验证已知问题是否重复出现

## 3. 记录状态

- 当前状态：`pending live session`
- 尚未填写任何参与者反馈
- 这份记录默认作为复核场次使用；如果前两场反馈仍在扩散，再补新问题
- 执行后请回写：复现场景、影响级别、归属、是否重复于 session 01/02

## 4. 固定复核路径

1. `/collect`
2. A demo：`/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf` → `/constellation?constellation_id=const_noogky5i`
3. `/lab/status`
4. `/lab/native-handoff`
5. 如需验证实时链路，再额外演示 `/collect -> /processing/benyuan`

## 5. 反馈记录

| 是否重复 | 页面 / 场景 | 复现方式 | 影响级别 | 归属 | 记录 |
| --- | --- | --- | --- | --- | --- |
| `yes` / `no` |  |  | `minor` | `Part 1` / `Part 2` / `Part 3` / `iOS shell` / `status/docs` |  |

## 6. 会后结论

- 结论：`pending`
- 是否达到“有效 session”：`pending`
- 是否出现 blocker：`pending`
- 是否确认反馈已收敛：`pending`
