# TradeWise AI Flutter Live 联调手册

## 目标

让 Flutter 端同时命中本仓库 Next.js 提供的：

- `POST /api/tradewise/review/generate`
- `GET /api/tradewise/research/feed`

当前推荐直接使用统一的 `TRADEWISE_API_BASE_URL`，避免分别维护两个 endpoint。

## 环境文件

如需稳定复用 beta 环境参数，先复制：

```bash
cd /Users/fanhao/Documents/Playground
cp docs/tradewise/internal-beta.env.example mobile/tradewise_ai/.internal-beta.env
```

`run_internal_beta.sh`、`build_internal_beta.sh`、`live_acceptance_smoke.sh`、`preflight_live_api.sh` 都会优先加载 `mobile/tradewise_ai/.internal-beta.env`；也可通过 `TRADEWISE_INTERNAL_BETA_ENV_FILE=/abs/path/to/file` 指到其它位置。

## 先启动 Web API

在仓库根目录启动 Next dev server：

```bash
cd /Users/fanhao/Documents/Playground
npm run dev:tradewise:crs
```

如果只想验证 research/feed，也可以不传 `TRADEWISE_REVIEW_PROVIDER=crs`。

如果你要让同网段 iPhone 直接访问本机接口，优先改用：

```bash
cd /Users/fanhao/Documents/Playground
npm run dev:tradewise:crs:lan
```

这会把 Next dev 绑到 `0.0.0.0:3201`，配合 `mobile/tradewise_ai/.internal-beta.env` 里的局域网地址做 iPhone 联调。

## 视觉基线截图

如果你想先拿到稳定首屏，而不是直接联调 live API，可先使用 mock 基线截图脚本：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/capture_visual_baseline.sh ios /growth
./tool/capture_visual_baseline.sh ios /research
```

这个脚本会自动注入：

- `TRADEWISE_BASELINE_SCENARIO`
- `TRADEWISE_NOW_ISO=2026-03-10T15:00:00+08:00`
- `TRADEWISE_REVIEW_MODE=mock`
- `TRADEWISE_RESEARCH_MODE=mock`

适合做截图基线、录屏基线和回归视觉比对。

## Flutter 运行方式

### iOS 模拟器 / macOS / Web

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/run_live_local.sh ios -d <device_id>
```

如果你要按当前内测 profile 运行（review live+fallback、research mock），优先改用：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/run_internal_beta.sh ios -d <device_id>
```

`run_internal_beta.sh` 现已固定 beta profile：`TRADEWISE_REVIEW_MODE=live`、`TRADEWISE_REVIEW_FALLBACK_TO_MOCK=true`、`TRADEWISE_RESEARCH_MODE=mock`，只保留端口、设备 ID 和 API base URL 这类发布必要参数。

如果你想在启动 Flutter 前先做一轮无锁 route 预检，可直接加：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_PREFLIGHT_SMOKE_MODE=route ./tool/run_live_local.sh ios -d <device_id>
```

默认会注入：

- `TRADEWISE_REVIEW_MODE=live`
- `TRADEWISE_RESEARCH_MODE=live`
- `TRADEWISE_API_BASE_URL=http://127.0.0.1:3000/api/tradewise`
- `TRADEWISE_INITIAL_ROUTE=/trade`（可选，用于启动后直接落到 `/growth` 或 `/research`）

可选预检开关：

- `TRADEWISE_PREFLIGHT_SMOKE_MODE=off|route|live|remote`
- `route`：推荐默认预检，只跑无锁 route smoke
- `live`：要求当前已有可访问的 Next API 实例，再跑 `smoke:tradewise:all`
- `remote`：要求当前已有 remote research + CRS review 的 Next API 实例，再跑 `smoke:tradewise:remote:all`

Flutter 端当前还带两条 live 兜底策略：

- `TRADEWISE_REVIEW_TIMEOUT_MS=30000`：30 秒内拿不到 review 响应就视为超时
- `TRADEWISE_REVIEW_FALLBACK_TO_MOCK=true`：live review 超时或失败时自动回退本地 mock review

如果你的 Next server 不在 `3000`，可以覆盖端口：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_WEB_PORT=3201 ./tool/run_live_local.sh ios -d <device_id>
```

### Android 模拟器

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_WEB_PORT=3201 ./tool/run_live_local.sh android -d <device_id>
```

