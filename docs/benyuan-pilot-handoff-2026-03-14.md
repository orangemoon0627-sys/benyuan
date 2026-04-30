# 本源 Pilot Handoff（2026-03-14）

## 1. 当前结论

- 当前 beta 基线：`beta-2026-03-11-r2`
- 当前 freeze 文档：`/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`
- 当前可信全量 benchmark：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json`
- 当前真机验收：`10 / 10` 完成
- 当前 pilot 判定：`ready`
- 当前 pilot execution 判定：`conditional`

本轮目标不是继续扩功能，而是把已经稳定的 beta 收成一份可复核、可演示、可交付的 pilot 包。

---

## 1.1 Pilot 执行记录

本轮引导式内测统一使用下面这组文档：

- session 模板：
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-template.md`
- guided pilot runbook：
  - `/Users/fanhao/Documents/Playground/docs/benyuan-guided-pilot-runbook-2026-03-14.md`
- session 记录：
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-01.md`
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-02.md`
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-session-03.md`
- feedback log：
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-feedback-log-2026-03-14.md`
- pilot summary：
  - `/Users/fanhao/Documents/Playground/docs/benyuan-pilot-summary-2026-03-14.md`

当前状态：

- `pilot-session-01` 已完成，类型为 `operator dry run`
- `pilot-session-02` 已完成，类型为 `真实自测走查`
- `pilot-session-03` 尚待真实引导式 session 回写
- 当前 summary 结论为 `conditional`，原因不是 blocker，而是外部有效 session 数量仍不足，且新增了模块承接感与结果气质两条待处理反馈
- 三大主页面视觉系统第二轮收口与 shell 第二轮体验校准已完成，并已通过最新自动化回归
- internal lab 页 dev hydration 噪音已清理，`/lab/status`、`/lab/native-handoff`、`/lab/native-handoff/smoke` 当前 Playwright 复核为 0 console error

---

## 2. 单一事实来源

pilot 期间只认下面这几份状态源：

1. freeze / baseline
   - `beta-2026-03-11-r2`
   - `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md`
   - `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json`
2. 真机验收
   - `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`
   - `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-record-2026-03-14.md`
3. 项目内状态面板
   - `/lab/status`
   - `/lab/native-handoff`

如果页面展示和文档不一致，只修状态映射或文档，不改业务 contract。

---

## 3. 当前回归结果

### 自动化

- `npm run build`：通过
- `npm run smoke:benyuan:golden`：通过
  - 结果文件：`/Users/fanhao/Documents/Playground/output/benyuan-golden-audit.json`
- `npm run ios:shell:regression`：通过
  - 结果文件：`/Users/fanhao/Documents/Playground/output/benyuan-ios-regression.json`
  - 最新结果：`18 / 18` passed
  - 生成时间：`2026-03-14T09:39:01.939Z`
- `npm run ios:shell:native-smoke`：通过
  - 结果文件：`/Users/fanhao/Documents/Playground/output/benyuan-ios-native-smoke.json`
  - 模拟器：`iPhone 17`
  - 生成时间：`2026-03-14T09:39:29.178Z`
- `npm run smoke:benyuan:golden`：通过
  - 最新结果：`pass`
  - 生成时间：`2026-03-14T09:39:00.865520Z`

### 真机

- acceptance board：`10 / 10`
- allow / deny / cancel / resume：全部补齐
- A2 / C1 / C2：全部有真机成功回流记录

---

## 4. 环境说明

### Mac / 模拟器

- 默认 base URL：`http://127.0.0.1:3015`
- 用途：本机开发、浏览器回归、模拟器 smoke

### iPhone 真机

- 本轮验收环境：`http://192.168.1.61:3015`
- 只在本轮同网段 LAN 下有效
- shell 已改为优先顺序：
  1. 显式 `--benyuan-base-url`
  2. 上次成功保存的 base URL
  3. 默认本机 `127.0.0.1:3015`
