# 本源 Guided Pilot Runbook（2026-03-14）

## 目的

这份 runbook 只服务两件事：

- 执行 `pilot-session-02`
- 执行 `pilot-session-03`

它不要求现场重新跑完整 live 链路；默认使用 freeze 结果页和状态面板做受控演示。

## 演示前准备

### Web 环境

在项目根目录启动：

```bash
cd /Users/fanhao/Documents/Playground
npm run dev -- --hostname 0.0.0.0 --port 3015
```

### 默认基线

- freeze：`beta-2026-03-11-r2`
- handoff：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-handoff-2026-03-14.md`
- feedback log：`/Users/fanhao/Documents/Playground/docs/benyuan-pilot-feedback-log-2026-03-14.md`
- 状态面板：`http://127.0.0.1:3015/lab/status`
- native handoff：`http://127.0.0.1:3015/lab/native-handoff`

### iPhone shell 启动策略

- 模拟器 / 本机浏览器默认走：`http://127.0.0.1:3015`
- 真机需要时，临时传入：
  - `--benyuan-base-url http://<当前LAN地址>:3015`
- shell 现在会记住最后一次成功的 base URL；同一网络下重开 app 不需要重复写死 LAN

## 每场 session 固定顺序

### Step 1：入口说明（1-2 分钟）

打开：`/collect`

讲解重点：

- 这是本源当前的主入口
- A / B / C 已经并到同一条主链路
- 现在演示默认不依赖现场重新跑完整 live 分析
- 今天主要看结果表达、阅读体验、产品可信度

记录重点：

- 参与者是否能快速理解入口用途
- 是否对 runtime / 测试包 / demo 入口感到混乱

### Step 2：A/B/C freeze demo（主段）

按这个顺序走：

1. A theater
2. A constellation
3. B theater
4. B constellation
5. C theater
6. C constellation

建议只抓这几个问题问参与者：

- 你能否明显感觉出 A / B / C 是不同的人格结果？
- 哪一页最容易读？哪一页最难读？
- 结果有没有“像在说你”，还是更像模板？
- 如果要给别人看，你最愿意分享哪一部分？

记录重点：

- archetype 是否分化明显
- narrative 是否空泛或重复
- 维度 / 张力 / 建议 / 推荐 哪块最弱
- 哪个页面最“网页感”或最“不像产品完成态”

### Step 3：状态可信度展示

打开：`/lab/status`

讲解重点：

- 当前 freeze
- 当前 benchmark / golden / iOS readiness
- 当前 pilot readiness

只回答事实，不做额外扩展承诺。

记录重点：

- 参与者是否因为状态面板增强对产品可信度的判断
- 是否觉得信息过载

### Step 4：壳层闭环展示

打开：`/lab/native-handoff`

讲解重点：

- 当前 app 是 Web 主流程 + iOS shell
- 真机相机 / 相册 / allow-deny-cancel / resume 已补齐
- 当前阶段不做 native rewrite

记录重点：

- 参与者是否接受当前 shell 形态
- 是否明确指出“网页感”问题
- 是否把“不是全原生”视为 blocker

### Step 5：如被要求，再演示实时链路

只有参与者明确要求时，才额外演示：

- `/collect`
- `/processing/benyuan`
- 后续跳转

注意：

- 这不是 session 成功的必要条件
- 若现场 provider 抖动，只记录，不临场改代码

## 每场必须记录的内容

直接写入对应 session 文件：

- 参与者 / 角色
- 环境（browser / simulator / iphone）
- 是否完整走完固定顺序
- 每条问题的：
  - 页面 / 场景
  - 复现方式
  - 影响级别：`blocker` / `major` / `minor` / `nice-to-have`
  - 归属：`Part 1` / `Part 2` / `Part 3` / `iOS shell` / `status/docs`
- 本场结论：`continue` / `conditional` / `blocked`

## 这轮不该现场做的事

- 不现场改 API
- 不现场改 benchmark / storage / bridge contract
- 不现场切原生页面
- 不现场做大 UI 重构
- 不为了演示效果临时改 prompt 或 schema

如果发现问题：

- 先记进 session record
- 再汇总进 feedback log
- blocker 单独拉下一轮修复计划

## Session 结束后的回写顺序

1. 更新 `docs/benyuan-pilot-session-02.md` 或 `docs/benyuan-pilot-session-03.md`
2. 更新 `docs/benyuan-pilot-feedback-log-2026-03-14.md`
3. 视结果更新 `docs/benyuan-pilot-summary-2026-03-14.md`

## 判定规则

- 至少完成 2 场有效 guided session，才允许判断是否进入 Part 3 打磨
- 如果只有 minor / major，没有 blocker：保持 `conditional` 或升级 `continue`
- 如果出现 blocker：summary 改为 `blocked`，下一轮只修 blocker
