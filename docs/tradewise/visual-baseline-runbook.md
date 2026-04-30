# TradeWise AI 视觉基线手册

## 目的

为 `/growth` 和 `/research` 提供可复现的首屏基线，避免 live API、当天真实时间和随机本地数据影响截图对比。

当前基线能力具备三个特性：

- 固定时间：通过 `TRADEWISE_NOW_ISO` 锁定页面里的“今天”与生成时间。
- 固定场景：通过 `TRADEWISE_BASELINE_SCENARIO=growth|research|all` 注入确定性 seed。
- 固定数据源：默认强制 `TRADEWISE_REVIEW_MODE=mock`、`TRADEWISE_RESEARCH_MODE=mock`、`TRADEWISE_USE_OCR_MOCK=true`。

## 一键截图

### Growth 首屏

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/capture_visual_baseline.sh ios /growth
```

### Research 首屏

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/capture_visual_baseline.sh ios /research
```

### 批量三页基线

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/capture_visual_baseline.sh ios all
```

脚本会依次截图 `/trade`、`/growth`、`/research`。
每次运行都会同时生成 Markdown 索引、HTML gallery、TSV manifest、JSON summary 和 latest batch 摘要：`mobile/tradewise_ai/build/visual-baseline/index-<timestamp>.md`、`mobile/tradewise_ai/build/visual-baseline/index-<timestamp>.html`、`mobile/tradewise_ai/build/visual-baseline/manifest-<timestamp>.tsv`、`mobile/tradewise_ai/build/visual-baseline/latest-batch.json`、`mobile/tradewise_ai/build/visual-baseline/latest-batch.txt`，并同步覆盖最新别名 `index.md` / `index.html` / `manifest-latest.tsv`。

### Android

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_ANDROID_DEVICE_ID=emulator-5554 ./tool/capture_visual_baseline.sh android /growth
```


## 产物校验脚本

生成截图后，可以直接在仓库根目录运行：

```bash
cd /Users/fanhao/Documents/Playground
npm run smoke:tradewise:visual-baseline
```

如果要在 CI 中校验整套三页基线，可以额外加上：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_EXPECT_BASELINE_ROUTES=/trade,/growth,/research npm run smoke:tradewise:visual-baseline
```

脚本会读取 `mobile/tradewise_ai/build/visual-baseline/latest-batch.json`，验证：

- summary / markdown index / html gallery / manifest 文件都存在
- 每张截图与 sidecar metadata 都存在且字段一致
- 如果传了 `TRADEWISE_EXPECT_BASELINE_ROUTES`，还会校验路由集合是否完整

## 总入口联动

`npm run smoke:tradewise:all` 与 `npm run smoke:tradewise:route:all` 现在会自动尝试串上视觉基线校验，但默认只在 `mobile/tradewise_ai/build/visual-baseline/latest-batch.json` 已存在时执行。这样可以保证日常 route / CRS smoke 不会因为本地还没生成截图而被硬性打断。

如果你就是想在总入口里强制校验视觉基线，可以显式打开：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_INCLUDE_VISUAL_BASELINE=1 npm run smoke:tradewise:all
```

或：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_INCLUDE_VISUAL_BASELINE=1 npm run smoke:tradewise:route:all
```

如果 `latest-batch.json` 不存在，这个强制模式会直接失败，提醒先去跑截图脚本。

## 默认种子内容

### `growth`

- 固定用户档案与关注板块
- 固定 6 笔 A 股交易
- 固定 5 条历史复盘
- 固定最近一次复盘生成元数据

### `research`

- 保留本地 fixture feed
- 固定收藏 / 已读状态
- 清空交易与复盘数据，避免干扰研报首屏

### `all`

- 同时注入 growth 与 research 的基线状态
- 适合后续做整套多页面截图或录屏

## 关键环境变量

- `TRADEWISE_BASELINE_SCENARIO=growth|research|all`
- `TRADEWISE_INITIAL_ROUTE=/growth|/research|/trade`
- `TRADEWISE_NOW_ISO=2026-03-10T15:00:00+08:00`
- `TRADEWISE_ACCEPTANCE_SCREENSHOT_DELAY_MS=4000`

## 截图产物

- iOS: `mobile/tradewise_ai/build/visual-baseline/ios-<route>-<scenario>-<timestamp>.png`
- Android: `mobile/tradewise_ai/build/visual-baseline/android-<route>-<scenario>-<timestamp>.png`
- Sidecar metadata: 每张截图旁边会生成同名 `.json`，记录 `route`、`scenario`、`platform`、`nowIso` 与绝对截图路径
- Markdown 索引: `mobile/tradewise_ai/build/visual-baseline/index-<timestamp>.md` 与最新别名 `mobile/tradewise_ai/build/visual-baseline/index.md`
- HTML gallery: `mobile/tradewise_ai/build/visual-baseline/index-<timestamp>.html` 与最新别名 `mobile/tradewise_ai/build/visual-baseline/index.html`
- TSV manifest: `mobile/tradewise_ai/build/visual-baseline/manifest-<timestamp>.tsv` 与最新别名 `mobile/tradewise_ai/build/visual-baseline/manifest-latest.tsv`
- JSON summary: `mobile/tradewise_ai/build/visual-baseline/latest-batch.json`
- Latest batch 摘要: `mobile/tradewise_ai/build/visual-baseline/latest-batch.txt`

脚本结束时会直接把 latest batch 摘要打印到终端，便于验收时快速确认这次截图到底生成了哪些路由；如果后续要接自动化归档或 CI artifact，可以直接消费 `latest-batch.json` 和 `manifest-latest.tsv`。

## 设计注意点

- Growth 页依赖 `daily_reviews` 与 `app_kv`，因此基线不是只 seed trade table，而是直接写入复盘快照与最近生成记录。
- Research 页不重复导入 feed fixture，只覆写 bookmark/read 状态，这样不会和 `LocalResearchRepository.bootstrap()` 的版本刷新逻辑互相打架。
- 当前 CRS 上游在用户这套 `crs` base URL 下依然可能需要接近 60 秒才返回，因此视觉基线脚本故意不走 live 模式，避免截图过程被网络波动污染。
