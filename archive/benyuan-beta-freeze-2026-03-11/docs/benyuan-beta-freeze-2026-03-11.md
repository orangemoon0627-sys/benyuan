# 本源 Beta 冻结快照（2026-03-11）

更新时间：2026-03-11
冻结目的：把当前已经跑通的 benyuan beta 固化成一份可回退、可对照、可交接的稳定基线，供后续 iOS shell 迁移、UI 迭代和回归验收使用。

---

## 1. 当前冻结结论

这一轮 freeze 关注的不是“新功能更多了”，而是“当前链路已经稳定、能反复回归、可以安全作为 beta 参照”。

本次 freeze 包含：
- 最新 `A / B / C` 全量 benchmark 基线
- 当前稳定的 live provider 路径与 fallback 记录方式
- 当前 `/collect -> /processing/benyuan -> /theater -> /constellation` Web 主链路
- 当前 iOS shell starter、native bridge 契约和 demo 路由
- 当前 `/lab/status` 状态面板与项目内可见性入口

---

## 2. 冻结基线

### 2.1 最新可信全量 benchmark

- 基线路径：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-10T17-44-42.json`
- latest 指针：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark.json`
- 结果：三包全部 `live`，`events` 全空，无 fallback 事件

### 2.2 Pack 结果

| Pack | part1_id | theater_script_id | part2_id | constellation_id | total |
| --- | --- | --- | --- | --- | --- |
| A | `part1_i2ffoggu` | `theater_c8wkeirl` | `part2_twr6pt38` | `const_9pfnj81l` | `330.4s` |
| B | `part1_h9zwr2ii` | `theater_f86ga7vv` | `part2_oifithm0` | `const_332xc7ue` | `350.2s` |
| C | `part1_8oc9qk81` | `theater_oiprjw2m` | `part2_vk1b9m2n` | `const_an86s1af` | `353.2s` |

### 2.3 单包稳定性复跑

- `B-only`：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-b-2026-03-10T17-20-19.json`
- `A-only`：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-2026-03-10T17-27-04.json`
- 结论：两轮都为全阶段 `live`，`events: []`

---

## 3. 当前备份点

### 3.1 冻结归档

- 冻结目录：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11`
- 压缩包：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11.tar.gz`
- 清单文件：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11/manifest.json`

### 3.2 旧版安全快照

- 旧版目录：`/Users/fanhao/Documents/Playground/archive/benyuan-ios-safe-baseline-2026-03-10`
- 旧版压缩包：`/Users/fanhao/Documents/Playground/archive/benyuan-ios-safe-baseline-2026-03-10.tar.gz`

这意味着：
- 如果后续只想回退到“iOS shell 启动前”的安全态，用旧版 safe baseline
- 如果后续想回退到“当前稳定 beta”，用本次 `2026-03-11` freeze

---

## 4. 这次 freeze 覆盖了什么

### 4.1 Web 主链路

- `/`
- `/collect`
- `/processing/benyuan`
- `/theater`
- `/constellation`
- `/lab/status`

### 4.2 核心代码面

- Part 1 / Part 2 / Part 3 主组件
- `benyuan-v3-agent` 实时调用与 fallback 链
- `benyuan-pack-benchmark.mjs`
- 状态面板与 runtime 可见性
- iOS shell starter、route recovery、bridge contract、demo route 清单

### 4.3 保持稳定的东西

以下内容在下一个阶段不建议随意改动：
- Part 1 / Part 2 / Part 3 API contract
- 当前 benchmark 输出结构
- Part 1 session / pending storage key
- iOS shell 对 Web 的 bridge message 名称
- 当前 A / B / C pack 定义与素材结构

---

## 5. 可以继续迭代的面

这次 freeze 之后，以下内容仍可继续优化：
- `/collect` 的节奏、模块切换、素材反馈
- `/theater` 的沉浸节奏、等待态、互动反馈
- `/constellation` 的移动端阅读、摘要层次、推荐区表现
- iOS shell 的 loading / offline / external handoff 表现

但前提是：
- 不要先动 contract
- 每次大改后都拿本 freeze 做回归参照

---

## 6. 推荐回归顺序

1. `npm run build`
2. `BENYUAN_BASE_URL=http://127.0.0.1:3015 BENYUAN_PACKS=A,B,C node scripts/benyuan-pack-benchmark.mjs`
3. 浏览器检查：
   - `http://127.0.0.1:3015/collect`
   - `http://127.0.0.1:3015/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m`
   - `http://127.0.0.1:3015/constellation?constellation_id=const_an86s1af`
   - `http://127.0.0.1:3015/lab/status`
4. 如涉及 iOS shell，再执行：
   - `npm run ios:shell:build`
   - `npm run ios:shell:native-smoke`

---

## 7. 回退策略

### 7.1 UI 回退

如果只是当前页面视觉或交互回退：
- 对照本次 freeze 目录中的 `src/components/benyuan-*.tsx`
- 优先 diff 当前工作区和 freeze 版本，不要靠记忆回退

### 7.2 链路回退

如果是 API 路径、fallback、benchmark 行为回退：
- 对照本次 freeze 目录中的：
  - `src/lib/benyuan-v3-agent.ts`
  - `scripts/benyuan-pack-benchmark.mjs`
  - `src/lib/benyuan-status.ts`

### 7.3 iOS shell 回退

如果是 iOS shell demo route、native bridge、route recovery 回退：
- 对照本次 freeze 目录中的：
  - `mobile/benyuan_origin_ios_shell/shell-manifest.json`
  - `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift`
  - `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanNativeBridge.swift`
  - `mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanRouteRecovery.swift`

---

## 8. 关联文档

- iOS 迁移映射：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md`
- 迁移 checklist：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-safe-migration-checklist.md`
- iOS 回归基线：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-regression-baseline.md`
- Agent 状态板：`/Users/fanhao/Documents/Playground/docs/benyuan-agent-status-board.md`
