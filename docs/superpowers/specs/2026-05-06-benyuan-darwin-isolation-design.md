# Benyuan Darwin Git And Staging Isolation Design

## Goal

整理本源和达尔文的本地 Git、GitHub 远端、服务器目录、PM2 进程、Nginx 站点和部署流程，让两个项目可以共用一台 ECS 做 staging，但互不干扰、可单独发布、可单独回滚。

## Current Findings

- 本源开发目录是 `/Users/fanhao/Documents/Playground-benyuan`，当前分支是 `codex/benyuan-parallel`。
- 达尔文开发目录是 `/Users/fanhao/Documents/Playground-darwin`，当前分支是 `codex/darwin-isolated`。
- 历史混合目录 `/Users/fanhao/Documents/Playground` 仍然是多个 worktree 的主仓库，不应继续作为业务开发入口。
- 本源和达尔文 worktree 仍挂在旧仓库下，但该仓库启用了 `extensions.worktreeConfig = true`，短期应优先用各自的 `config.worktree` 保存项目专属远端和 branch tracking。
- 整理前，共享配置里只剩 `origin` 和 `legacy-mixed`，两者都指向达尔文仓库 `https://github.com/orangemoon0627-sys/darwin-tradewise-ai.git`；本源专用 `benyuan` 远端和本源分支 tracking 需要重新补齐。
- 本次短期 Git 护栏会补齐 `benyuan` 和 `darwin` 两个命名远端，并把本源、达尔文分支分别绑定到自己的命名远端。
- ECS `120.26.126.88` 目前 TCP 22 和 80 可连通，但 SSH banner 和 HTTP 响应超时。服务器进入整理前必须先恢复 SSH 正常登录。

## Non Goals

- 不在本次整理里重构本源或达尔文业务代码。
- 不在服务器 SSH 异常时改动 ECS 配置。
- 不把达尔文和本源合并成一个部署单元。
- 不把本源域名备案阻塞作为代码发布阻塞。备案未完成前，本源 staging 可以继续用 IP 或内部测试入口验证。

## Recommended Approach

采用“同 ECS 强隔离”方案：本源和达尔文可以部署在同一台 Alibaba ECS 上，但所有 Git 远端、部署脚本、服务器目录、运行端口、PM2 名称、Nginx server block、环境变量和运行数据都必须分开。

如果后续 ECS 内存或服务稳定性继续出问题，再升级到“两项目分 ECS”方案。当前先不拆服务器，因为 staging 阶段更需要快速验证和低运维成本。

## Local Git Design

### Directory Ownership

- 本源：`/Users/fanhao/Documents/Playground-benyuan`
- 达尔文：`/Users/fanhao/Documents/Playground-darwin`
- 平台总控：`/Users/fanhao/Documents/Playground-platform`
- 历史混合现场：`/Users/fanhao/Documents/Playground`，只做比对和整合参考。

### Remote Ownership

- 本源 GitHub 仓库：`https://github.com/orangemoon0627-sys/benyuan.git`
- 达尔文 GitHub 仓库：`https://github.com/orangemoon0627-sys/darwin-tradewise-ai.git`

短期保留现有 worktree，但每个项目的分支必须在自己的 `config.worktree` 里显式绑定自己的远端：

- 本源 `codex/benyuan-parallel` 跟踪 `benyuan`。
- 达尔文 `codex/darwin-isolated` 跟踪达尔文专用远端，建议改名为 `darwin`，避免继续把 `origin` 当默认目标。

所有部署脚本和发布文档不得依赖裸 `origin`。脚本需要检查当前目录、当前分支和目标远端，远端不匹配时直接退出。

### Medium Term Git Cleanup

当本源和达尔文 staging 流程稳定后，把两个项目从旧 mixed worktree 迁移成真正独立 clone：

- `/Users/fanhao/Documents/Playground-benyuan` 使用独立 `.git`，只保留 `benyuan` 或 `origin -> benyuan`。
- `/Users/fanhao/Documents/Playground-darwin` 使用独立 `.git`，只保留 `darwin` 或 `origin -> darwin-tradewise-ai`。
- 旧 `/Users/fanhao/Documents/Playground` 保留为归档参考，停止作为 active git root。

这个中期清理单独执行，避免在当前有未提交部署脚本时扩大风险。

## Server Design

### Directory Layout

服务器应用统一放在 `/opt/apps`：

```text
/opt/apps/
  benyuan-staging/
    releases/
    current -> releases/<timestamp>
    shared/
      .env
      data/
      logs/
      uploads/
  darwin-staging/
    releases/
    current -> releases/<timestamp>
    shared/
      .env
      data/
      logs/
      uploads/
```

`releases` 存放每次发布产物，`current` 指向当前版本，`shared` 存放不会随发布覆盖的环境配置和持久化数据。

