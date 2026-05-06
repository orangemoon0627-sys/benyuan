# 本源 Staging 发布工作流（2026-05-06）

## 当前结论

本源后续开发分成两条发布线：

1. **Web / 服务端线**：Next.js 页面、API、内容、生成式 UI、报告逻辑。多数日常改动走这条线，发布到 ECS 后，iOS 壳重新打开即可看到新内容。
2. **原生 iOS 线**：Bundle ID、App 图标、启动页、WebView 壳、原生权限、原生桥接能力、TestFlight / App Store 包。只有这些变化才需要重新打包 App。

当前 staging 服务器：

```text
IP: 120.26.126.88
SSH: root@120.26.126.88
App root: /opt/apps/benyuan-staging
PM2 process: benyuan-staging
Internal port: 3015
Current public test URL: http://120.26.126.88/
Future domain after ICP: http(s)://staging-benyuan.orangemoonai.cn/
```

服务器内存较小，不适合在服务器上跑完整 `next build`。发布策略固定为：

```text
本地 lint/build -> 上传源码和 .next 产物 -> 服务器 npm ci --omit=dev -> PM2 重启 -> smoke 验证
```

## 日常 Web 发布

### 1. 本地开发

只在本源隔离工作树开发：

```bash
cd /Users/fanhao/Documents/Playground-benyuan
git status
```

确认本源专用 remote 存在：

```bash
git remote -v
```

应看到：

```text
benyuan  https://github.com/orangemoon0627-sys/benyuan.git
```

如果不是，先修正：

```bash
git config --worktree remote.benyuan.url https://github.com/orangemoon0627-sys/benyuan.git
git config --worktree remote.benyuan.fetch '+refs/heads/*:refs/remotes/benyuan/*'
git config --worktree branch.codex/benyuan-parallel.remote benyuan
git config --worktree branch.codex/benyuan-parallel.merge refs/heads/codex/benyuan-parallel
git config --worktree branch.codex/benyuan-parallel.pushRemote benyuan
```

说明：当前本源目录仍是从历史混合仓库拆出的 git worktree，旧仓库启用了 `extensions.worktreeConfig = true`。本源专属 remote 和 branch tracking 应写入本源自己的 `config.worktree`。发布脚本固定检查并使用 `benyuan` remote，避免把本源误推到达尔文仓库。

### 2. 本地验证

```bash
npm run lint
npm run build
```

重要页面可用浏览器或 Playwright 检查：

```text
/
/collect
/theater
/constellation
/lab/runtime
```

### 3. 提交并推送 GitHub

```bash
git status
git add <changed-files>
git commit -m "feat: describe the change"
git push benyuan codex/benyuan-parallel
```

如果只是想快速发 staging 让手机测试，也可以用 `--allow-dirty`，但正式节奏仍然建议先 commit。

### 4. 发布 staging

推荐命令：

```bash
npm run deploy:staging
```

如果要发布前自动 push 当前分支：

```bash
npm run deploy:staging -- --push
```

如果当前有未提交改动、但确实要临时发布：

```bash
npm run deploy:staging -- --allow-dirty
```

查看将要执行什么但不改服务器：

```bash
npm run deploy:staging:dry -- --allow-dirty
```

脚本会执行：

1. 检查 `benyuan` remote 是否是本源 GitHub 仓库。
2. 默认要求工作树干净。
3. 执行 `npm run lint`。
4. 执行 `npm run build`。
5. 通过 SSH 创建远端 release。
6. 上传源码和本地 `.next` 产物。
7. 在服务器执行 `npm ci --omit=dev`。
8. 将 `/opt/apps/benyuan-staging/current` 指向新 release。
9. 重启 PM2 进程 `benyuan-staging`。
10. 运行服务器内部 curl 检查和公网 smoke 检查。

公网 smoke 会先跑：

```bash
BENYUAN_BASE_URL=<staging-url> npm run smoke:runtime:gate
```

这个护栏保证没有显式 `BENYUAN_LLM_LIVE=1` 时，Codex 默认模型配置不会把 staging 误切成 live provider。

### 5. 发布后验证

在 ICP 通过前：

```bash
BENYUAN_BASE_URL=http://120.26.126.88 npm run smoke:runtime:page
```

ICP 通过、HTTPS 配好后：

```bash
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run smoke:runtime:page
```

服务器状态：

```bash
ssh -i ~/.ssh/benyuan_railway_ed25519 root@120.26.126.88 'pm2 ls && systemctl status nginx --no-pager'
```

## 数据与回滚

脚本会把运行时数据放到：

```text
/opt/apps/benyuan-staging/shared/data
```

每个 release 通过 symlink 使用这份共享数据，避免部署后丢上传文件或本地 JSON store。

如果新版本有问题，可 SSH 到服务器后切回旧 release：

```bash
ssh -i ~/.ssh/benyuan_railway_ed25519 root@120.26.126.88
cd /opt/apps/benyuan-staging/releases
ls -1
ln -sfn /opt/apps/benyuan-staging/releases/<old-release-id> /opt/apps/benyuan-staging/current
cd /opt/apps/benyuan-staging/current
pm2 delete benyuan-staging || true
pm2 start ./node_modules/next/dist/bin/next --name benyuan-staging -- start -p 3015 -H 127.0.0.1
pm2 save
```

## 域名与 ICP

当前 ICP 审核中，域名访问可能返回阿里云备案拦截页：

```text
Non-compliance ICP Filing
```

这不是应用错误。审核通过后执行：

1. 验证 `staging-benyuan.orangemoonai.cn` 80 访问。
2. 配置 HTTPS 证书。
3. 将 iOS shell 的 staging / production base URL 改为 HTTPS 域名。
4. 重新跑 Web smoke 与 iOS shell regression。

## iOS App 更新节奏

### 不需要重新打包 App 的改动

- Web 首页、采集页、剧场页、星座页、报告页。
- 文案、视觉样式、生成式 UI。
- Next.js API 逻辑。
- 测试包、报告 schema、prompt 逻辑。

这些改动走 Web 发布：

```text
本地改代码 -> GitHub -> npm run deploy:staging -> App 打开新 Web 内容
```

### 需要重新打包 App 的改动

- Bundle ID。
- App 图标 / App 名称。
- 启动页。
- 原生 WebView 壳。
- 原生相机、相册、推送、登录、分享等能力。
- App Store / TestFlight 元数据相关能力。

这些改动走 iOS 发布：

```text
本地改 iOS 工程 -> 模拟器/真机测试 -> Archive -> TestFlight -> App Store 审核
```

当前 iOS 壳工程：

```text
mobile/benyuan_origin_ios_shell
```

当前 Bundle ID：

```text
com.fanhao.benyuan.origin.shell
```

正式备案和上架前，建议确认是否改为：

```text
cn.orangemoonai.benyuan
```

Bundle ID 一旦备案和上架后再改，会产生额外变更成本。
