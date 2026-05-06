# 本源 / 达尔文 Staging 服务器盘点

盘点时间：2026-05-06  
服务器：`120.26.126.88`  
用途：确认同一台 ECS 上本源和达尔文是否互相影响，并固化后续整理边界。

## 总结

当前同一台 ECS 同时运行本源和达尔文，可以作为 staging 使用。两者入口、端口和运行目录已经基本分开：

- 本源：PM2 托管，端口 `3015`，目录 `/opt/apps/benyuan-staging`。
- 达尔文：systemd 托管，端口 `3201`，目录 `/opt/darwin-api`，系统用户 `darwin`。

主要风险不是“两个项目混在一起”，而是：

- 托管方式不统一：本源用 PM2，达尔文用 systemd。
- 目录规范不统一：本源在 `/opt/apps/benyuan-staging`，达尔文在 `/opt/darwin-api`。
- 域名仍被阿里云 ICP/域名审核拦截，外部 Host 访问返回 `403 Beaver`。
- 达尔文应用本机根路径返回 `500`，需要在达尔文项目里单独排查。

## 服务器资源

- 系统可 SSH 登录。
- 内存：`1.6GiB`，可用约 `830MiB`。
- Swap：`2.0GiB`，当前未使用。
- 磁盘：`40G`，已用约 `8.1G`。
- 重启后曾出现较高 load average，后续 staging 构建仍建议尽量在本地完成，不在服务器上跑重型前端构建。

## 本源现状

### 运行方式

- PM2 进程名：`benyuan-staging`
- 状态：`online`
- 端口：`127.0.0.1:3015`
- Node：`22.22.2`
- Next：`16.1.6`
- 当前 release：`/opt/apps/benyuan-staging/releases/ca27101aea0c-20260504102841`
- 当前 symlink：`/opt/apps/benyuan-staging/current`

### 目录

```text
/opt/apps/benyuan-staging/
  current
  releases/
    ca27101aea0c-20260504102841/
```

当前本源目录已经接近推荐结构，但还缺少明确的 `shared/`、日志、数据和上传目录分层。

### Nginx

配置文件：

- `/etc/nginx/sites-available/benyuan-staging`
- `/etc/nginx/sites-enabled/benyuan-staging`

server block：

- `listen 80 default_server`
- `server_name staging-benyuan.orangemoonai.cn 120.26.126.88 _`
- 反代到 `http://127.0.0.1:3015`

### Smoke Test

- `http://120.26.126.88/` 返回 `200 OK`，命中本源。
- `http://127.0.0.1:3015/` 在服务器本机返回 `200 OK`。
- `Host: staging-benyuan.orangemoonai.cn` 访问公网 IP 返回 `403 Forbidden`，响应服务是 `Beaver`，属于阿里云侧域名/备案拦截，不是 Nginx 或本源应用返回。

## 达尔文现状

### 运行方式

- systemd 服务：`darwin-api.service`
- 状态：`active (running)`
- 系统用户：`darwin`
- 端口：`127.0.0.1:3201`
- WorkingDirectory：`/opt/darwin-api/current`
- EnvironmentFile：`/etc/darwin-api/darwin-api.env`
- 启动命令：`/usr/bin/npm run start -- -H 127.0.0.1 -p 3201`

### 目录

```text
/opt/darwin-api/
  current/
  shared/
/home/darwin/
```

达尔文当前目录和运行用户是独立的，不会直接覆盖本源。但它没有放在 `/opt/apps/darwin-staging`，也没有 releases/current/shared 的完整发布结构。

### Nginx

配置文件：

- `/etc/nginx/sites-available/darwin.orangemoonai.cn`
- `/etc/nginx/sites-enabled/darwin.orangemoonai.cn`

server block：

- `server_name darwin.orangemoonai.cn`
- 反代到 `http://127.0.0.1:3201`

### Smoke Test

- `http://127.0.0.1:3201/` 在服务器本机返回 `500 Internal Server Error`。
- `Host: darwin.orangemoonai.cn` 访问公网 IP 返回 `403 Forbidden`，响应服务是 `Beaver`，属于阿里云侧域名/备案拦截。

达尔文 `500` 应在达尔文项目内单独排查。这个错误发生在本机端口，不是本源导致。

## Git 隔离现状

本地已经采用 worktree 专属配置：

- 本源 worktree：`remote.benyuan` 指向 `https://github.com/orangemoon0627-sys/benyuan.git`
- 本源分支：`codex/benyuan-parallel` 跟踪并推送到 `benyuan`
- 达尔文 worktree：`remote.darwin` 指向 `https://github.com/orangemoon0627-sys/darwin-tradewise-ai.git`
- 达尔文分支：`codex/darwin-isolated` 跟踪并推送到 `darwin`

这比写共享 `.git/config` 更稳，因为当前旧仓库启用了 `extensions.worktreeConfig = true`。

## 推荐下一步

### 短期

保留当前运行方式，不强行迁移达尔文，避免影响同事已部署服务。

- 本源继续使用 PM2 和 `/opt/apps/benyuan-staging`。
- 达尔文继续使用 systemd 和 `/opt/darwin-api`。
- 部署文档里明确两个项目端口、目录、Nginx 文件和托管方式。
- 本源部署脚本加入 remote、分支、目录、PM2 进程和端口校验。
- 达尔文后续单独补部署脚本，校验 systemd 服务和端口。

### 中期

在达尔文业务测试空窗期，迁移成统一布局：

```text
/opt/apps/darwin-staging/
  releases/
  current
  shared/
```

迁移前先备份 `/opt/darwin-api` 和 `/etc/systemd/system/darwin-api.service`，迁移后再改 systemd `WorkingDirectory` 和 Nginx 反代。

### 不建议现在做

- 不建议现在强行把达尔文从 systemd 改成 PM2。
- 不建议现在删除 `/opt/darwin-api`。
- 不建议在 ICP 审核未完成时把域名访问 403 当成应用部署失败处理。