### Process Layout

- 本源 PM2 名称：`benyuan-staging`
- 达尔文 PM2 名称：`darwin-staging`
- 本源本地监听：`127.0.0.1:3015`
- 达尔文本地监听：`127.0.0.1:3025`

端口只绑定 `127.0.0.1`，公网只通过 Nginx 进入。

### Nginx Layout

每个项目一个独立 server block：

- 本源：`staging-benyuan.orangemoonai.cn`
- 达尔文：`staging-darwin.orangemoonai.cn`，或用户确认后的达尔文域名。

两个 server block 分别转发到各自端口，不共享 root、日志和 upstream 名称。

在 ICP 未完全完成前：

- 本源域名可能被阿里云拦截，属于备案状态问题，不等于应用部署失败。
- 服务器 IP 可用于临时验证，但 Nginx 应保留域名 server block，等备案通过后自动生效。

### Environment And Data

每个项目有自己的 `.env`：

- `/opt/apps/benyuan-staging/shared/.env`
- `/opt/apps/darwin-staging/shared/.env`

禁止两个项目共享上传目录、SQLite 文件、日志目录、缓存目录或第三方 API key 文件。确实相同的 key 也要复制到各自 `.env`，不要软链共享。

## Deployment Flow

### Local To GitHub

1. 在项目自己的目录开发。
2. 运行项目测试和构建。
3. 检查 `git remote -v` 和当前分支的 upstream。
4. 提交到项目自己的 GitHub 仓库。

### GitHub To Staging Server

短期采用本地构建、上传产物到 ECS 的方式：

1. 本地执行 `npm ci`、`npm run lint`、`npm run build`。
2. 打包必要产物和运行文件。
3. 上传到 `/opt/apps/<app>/releases/<timestamp>`。
4. 在服务器上安装生产依赖或复用随产物上传的依赖策略。
5. 切换 `current` symlink。
6. `pm2 reload <process-name>`。
7. `nginx -t` 后 reload Nginx。
8. 用 IP 或域名做 smoke test。

服务器内存偏低时，不在服务器上跑完整前端构建。

## Verification

服务器恢复 SSH 后，先执行只读盘点：

```bash
ssh -i ~/.ssh/benyuan_railway_ed25519 -o BatchMode=yes root@120.26.126.88 'echo ok; uptime; free -h; df -h; pm2 ls; ss -ltnp; nginx -T 2>/tmp/nginx.err | sed -n "1,260p"; find /opt/apps -maxdepth 3 -type d | sort'
```

整理完成后，每个项目至少验证：

- `git remote -v` 指向正确仓库。
- 当前分支 upstream 指向正确远端。
- 部署脚本 dry run 会打印目标仓库、目标主机、目标目录、PM2 名称和端口。
- `pm2 ls` 中两个进程名称不同。
- `ss -ltnp` 中两个应用端口不同。
- `nginx -t` 通过。
- 本源和达尔文访问路径不会互相命中对方应用。

## Rollback

每次发布保留最近 3 到 5 个 release。回滚步骤：

1. 找到上一个可用 release 目录。
2. 把 `/opt/apps/<app>/current` 切回该目录。
3. `pm2 reload <app-process-name>`。
4. 执行 smoke test。

本源回滚不得修改达尔文目录或达尔文 PM2 进程。达尔文回滚同理。

## Implementation Phases

### Phase 1: Local Git Guardrails

- 固定本源分支 upstream 到 `benyuan`。
- 为达尔文添加或确认专用远端名 `darwin`。
- 在部署脚本中加入目录、分支、远端、目标主机和目标目录校验。
- 写入本源和达尔文各自的 release workflow 文档。

### Phase 2: Server Inventory

- 等 ECS SSH 恢复。
- 只读盘点 PM2、Nginx、端口、目录、磁盘、内存。
- 生成服务器清单文档，标记现有达尔文和本源实际运行位置。

### Phase 3: Server Isolation

- 创建 `/opt/apps/benyuan-staging` 和 `/opt/apps/darwin-staging` 标准目录。
- 拆分 `.env`、日志、数据和上传目录。
- 固定两个 PM2 进程名和端口。
- 拆分 Nginx server block。

### Phase 4: Release Validation

- 本源执行 staging dry run 和真实发布。
- 达尔文按同样结构补齐部署脚本后发布。
- 做双项目 smoke test，确认互不影响。

## Success Criteria

- 从本源目录无法误推到达尔文 GitHub 仓库。
- 从达尔文目录无法误推到本源 GitHub 仓库。
- 本源和达尔文可以单独部署、单独重启、单独回滚。
- 本源和达尔文的 Nginx、PM2、端口、目录和数据互不共享。
- ECS 异常时可以快速判断是服务器层问题、备案问题、Nginx 问题还是应用问题。
