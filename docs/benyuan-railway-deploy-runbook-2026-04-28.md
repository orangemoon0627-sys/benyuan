# 本源 Railway 部署步骤（Render 登录失败后的替代方案）

## 目标

拿到一个公网 HTTPS URL，例如：

```text
https://benyuan-production.up.railway.app
```

这个 URL 后续会写入 iOS shell 的 staging / production base URL，用于 TestFlight。

## 为什么用 Railway

当前本源 Web 会写本地文件：

- `data/benyuan-v3-store.json`
- `data/benyuan-v3-uploads/`

因此需要一个可挂载持久卷的 Node/Docker 服务。Railway 支持 Dockerfile 部署，并支持 Volume。

## 仓库已准备好的文件

- `Dockerfile`
- `.dockerignore`
- `railway.json`

`railway.json` 指定：

- 使用 Dockerfile 构建
- 健康检查路径：`/collect`
- 失败自动重启

## 第一次部署步骤

### 1. 登录 Railway

打开：

```text
https://railway.com/
```

建议选择：

```text
Continue with GitHub
```

如果 GitHub 授权页面出现，允许 Railway 访问你的仓库。

### 2. 新建 Project

进入 Dashboard 后：

1. 点击 `New Project`
2. 选择 `Deploy from GitHub repo`
3. 选择本源项目仓库
4. 如果看不到仓库，点击 `Configure GitHub App`，勾选该仓库权限

### 3. 确认部署配置

Railway 应该会自动识别根目录的：

```text
Dockerfile
railway.json
```

如果它问 build method，选择：

```text
Dockerfile
```

不要选择纯 Next.js / Nixpacks / Railpack 路径。

### 4. 添加 Volume

服务创建后，进入服务页面：

1. 找到 `Volumes`
2. 点击 `Add Volume`
3. Mount Path 填：

```text
/app/data
```

4. Size 首轮可以填：

```text
5GB
```

或更稳妥：

```text
10GB
```

添加 Volume 后，重新部署一次。

### 5. 生成公网域名

进入服务页面：

1. 打开 `Settings`
2. 找到 `Networking`
3. 点击 `Generate Domain`

你会得到类似：

```text
https://xxx.up.railway.app
```

### 6. 验证页面

打开：

```text
https://xxx.up.railway.app/collect
```

如果能看到本源采集页，Web 部署成功。

## 发给 Codex 的信息

部署成功后，把这一行发回来：

```text
railway_url=https://xxx.up.railway.app
```

之后我会：

1. 回填 iOS staging / production URL
2. 跑远端 `smoke:benyuan:golden`
3. 跑 `ios:shell:regression`
4. 跑 `ios:shell:testflight:preflight`

## 常见错误

### Build failed: Dockerfile not found

确认项目根目录有：

```text
Dockerfile
railway.json
```

并且这两个文件已经 push 到 GitHub。

### Application failed to respond

检查变量里是否有：

```text
PORT
```

通常 Railway 会自动注入端口。如果仍失败，把 Deploy Logs 发给 Codex。

### 上传后数据丢失

说明没有正确添加 Volume，或 Mount Path 不是：

```text
/app/data
```

### 页面能打开，但主流程生成失败

先把 Railway Deploy Logs 发给 Codex；通常是 API 运行时、文件权限或外部模型调用配置问题。