如果要直接跑内测 profile：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
./tool/run_internal_beta.sh android -d <device_id>
```

若要准备内测包，请改用 `./tool/build_internal_beta.sh ...`；该脚本会额外输出 `mobile/tradewise_ai/build/internal-beta/latest-build-<target>.json`，记录 profile、签名状态和 artifact 路径。

Android 默认自动切到：

- `TRADEWISE_API_BASE_URL=http://10.0.2.2:3201/api/tradewise`

### 完全手动指定

如果你要打远端或局域网环境，可以直接覆盖 base URL：

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_API_BASE_URL=http://<host>:<port>/api/tradewise ./tool/run_live_local.sh ios -d <device_id>
```

## 仍然支持的细粒度覆盖

若你只想单独改一条链路，仍可使用：

- `TRADEWISE_REVIEW_API_ENDPOINT`
- `TRADEWISE_RESEARCH_API_ENDPOINT`

它们的优先级高于 `TRADEWISE_API_BASE_URL`。

## 推荐联调顺序

1. 根目录跑 `npm run dev:tradewise:crs`
2. 根目录跑 `BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:all`
3. Flutter 端执行 `./tool/run_live_local.sh ios ...` 或 `./tool/run_live_local.sh android ...`
4. 在移动端验证：录交易 -> 手动生成复盘 -> 查看研报列表/详情/收藏

## 根目录快捷命令

- `npm run dev:tradewise:mock`：3201 端口启动本地 mock API
- `npm run dev:tradewise:crs`：3201 端口启动本地 CRS review API
- `npm run dev:tradewise:mock:lan`：3201 端口启动局域网可访问的 mock API
- `npm run dev:tradewise:crs:lan`：3201 端口启动局域网可访问的 CRS review API
- `npm run smoke:tradewise:all`：对同一个 `BENYUAN_BASE_URL` 连跑 research + review smoke
- `npm run smoke:tradewise:route:all`：不启动 Next dev，直接做 research/review route 级 smoke
- `npm run smoke:tradewise:review:direct`：不经过 route，直接验证 review provider 输出
- `npm run smoke:tradewise:review:route`：不经过 Next dev，直接验证 `POST /api/tradewise/review/generate`
- `npm run smoke:tradewise:research:route`：不经过 Next dev，直接验证 `GET /api/tradewise/research/feed` 的 remote 透传

## Research remote 联调

如果你要让 Flutter 看到真实 research upstream，而不是本地 fixture，可先在根目录这样启动：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_REVIEW_PROVIDER=crs \
TRADEWISE_RESEARCH_PROVIDER=remote \
TRADEWISE_RESEARCH_REMOTE_URL=http://<upstream-host>/feed \
npm run dev -- --hostname 127.0.0.1 --port 3201
```

若远端需要鉴权，可继续补：

- `TRADEWISE_RESEARCH_REMOTE_HEADERS`
- `TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN`
- `TRADEWISE_RESEARCH_REMOTE_AUTH_HEADER`
- `TRADEWISE_RESEARCH_REMOTE_AUTH_PREFIX`
- `TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM`
- `TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM`
- `TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_A_STOCK`
- `TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_US_STOCK`

当前 remote adapter 已兼容常见上游形态：根数组、`items[]`、`data.items[]`、`data.list[]`，并支持常见字段别名映射。

推荐先跑：

```bash
cd /Users/fanhao/Documents/Playground
npm run smoke:tradewise:research:route
```

这个 route smoke 会直接 import route handler，自带 fake upstream，不依赖 `.next/dev/lock`。

如果你还想补一次完整的 Next dev 级联调，再跑：

```bash
cd /Users/fanhao/Documents/Playground
npm run smoke:tradewise:research:remote
```

如果你已经拿到了真实 upstream，也可以直接做 adapter 级验收，不依赖 Next dev lock：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_RESEARCH_REMOTE_URL=http://<upstream-host>/feed \
TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN=<token> \
npm run smoke:tradewise:research:upstream
```

确认远端透传逻辑正确，再让 Flutter 端接入。

## 真实 research upstream 启动

如果你已经有真实 research 上游，可直接这样启动：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_RESEARCH_REMOTE_URL=http://<upstream-host>/feed npm run dev:tradewise:remote
```

如果你不想每次手敲整组变量，也可以准备一个 env 文件：

