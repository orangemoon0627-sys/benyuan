# 本源内部管理面访问控制

生产环境中的 `/lab/*`、`/agent/*`、`/api/internal/*`、`/api/agent/*` 和 `/api/analysis/runtime` 默认不可访问。

## 配置

在服务端私有环境变量中设置高熵随机值：

```text
BENYUAN_INTERNAL_ACCESS_TOKEN=<random-secret>
```

不要把该值写入仓库、客户端、截图或日志。未配置时，生产环境统一返回 `404`；本地开发环境保持可访问。

## 访问

- API/脚本：`Authorization: Bearer <token>`
- 浏览器：Basic Auth，用户名固定为 `benyuan`，密码为上述 token

更换 token 后需要重启服务，并同步更新仅限内部使用的 smoke 环境变量。
