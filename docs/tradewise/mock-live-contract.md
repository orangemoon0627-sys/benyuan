# TradeWise AI Mock / Live Contract

## ReviewGenerator Contract

输入：

- `reviewDate`
- `trades[]`
- `userProfile`
- `watchSectors[]`
- `recentReviews[]`

输出：

- `reviewDate`
- `generatedAt`
- `summary`
- `scores`
- `tradingPattern`
- `strengthSectors[]`
- `profitMetrics`
- `tomorrowPlan`
- `generatorVersion`

请求体与响应体保持结构化 JSON，不允许自由文本透传。

## Review API

### `POST /api/tradewise/review/generate`

- 默认 provider：`mock`
- 可切到 Anthropic：设置 `TRADEWISE_REVIEW_PROVIDER=anthropic`
- 也可切到 OpenAI-compatible Responses provider：`TRADEWISE_REVIEW_PROVIDER=crs`
- `crs` provider 会优先读取：
  - `TRADEWISE_OPENAI_API_KEY`
  - `OPENAI_API_KEY`
  - `CODEX_HOME/auth.json` 中的 `OPENAI_API_KEY`
- `crs` provider 的 base URL 会优先读取：
  - `TRADEWISE_OPENAI_BASE_URL`
  - `CODEX_HOME/config.toml` 中当前 `model_provider` 对应的 `base_url`
  - 默认回退 `https://api.openai.com/v1`
- `crs` provider 的模型与推理强度会优先读取：
  - `TRADEWISE_OPENAI_MODEL`
  - `TRADEWISE_OPENAI_REASONING_EFFORT`
  - `CODEX_HOME/config.toml` 中的 `model` / `model_reasoning_effort`
- `crs` provider 的 response storage 会优先读取：
  - `TRADEWISE_OPENAI_DISABLE_STORAGE`
  - `CODEX_HOME/config.toml` 中的 `disable_response_storage`
- Anthropic 需要 `ANTHROPIC_API_KEY`
- Anthropic 模型可通过 `TRADEWISE_ANTHROPIC_MODEL` 覆盖；默认 `claude-sonnet-4-20250514`
- Flutter live 模式通过 `--dart-define=TRADEWISE_REVIEW_MODE=live`
- Flutter 也支持统一 `--dart-define=TRADEWISE_API_BASE_URL=http://<host>:<port>/api/tradewise`

### `generatorVersion` taxonomy

- live：`server.review.live.*` 或 provider 原生版本，例如 `crs.gpt-5.4`
- fallback mock：
  - `server.review.fallback.mock.timeout.v1`
  - `server.review.fallback.mock.schema.v1`
  - `server.review.fallback.mock.upstream.v1`
  - `server.review.fallback.mock.config.v1`
  - `server.review.fallback.mock.transport.v1`
  - `server.review.fallback.mock.unknown.v1`
- 本地 mock：`server.review.mock.*` 或移动端本地 mock 版本

### CRS fallback 诊断约定

- fallback 不等于故障；对非官方 OpenAI-compatible base URL，允许服务端按策略回退 mock
- 当前已兼容一类已观测到的 alias schema，核心示例如下：

```json
{
  "scores": {
    "discipline": 9,
    "execution": 8,
    "timing": 8,
    "riskControl": 8,
    "planConsistency": 10,
    "emotionStability": 7
  }
}
```

- 该类返回会被归一化为 contract 六维键：`emotion`、`logic`、`discipline`、`industryInsight`、`timing`、`riskManagement`
- 当前已知 alias 还包括：`scores.planExecution`、`scores.planAdherence`、`scores.consistency`、`scores.strategyConsistency`、`scores.strategyFit`、`scores.sectorUnderstanding`、`scores.sectorJudgment`、`scores.sectorRotation`、`scores.sectorRhythm`、`scores.selection`、`scores.marketAlignment`、`scores.emotionalStability`、`scores.emotionControl`、`scores.emotionManagement`、`scores.mindset`
- 当 upstream `profitMetrics` 不是 contract 形态时，服务端会保留 live review 文案，并用本地派生的 profit metrics 填回 contract 字段
- 因此 `schema fallback` 现在只应出现在未知结构，不应再出现在这组已知 alias 上
- 但 fallback 必须带明确分类；“无分类 fallback”视为这条链路尚未收口完成
- 服务端日志、`review:direct`、`review:route`、`smoke:tradewise:crs` 统一输出这些维度：
  - provider
  - runtime base URL / model / wire api 及其来源（`env` / `codex` / `default`）
  - `result=live|fallback|mock|skip`
  - `fallbackCategory`
  - `configReason`
  - `diagnosis=environment|code|unknown`
  - `generatorVersion`
  - `latencyMs`
  - `nextAction`
- `server.review.fallback.mock.config.v1` 当前固定细分这些 `configReason`：
  - `payment_required`
  - `quota_exceeded`
  - `billing_required`
  - `provider_denied`
  - `missing_runtime`
  - `unsupported_wire_api`
  - `unknown_config`