- 下次换网络时，不改 contract；只在需要时传入新的 LAN 地址，shell 会记住最近一次成功地址

### 真机运行前提

1. 在项目根目录启动 web：
   - `cd /Users/fanhao/Documents/Playground`
   - `npm run dev -- --hostname 0.0.0.0 --port 3015`
2. 确认 iPhone Safari 可打开当前 LAN 地址
3. iOS shell 配置指向当前 LAN 地址
4. 再从 Xcode 运行真机 app

---

## 5. A / B / C 演示入口

以下入口继续以 freeze r2 为准。

### A

- theater：
  - `http://127.0.0.1:3015/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf`
- constellation：
  - `http://127.0.0.1:3015/constellation?constellation_id=const_noogky5i`

### B

- theater：
  - `http://127.0.0.1:3015/theater?part1_id=part1_b0gtt7ez&theater_script_id=theater_p04f5cyf`
- constellation：
  - `http://127.0.0.1:3015/constellation?constellation_id=const_8bctm6xu`

### C

- theater：
  - `http://127.0.0.1:3015/theater?part1_id=part1_e9r3lhca&theater_script_id=theater_wawfzaja`
- constellation：
  - `http://127.0.0.1:3015/constellation?constellation_id=const_c3px9v98`

建议演示顺序：

1. 先走 `/collect`
2. 再展示 `A / B / C` 的 freeze 结果页
3. 最后打开 `/lab/status` 看整体 readiness

---

## 6. 面板说明

### `/lab/status`

用于看当前项目是否可继续推进 pilot，重点看：

- pilot readiness
- freeze 是否 aligned
- latest benchmark / golden / iOS regression / native smoke
- 最新 constellation 与 fallback 摘要

### `/lab/native-handoff`

用于看 iOS shell / 真机验收闭环，重点看：

- acceptance board 状态
- regression / native smoke 输出
- 真机记录引用
- collect 上传题与 native smoke 快捷入口

---

## 7. 当前允许但非阻塞的行为

- `A2_music_analysis` 成功上传后会自动进入下一题
- `C1_social_posts_analysis` 成功上传后会自动进入下一题
- 回到原题后仍能看到 `原生拍照`、缩略图和文件信息

这些行为当前视为允许，不作为 pilot blocker。

---

## 8. Pilot 期间不要改的内容

本轮 pilot 期间，不建议现场改这些项：

- 公共 API 路由与返回结构
- benchmark JSON wire shape
- storage keys
- native bridge message 名称：
  - `share`
  - `openExternal`
  - `pickImages`
- `beta-2026-03-11-r2` freeze 参照
- 题库主 contract 与 theater / constellation 主 contract

如果必须切真机网络环境，只改 shell base URL，不扩 native scope。

---

## 9. 恢复与排障

### 真机打不开页面

优先检查：

1. iPhone Safari 是否能打开当前 LAN 地址
2. web 是否在 `0.0.0.0:3015` 上启动
3. shell 配置是否仍指向旧 LAN 地址
4. 当前网络是否把 Mac 和 iPhone 放在同一网段

### 真机进入 app 后白屏或失败

优先处理：

1. 先记录证据
2. 只修 shell base URL / 路由恢复 / bridge 返回
3. 不同时改 UI、prompt、结果结构

---

## 10. 下一阶段入口

只有在本 handoff 包被接受后，下一阶段才进入：

- Part 3 / AI 结果层与展示打磨
- `/constellation` 摘要表达与导出体验
- archetype 差异化与 narrative 强化

在那之前，不继续开新的 native 页面拆分，也不重写 Part 1 / Part 2 / Part 3 contract。

---

## 11. 当前实际进度结论

- 产品链路：green
- 页面与 shell 收口：green
- 自动化护栏：green
- 真机验收：green
- guided pilot 执行：conditional

也就是说，当前剩余主工作已经不是“继续做功能”，而是完成真实 `pilot-session-02` / `pilot-session-03` 并回填结论。
