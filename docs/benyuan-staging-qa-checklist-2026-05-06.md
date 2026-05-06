# 本源 Staging QA 清单（ICP备案等待期）

日期：2026-05-06  
当前可测入口：`http://120.26.126.88/`  
本地验证入口：`http://127.0.0.1:3001/`  
域名状态：`staging-benyuan.orangemoonai.cn` 仍可能被阿里云备案拦截，返回 `403 Beaver` 不视为应用失败。

## 当前测试结论

本源 Web / API 主链路可以继续进入产品测试。ICP备案未通过前，外部用户不要使用域名入口；内部测试优先使用 IP 或本地 production server。

本次 QA 发现一个明确问题并已修复：

- 现象：本机存在 Codex 默认模型网关时，`/api/agent/runtime` 会把默认 key/baseURL 误判成 live provider enabled，导致 `smoke:benyuan:benchmark` 的多模态阶段长时间等待外部请求。
- 根因：runtime gate 逻辑把“凭据存在”当成“允许 live 调用”。
- 修复：只有显式设置 `BENYUAN_LLM_LIVE=1` 或请求里显式 `runtime_override.live=true` 时才允许 live；默认保持 stub/fallback。
- 新护栏：`npm run smoke:runtime:gate`。

## 自动化检查

在本地 production server 上执行：

```bash
cd /Users/fanhao/Documents/Playground-benyuan
npm run build
npm run start -- -H 127.0.0.1 -p 3001
```

另开终端运行：

```bash
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:runtime:gate
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:runtime:page
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:runtime:hybrid
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:flow
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:flow:deep
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:benyuan:golden
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run smoke:benyuan:benchmark
BENYUAN_BASE_URL=http://127.0.0.1:3001 npm run ios:shell:regression
```

### 2026-05-06 执行结果

- `npm run lint`：通过
- `npm run build`：通过
- `smoke:runtime:gate`：通过，`mode=stub`
- `smoke:runtime:page`：通过
- `smoke:runtime:hybrid`：通过，`fallbackActive=true`
- `smoke:flow`：通过
- `smoke:flow:deep`：通过
- `smoke:benyuan:golden`：通过，`drifted=0 missing=0`
- `smoke:benyuan:benchmark`：通过，A/B/C 三包完成
- `ios:shell:regression`：通过，`30/30`

## 浏览器抽检

用 Playwright CLI 抽检：

```bash
export PWCLI="$HOME/.codex/skills/playwright/scripts/playwright_cli.sh"
export PLAYWRIGHT_CLI_SESSION=bqa
bash "$PWCLI" open http://127.0.0.1:3001
bash "$PWCLI" snapshot
bash "$PWCLI" goto http://127.0.0.1:3001/collect
bash "$PWCLI" resize 390 844
bash "$PWCLI" screenshot
bash "$PWCLI" goto http://127.0.0.1:3001/lab/runtime
bash "$PWCLI" snapshot
```

当前截图：

- 首页桌面：`output/playwright/benyuan-home-desktop-2026-05-06.png`
- 采集页手机：`output/playwright/benyuan-collect-mobile-2026-05-06.png`

抽检结论：

- 首页桌面可正常加载，CTA 清晰，黑月场视觉一致。
- `/collect` 手机宽度可正常加载，选项按钮可见，下一题按钮禁用状态符合初始态。
- `/lab/runtime` 可正常打开，并显示 `live provider：stub only`。
- 手机采集页标题排版偏紧，但未出现按钮不可点、页面空白或明显截断；后续 UI 精修可以进一步收紧移动端题干字号和行距。

## Staging 服务器检查

服务器健康时执行：

```bash
curl -I --max-time 10 http://120.26.126.88/
BENYUAN_BASE_URL=http://120.26.126.88 npm run smoke:runtime:page
BENYUAN_BASE_URL=http://120.26.126.88 npm run smoke:runtime:hybrid
ssh -i ~/.ssh/benyuan_railway_ed25519 root@120.26.126.88 'pm2 ls && readlink /opt/apps/benyuan-staging/current'
```

当前服务器注意事项：

- ECS 规格较小，曾多次出现 TCP 22/80 可连通但 SSH banner 或 HTTP 响应超时。
- 若出现 `curl` 超时或 `Connection timed out during banner exchange`，优先视为服务器卡顿/资源问题，不继续压测。
- 服务器恢复后再跑 staging smoke，不要在卡顿时反复重试。

## 手动产品测试路径

### P0：核心体验

1. 首页 `/`：确认主视觉、品牌名、CTA 和移动端首屏完整。
2. 采集 `/collect`：从第一题进入，至少完成 A/B/C 中一个分支。
3. 处理 `/processing/benyuan`：确认阶段文案和跳转逻辑。
4. 剧场 `/theater`：确认三幕内容可读，选项可点。
5. 星图 `/constellation`：确认结果页、推荐、分享入口可读。

### P1：实验室与运行时

1. `/lab/runtime`：确认 provider mode 是 `stub`，除非主动设置 `BENYUAN_LLM_LIVE=1`。
2. `/lab/status`：确认最新 benchmark、golden、iOS regression 状态可读。
3. `/lab/golden`：确认黄金样本没有缺 baseline。

### P2：移动端视觉

1. 390 × 844：首页、采集页、结果页不应出现横向滚动。
2. 430 × 932：按钮文字不应溢出。
3. iOS WebView：安全区、底部 CTA、返回按钮不应被系统栏遮挡。

## 当前未做

- ICP 未通过前，不做域名正式验收。
- 服务器卡顿期间，不做长时间 staging benchmark。
- 未进行真机相机/相册/分享面板回归，这部分等 iOS 壳切真实 HTTPS 域名后再跑。
