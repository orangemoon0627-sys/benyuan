# 本源 Beta 冻结快照（2026-03-11 · r2）

更新时间：2026-03-11
冻结目的：在 `crs` stream-only provider 收口后，把当前已经跑通且通过 `A / B / C` 全量 clean benchmark 的 benyuan beta 固化成一份新的可信基线，供后续 UI 收口、iOS shell 验收和回归对照使用。

---

## 1. 当前冻结结论

这一轮 freeze 不是为了增加更多功能，而是为了把“可回归、可展示、可继续迁移”的 beta 基线更新到新的稳定版本。

本次 freeze 包含：
- 新的 `A / B / C` 全量 benchmark clean baseline
- `crs` provider 的 stream-only 适配与事件级错误分层
- 当前 `/collect -> /processing/benyuan -> /theater -> /constellation` Web 主链路
- 当前 `/lab/status` 状态面板、freeze 对照与项目内可见性
- 当前 iOS shell starter、native bridge 契约和 demo route 清单

---

## 2. 当前可信全量 benchmark

### 2.1 最新可信全量 benchmark

- 基线路径：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json`
- latest 指针：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark.json`
- 结果：三包全部 `live`，`events: []`

### 2.2 Pack 结果

| Pack | part1_id | theater_script_id | part2_id | constellation_id | total |
| --- | --- | --- | --- | --- | --- |
| A | `part1_pqluf95e` | `theater_hed4qxwf` | `part2_1g2zwxis` | `const_noogky5i` | `297.2s` |
| B | `part1_b0gtt7ez` | `theater_p04f5cyf` | `part2_qb74edrd` | `const_8bctm6xu` | `149.4s` |
| C | `part1_e9r3lhca` | `theater_wawfzaja` | `part2_ez7bjv9n` | `const_c3px9v98` | `157.2s` |

### 2.3 单包稳定性复跑

- `A-only`：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-2026-03-11T05-47-03.json`
- `B-only`：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-b-2026-03-11T06-07-39.json`
- `C-only`：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-c-2026-03-11T05-53-07.json`
- 结论：三轮都为全阶段 `live`，`events: []`

### 2.4 冻结 demo routes

- A
  - `http://127.0.0.1:3015/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf`
  - `http://127.0.0.1:3015/constellation?constellation_id=const_noogky5i`
- B
  - `http://127.0.0.1:3015/theater?part1_id=part1_b0gtt7ez&theater_script_id=theater_p04f5cyf`
  - `http://127.0.0.1:3015/constellation?constellation_id=const_8bctm6xu`
- C
  - `http://127.0.0.1:3015/theater?part1_id=part1_e9r3lhca&theater_script_id=theater_wawfzaja`
  - `http://127.0.0.1:3015/constellation?constellation_id=const_c3px9v98`

---

## 3. 这次 freeze 额外固化了什么

### 3.1 Provider 适配层

- `crs` 继续视为 `responses` stream-only
- `chat/completions` 继续降级为 unsupported skip path
- SSE 失败现在保留事件级错误来源，不再把 provider 失败混成单一 `parse_failed`
- multimodal stream body 已显著减重，A / B / C 单包与全量 benchmark 都已 clean

### 3.2 结果层质量

- archetype 维持明显区分，不回退到模板腔
- `core_tensions` 维持 archetype-specific 表达
- recommendations 持续非空，书 / 电影 / 音乐三类均完整
- narrative 保持 5 段左右的完整阅读结构

### 3.3 iOS shell 迁移前提

- Web 主链路继续持有采集、剧场、星图体验
- Native 仍只承担壳、桥、恢复、分享和系统能力
- 真机 `camera / library / deny / cancel` 证据仍待人工补齐，但现有 smoke 与 regression 可继续沿用

---

## 4. 当前备份点

### 4.1 新版冻结归档

- 冻结目录：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2`
- 压缩包：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2.tar.gz`
- 清单文件：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2/manifest.json`

### 4.2 旧版冻结仍保留

- 旧冻结目录：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11`
- 旧冻结压缩包：`/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11.tar.gz`
- 旧 freeze doc：`/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11.md`

这意味着：
- 如果只想回退到上一版 beta，可用旧 freeze
- 如果后续 UI / iOS 验收都以最新稳定基线为准，使用本次 `r2` freeze

---

## 5. 推荐回归顺序

1. `npm run build`
2. `BENYUAN_BASE_URL=http://127.0.0.1:3015 BENYUAN_PACKS=A,B,C node scripts/benyuan-pack-benchmark.mjs`
3. `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden`
4. 浏览器检查：
   - `http://127.0.0.1:3015/collect`
   - `http://127.0.0.1:3015/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf`
   - `http://127.0.0.1:3015/constellation?constellation_id=const_c3px9v98`
   - `http://127.0.0.1:3015/lab/status`
5. 如涉及 iOS shell，再执行：
   - `npm run ios:shell:regression`
   - `npm run ios:shell:native-smoke`

---

## 6. 当前 freeze 后的建议迭代顺序

1. `/collect`：进度感、模块切换、素材包载入反馈
2. `/theater`：等待态、场景节奏、尾声到星图的过渡
3. `/constellation`：移动端扫读、摘要层级、导出/分享体验
4. iOS 真机：camera / library / deny / cancel 人工证据补齐

前提保持不变：
- 不改公共 API contract
- 不改 benchmark JSON wire shape
- 不改 storage key
- 不改 native bridge message 名称

---

## 7. 关联文档

- 当前 freeze 引用：`/Users/fanhao/Documents/Playground/src/lib/benyuan-beta-freeze.ts`
- 当前内容增量记录：`/Users/fanhao/Documents/Playground/docs/benyuan-content-delta-2026-03-11.md`
- iOS 迁移映射：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md`
- iOS 安全迁移 checklist：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-safe-migration-checklist.md`
- iOS 真机 acceptance board：`/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-acceptance-board.md`