- `openai_status_402`、`payment required`、quota、billing 统一视为 provider / 账号 / 额度 / 账单环境问题，而不是 schema 回归
- 当前默认环境假设：
  - 用户以 CRS provider 为主
  - `wire_api = responses`
  - 非官方 base URL 可能高延迟
  - 优先先诊断、再决定改客户端 / 服务端 / 环境参数

## Smoke 口径

### 结果定义

- `live pass`：返回合法 review，且 `generatorVersion` 为非 mock live 版本
- `fallback pass`：返回合法 review，且 `generatorVersion` 为 `server.review.fallback.mock.<category>.v1`
- `skip pass`：仅允许用于缺 key / 缺 runtime / wire api 不支持等前置条件不足
- `hard fail`：无合法 review、route 返回错误、或只知道 fallback 但无法分类

### 开发诊断顺序

1. `npm run smoke:tradewise:review:direct`
2. `npm run smoke:tradewise:review:route`
3. `npm run smoke:tradewise:crs`
4. `BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:all`

### 402 / config runbook

- 若输出为 `result=fallback fallbackCategory=config configReason=payment_required`：优先检查 provider 账号是否仍有可用额度、账单是否生效
- 若输出为 `configReason=quota_exceeded` 或 `billing_required`：优先在 provider 控制台核对配额 / 充值 / 账单状态
- 若输出为 `configReason=provider_denied`：检查 key、base URL、model 是否属于同一 provider 且账号对该模型有权限
- 若输出为 `configReason=missing_runtime`：先补齐 `OPENAI_API_KEY` / `TRADEWISE_OPENAI_API_KEY`、base URL 或相关运行时配置
- 若输出为 `configReason=unsupported_wire_api`：切回 `wire_api=responses` 或 provider 实际支持的 wire API
- 对 `402/config` 结果，结论优先记为 `fallback pass / environment issue`，不记为 schema 回归或代码回归

### Anthropic smoke

- 命令：`npm run smoke:tradewise:anthropic`
- 脚本会在本地自动拉起 Next dev server，并强制注入 `TRADEWISE_REVIEW_PROVIDER=anthropic`
- 默认探测地址：`http://127.0.0.1:3100`
- 可通过 `TRADEWISE_SMOKE_HOST`、`TRADEWISE_SMOKE_PORT`、`TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS` 调整本地启动参数
- 如果当前环境没有 `ANTHROPIC_API_KEY`，脚本会打印 `tradewise:anthropic:skip ...` 并以 `0` 退出
- 若需要固定模型，可额外传入 `TRADEWISE_ANTHROPIC_MODEL`

### CRS / GPT-5.4 smoke

- 命令：`npm run smoke:tradewise:crs`
- 脚本会在本地自动拉起 Next dev server，并强制注入 `TRADEWISE_REVIEW_PROVIDER=crs`
- 默认探测地址：`http://127.0.0.1:3100`
- 可通过 `TRADEWISE_SMOKE_HOST`、`TRADEWISE_SMOKE_PORT`、`TRADEWISE_SMOKE_STARTUP_TIMEOUT_MS` 调整本地启动参数
- 如果已经有外部或手动启动的 Next server，可直接传 `BENYUAN_BASE_URL` 或 `TRADEWISE_SMOKE_BASE_URL`，脚本会跳过本地起服务流程
- 默认从 `OPENAI_API_KEY` 或 `CODEX_HOME/auth.json` 读取 key，从 `CODEX_HOME/config.toml` 读取 `base_url`、`model`、`model_reasoning_effort`
- 如果当前环境缺少 responses runtime 所需 key / base URL，脚本会打印 `tradewise:crs:skip ...` 并以 `0` 退出
- 若你被 `.next/dev/lock` 卡住，优先改用无锁脚本：
  - `TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:direct`
  - `TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:route`
- `review:direct` 直连 provider，`review:route` 直连 route handler；两者都不依赖 Next dev
- 对非官方 OpenAI base URL，服务端默认会在 `60000ms` 左右软超时后允许回退 `server.review.fallback.mock.timeout.v1`
- 当 `smoke:tradewise:all` 通过但 review 为 fallback 时，输出里必须直接可见 fallback 分类与耗时摘要，不能只看到 `pass`
- 可选覆盖：
  - `TRADEWISE_OPENAI_API_KEY`
  - `TRADEWISE_OPENAI_BASE_URL`
  - `TRADEWISE_OPENAI_MODEL`
  - `TRADEWISE_OPENAI_REASONING_EFFORT`
  - `TRADEWISE_OPENAI_DISABLE_STORAGE`
  - `TRADEWISE_OPENAI_TIMEOUT_MS`
  - `TRADEWISE_OPENAI_SOFT_TIMEOUT_MS`
  - `TRADEWISE_OPENAI_FALLBACK_TO_MOCK`

