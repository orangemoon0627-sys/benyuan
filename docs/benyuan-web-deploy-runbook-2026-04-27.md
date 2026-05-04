# 本源 Web 部署 Runbook（TestFlight 前置）

## 结论

本源 iOS shell 需要一个公网 HTTPS Web base URL。当前 Web 主流程是 Next.js SSR/API 应用，并且会写入本地文件：

- `data/benyuan-v3-store.json`
- `data/benyuan-v3-uploads/`

因此首轮 TestFlight 不建议直接部署到 Vercel / Cloudflare Pages 这类无持久文件系统的 serverless 平台，除非先把 store / upload 改成数据库与对象存储。

最快可上线路径是部署到支持持久盘的 Node 容器平台：

- Render Web Service + Persistent Disk
- Railway Service + Volume
- Fly.io Machine + Volume
- 自有 VPS + Docker

## 推荐部署形态

### 容器

仓库已提供：

- `Dockerfile`
- `.dockerignore`
- `render.yaml`

容器默认：

- 监听端口：`3000`
- 数据目录：`/app/data`
- 需要在部署平台配置持久化挂载：`/app/data`
- 启动命令：`npm run start`

`render.yaml` 当前定义：

- service：`benyuan-web`
- runtime：`docker`
- region：`singapore`
- plan：`starter`
- health check：`/collect`
- disk：`benyuan-data` → `/app/data` → `10GB`

### 域名

至少需要：

- staging：`https://staging.<your-domain>`
- production：`https://app.<your-domain>`

如果暂时没有 staging，可以首轮先让二者指向同一个 HTTPS origin，但 iOS 配置里仍要填两个非占位 URL。

## 平台配置

### Render

推荐走 Blueprint：

1. 把当前仓库推到 GitHub / GitLab
2. 打开 Render Dashboard → `Blueprints`
3. 选择该仓库
4. Blueprint file 使用仓库根目录的 `render.yaml`
5. 创建后确认 service 为 `benyuan-web`
6. 确认 Persistent Disk：
   - Mount path：`/app/data`
   - Size：`10GB`
7. 等待首次部署完成，先使用 Render 提供的 `*.onrender.com` URL 验证
8. 绑定域名：
   - `staging.<your-domain>`
   - `app.<your-domain>`

如果不走 Blueprint，也可以手动新建 Web Service：

1. Runtime 选择 Docker
2. Dockerfile path：`./Dockerfile`
3. Docker context：`.`
4. Health Check Path：`/collect`
5. 添加 Persistent Disk：
   - Mount path：`/app/data`
   - Size：`10GB`

### Railway

1. 新建 Project
2. Deploy from repo
3. 自动识别 Dockerfile
4. 添加 Volume：
   - Mount path：`/app/data`
5. 绑定公网域名

### VPS

```bash
docker build -t benyuan-web:latest .
docker run -d \
  --name benyuan-web \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /srv/benyuan/data:/app/data \
  benyuan-web:latest
```

再用 Nginx / Caddy / Cloudflare Tunnel 暴露 HTTPS 域名。

## 部署后验证

设置部署后的 URL：

```bash
export BENYUAN_BASE_URL=https://app.<your-domain>
```

固定跑：

```bash
npm run smoke:benyuan:golden
npm run ios:shell:regression
```

人工检查：

- `/collect`
- `/processing/benyuan`
- `/theater`
- `/constellation`

## iOS 配置回填

拿到 HTTPS URL 后，更新：

- `mobile/benyuan_origin_ios_shell/project.yml`
  - `INFOPLIST_KEY_BenyuanShellStagingBaseURL`
  - `INFOPLIST_KEY_BenyuanShellProductionBaseURL`

然后跑：

```bash
npm run ios:shell:testflight:preflight
```

preflight 还需要 signed archive，因此还要设置：

```bash
BENYUAN_IOS_DEVELOPMENT_TEAM=<APPLE_TEAM_ID> BENYUAN_IOS_ALLOW_UNSIGNED=0 npm run ios:shell:archive
```

## 后续正式化建议

TestFlight 先行可以用持久盘文件存储。正式 App Store 前建议迁移：

- store：Postgres / SQLite with managed volume / D1
- upload：S3 / R2
- 日志与错误监控：Sentry 或平台日志