```bash
cd /Users/fanhao/Documents/Playground
cp docs/tradewise/research-remote.env.example /tmp/tradewise-remote.env
TRADEWISE_REMOTE_ENV_FILE=/tmp/tradewise-remote.env npm run dev:tradewise:remote
```

如果 review 也要继续走 CRS，这个命令会默认带上 `TRADEWISE_REVIEW_PROVIDER=crs`。

启动后可直接跑：

```bash
cd /Users/fanhao/Documents/Playground
BENYUAN_BASE_URL=http://127.0.0.1:3201 npm run smoke:tradewise:remote:all
```

## Flutter 一键验收

### iOS simulator

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_WEB_PORT=3201 ./tool/live_acceptance_smoke.sh ios /growth
```

脚本会：

- 默认先跑一轮 `TRADEWISE_PREFLIGHT_SMOKE_MODE=route` 预检
- 启动 Flutter live 模式到 iOS simulator
- 截一张当前页面截图到 `build/acceptance/`

如需跳过预检，可传：`TRADEWISE_ACCEPTANCE_PREFLIGHT_SMOKE_MODE=off`。
如需截图前直接落到指定页面，可把第二个参数设为 `/trade`、`/growth` 或 `/research`，或传 `TRADEWISE_ACCEPTANCE_INITIAL_ROUTE`。

### Android emulator

```bash
cd /Users/fanhao/Documents/Playground/mobile/tradewise_ai
TRADEWISE_WEB_PORT=3201 TRADEWISE_ANDROID_DEVICE_ID=emulator-5554 ./tool/live_acceptance_smoke.sh android
```

## Review 无锁 smoke

如果你当前本地已经有别的 `next dev` 占着 `.next/dev/lock`，建议先用这组命令：

```bash
cd /Users/fanhao/Documents/Playground
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:direct
TRADEWISE_REVIEW_PROVIDER=crs npm run smoke:tradewise:review:route
```

说明：

- `review:direct` 直接调用 `generateTradeWiseReview()`，适合排查 provider/runtime 问题
- `review:route` 直接 import `POST /api/tradewise/review/generate` 的 route handler，适合验证 contract 与错误包装
- 两者都不依赖 Next dev，因此不会被 `.next/dev/lock` 卡住

## Review live 调优开关

当前 Next 服务端对 CRS review 默认使用更轻的 TradeWise 专用配置：

- 默认 `reasoning effort = low`
- 默认非流式 responses 请求
- 默认 `max_output_tokens = 700`
- 对非官方 OpenAI base URL，默认开启 `TRADEWISE_OPENAI_FALLBACK_TO_MOCK=true` 与 `TRADEWISE_OPENAI_SOFT_TIMEOUT_MS=25000`，超时后直接返回服务端 fallback mock

如果你需要覆盖，可在启动 Next dev 前设置：

- `TRADEWISE_OPENAI_REASONING_EFFORT=medium|high`
- `TRADEWISE_OPENAI_INHERIT_CODEX_REASONING=true`
- `TRADEWISE_OPENAI_STREAM=true`
- `TRADEWISE_OPENAI_MAX_OUTPUT_TOKENS=1200`
- `TRADEWISE_OPENAI_TIMEOUT_MS=90000`
- `TRADEWISE_OPENAI_SOFT_TIMEOUT_MS=25000`
- `TRADEWISE_OPENAI_FALLBACK_TO_MOCK=true|false`

## 复盘来源可视化

移动端成长页、历史复盘列表与复盘详情页会根据 `generatorVersion` 和当前运行模式显示：

- `来源 实时 AI`
- `来源 兜底 Mock`
- `来源 本地 Mock`

这样你能直接看出当前看到的是服务端结果，还是 live 失败后的本地回退结果。

研报列表和研报详情页也会显示 `来源 本地 Fixture` 或 `来源 实时 Feed`，方便区分当前读到的是 fixture 还是 remote upstream。

> 2026-03-10 当前实测：你这套 `crs` 自定义 base URL 对 `responses` SSE 请求的首字节延迟约 56 秒，且非流式请求会在约 60 秒后返回 `400 Stream must be set to true`。因此 TradeWise 默认对非官方 OpenAI base URL 保持 `stream=true`，并在 25 秒软超时后自动回退结构化 mock。