### Research smoke

- 命令：`npm run smoke:tradewise:research`
- 默认会校验 `/api/tradewise/research/feed?market=a_stock&limit=3` 返回的结构与筛选结果
- 支持 `BENYUAN_BASE_URL` 或 `TRADEWISE_SMOKE_BASE_URL` 直打已启动的外部 server
- 若使用 `TRADEWISE_RESEARCH_PROVIDER=remote` 但未提供 `TRADEWISE_RESEARCH_REMOTE_URL`，脚本会输出 skip 并以 `0` 退出
- 推荐优先跑 `npm run smoke:tradewise:research:route`：它会直接 import route handler，并自带 fake upstream，不依赖 Next dev 或 `.next/dev/lock`
- 额外可用：`npm run smoke:tradewise:research:remote`，会起一个 fake upstream，再带起 Next dev，验证 route/provider 能否把 `market`、`limit`、auth/header 正确透传到远端
- 若你已经拿到真实 upstream，可直接跑 `npm run smoke:tradewise:research:upstream`，它会绕过 Next dev lock，直接验证 remote adapter 对真实上游的字段映射结果
- 若你已经手动启动了真实 remote server 版 Next API，可再跑 `BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:remote:all`，对同一实例连续验证 research live + review crs
- 若你要长期联调真实 upstream，建议复制 `docs/tradewise/research-remote.env.example` 并通过 `TRADEWISE_REMOTE_ENV_FILE` 启动 `npm run dev:tradewise:remote`
- 如果你想一次跑完无锁 route 验证，可直接用 `npm run smoke:tradewise:route:all`

## Research Feed API

### `GET /api/tradewise/research/feed`

- 默认 provider：`fixture`
- 可切到远端 contract provider：`TRADEWISE_RESEARCH_PROVIDER=remote`
- 远端 provider 读取：`TRADEWISE_RESEARCH_REMOTE_URL`
- 会把当前请求里的 `market`、`limit` 查询参数继续透传给远端 upstream
- 可选远端鉴权/头信息：
  - `TRADEWISE_RESEARCH_REMOTE_HEADERS`：JSON object，会并入请求头
  - `TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN`：默认写入 `Authorization: Bearer <token>`
  - `TRADEWISE_RESEARCH_REMOTE_AUTH_HEADER`：覆盖鉴权头名
  - `TRADEWISE_RESEARCH_REMOTE_AUTH_PREFIX`：覆盖鉴权前缀，传空字符串可只发 token
- 当前未配置远端 provider 时，仍返回服务端 fixture 包装结果
- 默认会把 `market`、`limit` 透传给远端；若上游参数名不同，可覆盖：
  - `TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM`
  - `TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM`
  - `TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_A_STOCK`
  - `TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_US_STOCK`
- 远端响应目前兼容这些常见形态：
  - `[{...}]`
  - `{ items: [...] }`
  - `{ data: { items: [...] } }`
  - `{ data: { list: [...] } }`
- 条目字段允许别名映射，例如：`headline -> title`、`abstract -> summary`、`publisher -> source`、`publishedAt -> publishDate`、`score -> relevanceScore`、`tags -> keywords`
- 支持查询参数：`market=a_stock|us_stock`、`limit=<number>`
- 返回结构：

```json
{
  "version": "server.research.fixture.v1",
  "items": [
    {
      "id": "feed-1",
      "market": "a_stock",
      "sector": "电网设备",
      "title": "...",
      "summary": "...",
      "source": "...",
      "publishDate": "2026-03-10T08:00:00.000Z",
      "relevanceScore": 8.8,
      "content": "...",
      "keywords": ["电网", "配网"],
      "isMock": true
    }
  ]
}
```

## Flutter 侧切换方式

- Review 默认 `MockReviewGenerator`
- Research 默认 `LocalFixtureResearchFeedSource`
- Review live：`--dart-define=TRADEWISE_REVIEW_MODE=live`
- Research live：`--dart-define=TRADEWISE_RESEARCH_MODE=live`
- 推荐直接统一指定：`--dart-define=TRADEWISE_API_BASE_URL=http://127.0.0.1:3000/api/tradewise`
- 移动端 UI 会根据 `generatorVersion` 在成长页摘要、历史复盘列表和复盘详情页标出 `来源 实时 AI`、`来源 兜底 Mock` 或 `来源 本地 Mock`
- 研报列表/详情页会根据 `isMock` 标出 `来源 本地 Fixture` 或 `来源 实时 Feed`
- 如需自定义服务端地址：
  - `--dart-define=TRADEWISE_REVIEW_API_ENDPOINT=http://127.0.0.1:3000/api/tradewise/review/generate`
  - `--dart-define=TRADEWISE_RESEARCH_API_ENDPOINT=http://127.0.0.1:3000/api/tradewise/research/feed`
- Android 模拟器默认走 `10.0.2.2`；iOS 模拟器默认走 `127.0.0.1`
