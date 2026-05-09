# 本源 staging 大模型网关配置

## 目标

本源 App 和 Web 客户端只请求自己的 Next.js staging 服务，由 staging 服务端持有大模型 API Key 并调用 OpenAI-compatible 网关。不要把 API Key 写入 iOS、网页代码、GitHub 仓库或本地 `.env` 提交文件。

## 当前参数

- Provider Name: `xiaoye`
- Base URL: `https://subapi.xiaoye.lol`
- Model: `gpt-5.5`
- Reasoning Effort: `xhigh`

## 推荐操作

在本源工作区执行：

```bash
cd /Users/fanhao/Documents/Playground-benyuan
bash scripts/configure-staging-llm.sh
```

脚本会隐藏输入 API Key，写入服务器私有文件：

```text
/opt/apps/benyuan-staging/shared/benyuan-runtime.env
```

并重启 PM2：

```text
benyuan-staging
```

## 验证

```bash
BENYUAN_BASE_URL=http://120.26.126.88 BENYUAN_EXPECT_LIVE=1 npm run smoke:runtime:gate
BENYUAN_BASE_URL=http://120.26.126.88 npm run ios:shell:native-smoke
```

如果 ICP 和 HTTPS 域名已经切好，把 `BENYUAN_BASE_URL` 改成正式域名。

## 安全边界

- 不在客户端传 `api_key`。
- 不在 iOS 里硬编码供应商密钥或旧 base URL。
- 不在低配 ECS 上执行 `next build`。
- 部署脚本只读取服务器私有 env 文件并用 `pm2 --update-env` 刷新运行环境。
