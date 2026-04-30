# TradeWise AI Live 验收清单

## 当前验收口径

- `live pass`：review 返回合法结构，且 `generatorVersion` 为非 mock live 版本
- `fallback pass`：review 返回合法结构，且 `generatorVersion` 为 `server.review.fallback.mock.<category>.v1`
- `hard fail`：route 出错、review 非法、或 fallback 没有明确分类
- 对当前 CRS 环境，`fallback pass` 是允许结果；重点是必须能一眼看出 fallback 分类与耗时

## 启动前

- 根目录已启动 `npm run dev:tradewise:crs`，或真实 research upstream 版本的 `npm run dev:tradewise:remote`
- iOS simulator 已 boot，或 Android emulator 已启动
- Flutter 侧优先通过 `./tool/live_acceptance_smoke.sh` 启动；该脚本现已固定为 `beta` profile（review live+fallback、research mock），不再切换其它验收组合
- 如需截图指定页面，可用 `./tool/live_acceptance_smoke.sh ios /growth` 或设置 `TRADEWISE_ACCEPTANCE_INITIAL_ROUTE=/research`
- 默认会先跑一轮无锁 route 预检；如需跳过，传 `TRADEWISE_ACCEPTANCE_PREFLIGHT_SMOKE_MODE=off`
- 当前默认环境假设：
  - 用户使用 CRS provider
  - `wire_api = responses`
  - 非官方 OpenAI-compatible base URL 可能高延迟
  - fallback 不等于故障，但“无分类 fallback”算未收口

## 开发诊断优先级

1. `npm run smoke:tradewise:review:direct`
2. `npm run smoke:tradewise:review:route`
3. `npm run smoke:tradewise:crs`
4. `BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:all`

- 若根目录已有 `.next/dev/lock`，优先使用前两条无锁入口
- `review:direct` / `review:route` / `smoke:tradewise:crs` 输出里都应包含：
  - provider
  - runtime base URL / model / wire api 及其来源
  - `result=live|fallback|mock|skip`
  - `fallbackCategory`
  - `configReason`
  - `diagnosis=environment|code|unknown`
  - `latencyMs`
  - `nextAction`
- 若出现 `fallbackCategory=config`：必须继续看到 `configReason`，否则视为未收口
- `openai_status_402` / `payment required` / quota / billing 一律先按环境或 provider 账号问题处理，不按 schema 回归处理

## Smoke 基线

- `npm run smoke:tradewise:route:all`
- `BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:all`
- 若使用真实 research upstream：`BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:remote:all`
- 若本地已生成 `mobile/tradewise_ai/build/visual-baseline/latest-batch.json`，以上两个总入口会自动附带一轮 `smoke:tradewise:visual-baseline`
- 若想强制把视觉基线也纳入总入口：`TRADEWISE_INCLUDE_VISUAL_BASELINE=1 npm run smoke:tradewise:all` 或 `TRADEWISE_INCLUDE_VISUAL_BASELINE=1 npm run smoke:tradewise:route:all`
- 对 `smoke:tradewise:all` 的额外要求：如果 review 走了 fallback，输出必须直接显示 fallback 分类、`configReason` 与耗时摘要，不能只看到 `pass`
- 内测真机启动优先使用：`cd mobile/tradewise_ai && ./tool/run_internal_beta.sh ios -d <device_id>` 或 `./tool/run_internal_beta.sh android -d <device_id>`
- `./tool/live_acceptance_smoke.sh` 每次截图会同步写入 `mobile/tradewise_ai/build/acceptance/latest-ios.json` 或 `latest-android.json`，可直接附到发版记录
- 推荐 operator 处理顺序：
  1. 跑 `review:direct`
  2. 跑 `review:route`
  3. 再跑 `smoke:tradewise:all`
- 对 `402/config` 的判断口径：
  1. `payment_required` / `quota_exceeded` / `billing_required` -> 优先检查 provider 额度与账单
  2. `provider_denied` -> 优先检查 key、base URL、model 是否匹配且有权限
  3. `missing_runtime` / `unsupported_wire_api` -> 优先修本地运行时前置条件

## 交易录入

- 打开 `/trade`
- 手动输入一笔 A 股交易并保存
- 预期：列表出现新交易，页面无报错，金额/方向/标签显示正常

## 今日复盘

- 在成长页点击“生成今日复盘”
- 预期：生成成功后出现六维评分、summary、tomorrowPlan
- 若走 CRS：`generatorVersion` 不应为 `server.review.mock.v1`
- 若走 fallback：允许看到这些版本之一，并视为 `fallback pass`
  - `server.review.fallback.mock.timeout.v1`
  - `server.review.fallback.mock.schema.v1`
  - `server.review.fallback.mock.upstream.v1`
  - `server.review.fallback.mock.config.v1`
  - `server.review.fallback.mock.transport.v1`
  - `server.review.fallback.mock.unknown.v1`
- 若输出只有“fallback 了”但没有分类，视为未收口
- 当前已知的 alias schema（如 `scores.execution` / `scores.riskControl` / `scores.planConsistency` / `scores.planExecution` / `scores.planAdherence` / `scores.consistency` / `scores.strategyConsistency` / `scores.strategyFit` / `scores.sectorUnderstanding` / `scores.sectorJudgment` / `scores.marketAlignment` / `scores.emotionStability` / `scores.emotionalStability` / `scores.emotionControl` / `scores.emotionManagement`）应被服务端归一化为 contract 六维分数；这类返回不应再触发 `schema` fallback
- 若 upstream `profitMetrics` 不是 contract 形态，但其余 review 字段合法，允许服务端使用本地派生 profit metrics 继续作为 `live pass`
- 当前非官方 OpenAI/CRS 通道默认可能先等待约 60 秒再触发 fallback mock，因此 live 验收时不要把短时等待误判成故障

## 研报列表

- 打开 `/research`
- 预期：列表可正常加载，卡片包含 title / sector / source / relevanceScore
- 若走 remote：条目 `isMock` 语义应对应远端返回，且筛选后顺序稳定

## 详情与收藏

- 打开任意研报详情
- 执行收藏/取消收藏
- 返回列表后确认状态保留
- 重启 App 后再次确认收藏状态仍在

## 截图产物

- iOS: `mobile/tradewise_ai/build/acceptance/ios-beta-*.png` 与 `latest-ios.json`
- Android: `mobile/tradewise_ai/build/acceptance/android-beta-*.png` 与 `latest-android.json`

## 视觉基线

- `cd mobile/tradewise_ai && ./tool/capture_visual_baseline.sh ios /growth`
- `cd mobile/tradewise_ai && ./tool/capture_visual_baseline.sh ios /research`
- `cd mobile/tradewise_ai && ./tool/capture_visual_baseline.sh ios all`
- `cd /Users/fanhao/Documents/Playground && npm run smoke:tradewise:visual-baseline`
- 若需要校验整套三页路由：`cd /Users/fanhao/Documents/Playground && TRADEWISE_EXPECT_BASELINE_ROUTES=/trade,/growth,/research npm run smoke:tradewise:visual-baseline`
- 预期：首屏内容稳定、时间稳定、截图目录落到 `mobile/tradewise_ai/build/visual-baseline/`，并且 `latest-batch.json` / `manifest-latest.tsv` 校验通过
- 若 CRS live 仍走 fallback，这是当前上游时延或 provider 兼容性所致；只要 fallback 分类明确，就不阻塞 mock 基线截图验收
