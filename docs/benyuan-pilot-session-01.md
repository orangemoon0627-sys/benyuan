# 本源 Pilot Session 01（Operator Dry Run）

## 1. 基本信息

- session id：`pilot-session-01`
- 日期：`2026-03-14`
- 类型：`operator-dry-run`
- 参与者：`internal operator`
- 主持人：`Codex`
- 环境：`mac / browser`
- base URL：`http://127.0.0.1:3015`
- freeze：`beta-2026-03-11-r2`
- 目的：在正式引导式内测前，确认 handoff 包、状态页、A/B/C demo route 与关键自动化都处于可展示状态。

## 2. 已执行事实

### 自动化预检

- `npm run build`：通过
- `npm run smoke:benyuan:golden`：通过
  - 结果：`/Users/fanhao/Documents/Playground/output/benyuan-golden-audit.json`
  - 摘要：`8 / 8` passed
- `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:regression`：通过
  - 结果：`/Users/fanhao/Documents/Playground/output/benyuan-ios-regression.json`
  - 摘要：`18 / 18` passed
  - generatedAt：`2026-03-14T08:24:52.082Z`
- `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run ios:shell:native-smoke`：通过
  - 结果：`/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke.json`
  - device：`iPhone 17`
  - generatedAt：`2026-03-14T08:25:23.977Z`

### 页面 / 路由预检

- 以下 route 均返回 `HTTP 200`：
  - `/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf`
  - `/constellation?constellation_id=const_noogky5i`
  - `/theater?part1_id=part1_b0gtt7ez&theater_script_id=theater_p04f5cyf`
  - `/constellation?constellation_id=const_8bctm6xu`
  - `/theater?part1_id=part1_e9r3lhca&theater_script_id=theater_wawfzaja`
  - `/constellation?constellation_id=const_c3px9v98`
  - `/lab/status`
  - `/lab/native-handoff`
- Playwright 可视检查已确认以下页面可打开且内容已渲染：
  - `/collect`
  - `/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf`
  - `/constellation?constellation_id=const_noogky5i`
  - `/lab/status`
  - `/lab/native-handoff`
- `A` 路线 theater 页面控制台错误检查：`0` 条 error

## 3. 关键观察

### `/collect`

- 顶部“当前态势”卡显示：`Runtime · crs · responses · fallback ready`
- 同页“分析入口 / Agent Runtime”显示：`crs · gpt-5.4 · responses · live requested`
- 这代表页面同时暴露了两套 runtime 语义：一套偏“当前可兜底态”，一套偏“分析入口请求态”
- 后续修复：2026-03-14 已统一 runtime 口径，并将手动 provider / base url / api key 入口折叠到“高级调试设置”

### `/lab/status`

- pilot 判断显示：`可继续推进 pilot`
- 真机进度显示：`10/10`
- benchmark / golden / iOS regression / native smoke 均可见

### `/lab/native-handoff`

- 真机验收下一步模块显示：`可继续推进 pilot`
- acceptance board、real-device record、pilot handoff 路径均可见
- collect A/C 快捷入口可见

## 4. 反馈记录

| 类别 | 页面 / 场景 | 复现方式 | 影响级别 | 归属 | 记录 |
| --- | --- | --- | --- | --- | --- |
| 页面体验 | `/collect` runtime 状态展示 | 打开 `/collect`，比较“当前态势”和“分析入口 / Agent Runtime”两块 runtime 文案 | `minor` | `status/docs` | 该问题已在同日修复：runtime 文案改为同一口径，常驻调试表单改为折叠式高级设置。 |

## 5. 会后结论

- 结论：`conditional`
- 是否达到“有效 session”：`no`
- 是否出现 blocker：`no`
- 说明：当前只完成了 operator dry run，说明 handoff 包与演示链路可用，但还没有完成至少 2 场真实引导式 session。
- 下一步：
  - 用同一模板执行 `pilot-session-02` 与 `pilot-session-03`
  - 继续记录真实参与者反馈，再决定是否进入 Part 3 打磨
