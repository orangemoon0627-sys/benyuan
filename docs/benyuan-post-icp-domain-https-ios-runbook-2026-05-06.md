# 本源 ICP 通过后域名 / HTTPS / iOS 切换 Runbook

日期：2026-05-06  
适用阶段：阿里云 ICP / App 备案审核通过后  
当前域名：`staging-benyuan.orangemoonai.cn`  
当前 ECS：`120.26.126.88`

## 官方依据

阿里云文档说明：

- 收到工信部备案成功短信后，备案信息仍需要时间同步到阿里云；同步期间可以先设置域名解析，待同步完成后网站即可指向阿里云服务器开通访问。
- 如果备案刚通过但访问仍被阻断，可能是管局信息还未同步到阿里云系统，等待同步完成即可。
- 在中国内地服务器部署 Nginx SSL 证书前，应确认域名已完成 ICP 备案，并且 A 记录已解析到服务器公网 IP。

参考：

- https://help.aliyun.com/zh/icp-filing/basic-icp-service/support/after-receiving-the-miit-message-needs-to-be-done
- https://help.aliyun.com/zh/cdn/why-is-the-icp-filing-of-a-domain-name-suspended-and-how-do-i-handle-the-issue
- https://help.aliyun.com/zh/ssl-certificate/user-guide/install-ssl-certificates-on-nginx-servers-or-tengine-servers

## 阶段 0：现在不要做的事

ICP备案未通过前：

- 不把 `403 Beaver` 当成本源应用 bug。
- 不把 iOS 壳正式切到域名。
- 不配置正式 HTTPS 作为上线门槛。
- 不对外发域名入口。

当前继续使用：

```text
本源 Web staging: http://120.26.126.88/
```

## 阶段 1：收到备案成功短信后

### 1.1 等待阿里云同步

收到工信部短信只表示管局审核通过。阿里云侧可能还需要同步，期间域名访问仍可能被阻断。

建议检查：

```bash
curl -I --max-time 10 -H 'Host: staging-benyuan.orangemoonai.cn' http://120.26.126.88/
```

判断：

- 返回 `403` 且 `Server: Beaver`：仍是阿里云备案/接入拦截。
- 返回 `200` 且 `Server: nginx/1.18.0`：已进入本源 Nginx。
- 返回 `502/504` 且 `Server: nginx/1.18.0`：Nginx 已进来，但后端或 PM2 有问题。

### 1.2 确认 DNS A 记录

在 DNSPod 或当前权威 DNS 控制台确认：

```text
staging-benyuan.orangemoonai.cn  A  120.26.126.88
```

本机验证：

```bash
dig staging-benyuan.orangemoonai.cn A
curl -I --max-time 10 http://staging-benyuan.orangemoonai.cn/
```

如果控制台显示正确但本机仍旧，直接查权威 NS，不只看递归缓存。

## 阶段 2：HTTP 域名验收

HTTP 域名能访问后，先跑 Web smoke：

```bash
BENYUAN_BASE_URL=http://staging-benyuan.orangemoonai.cn npm run smoke:runtime:gate
BENYUAN_BASE_URL=http://staging-benyuan.orangemoonai.cn npm run smoke:runtime:page
BENYUAN_BASE_URL=http://staging-benyuan.orangemoonai.cn npm run smoke:runtime:hybrid
BENYUAN_BASE_URL=http://staging-benyuan.orangemoonai.cn npm run smoke:flow
BENYUAN_BASE_URL=http://staging-benyuan.orangemoonai.cn npm run smoke:flow:deep
```

服务器侧确认：

```bash
ssh -i ~/.ssh/benyuan_railway_ed25519 root@120.26.126.88 'pm2 ls && nginx -t && readlink /opt/apps/benyuan-staging/current'
```

通过标准：

- 域名 HTTP 不再返回 `403 Beaver`。
- `/` 返回 `200`。
- `/lab/runtime` 返回 `200`。
- `smoke:flow` 和 `smoke:flow:deep` 通过。

## 阶段 3：配置 HTTPS

### 3.1 准备证书

在阿里云数字证书管理服务中申请或下载匹配域名的证书：

```text
staging-benyuan.orangemoonai.cn
```

证书文件应包含：

```text
fullchain.pem 或 <domain>.pem
privkey.key 或 <domain>.key
```

上传到服务器建议目录：

```text
/etc/nginx/ssl/staging-benyuan.orangemoonai.cn/fullchain.pem
/etc/nginx/ssl/staging-benyuan.orangemoonai.cn/privkey.key
```

权限建议：

```bash
chmod 600 /etc/nginx/ssl/staging-benyuan.orangemoonai.cn/privkey.key
chmod 644 /etc/nginx/ssl/staging-benyuan.orangemoonai.cn/fullchain.pem
```

### 3.2 Nginx 配置

修改：

```text
/etc/nginx/sites-available/benyuan-staging
```

目标结构：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name staging-benyuan.orangemoonai.cn 120.26.126.88 _;

    if ($host = staging-benyuan.orangemoonai.cn) {
        return 301 https://$host$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:3015;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name staging-benyuan.orangemoonai.cn;

    client_max_body_size 20m;
    ssl_certificate /etc/nginx/ssl/staging-benyuan.orangemoonai.cn/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/staging-benyuan.orangemoonai.cn/privkey.key;

    location / {
        proxy_pass http://127.0.0.1:3015;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

验证并 reload：

```bash
nginx -t
systemctl reload nginx
```

### 3.3 HTTPS 验收

```bash
curl -I --max-time 10 https://staging-benyuan.orangemoonai.cn/
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run smoke:runtime:gate
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run smoke:runtime:page
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run smoke:flow
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run smoke:flow:deep
```

通过标准：

- HTTPS 证书有效。
- HTTP 自动跳 HTTPS。
- Web smoke 通过。

## 阶段 4：iOS 壳切换域名

HTTPS 通过后再改 iOS 壳，不要提前改。

### 4.1 修改 base URL

目标文件：

```text
mobile/benyuan_origin_ios_shell/project.yml
```

把 staging / release URL 从占位域名改为：

```text
https://staging-benyuan.orangemoonai.cn
```

正式 production 域名未确认前，Release 可以先保持不可对外发布的占位，避免误发。

### 4.2 自动化回归

```bash
npm run ios:shell:build
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run ios:shell:regression
BENYUAN_BASE_URL=https://staging-benyuan.orangemoonai.cn npm run ios:shell:native-smoke
```

如果要进入 TestFlight，还需要：

```bash
npm run ios:shell:testflight:preflight
```

通过标准：

- iOS shell build 通过。
- WebView 能打开 HTTPS 域名。
- 相机、相册、分享、外链桥接继续通过。
- staging URL 不再是 `.invalid`。

## 阶段 5：上线前检查

必须满足：

- ICP / App 备案状态已通过。
- HTTP 域名不再 `403 Beaver`。
- HTTPS 证书有效。
- 本源 PM2：`benyuan-staging` online。
- 达尔文 systemd：`darwin-api.service` active，且没有占用本源端口。
- 本源 Git remote / branch tracking 指向 `benyuan`。
- `npm run deploy:staging` 可重跑。
- staging smoke 通过。
- iOS 壳以 HTTPS 域名完成回归。

## 回滚

### Web 回滚

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

### HTTPS 回滚

如果证书配置导致访问失败：

```bash
cp /etc/nginx/sites-available/benyuan-staging.bak /etc/nginx/sites-available/benyuan-staging
nginx -t
systemctl reload nginx
```

### iOS 回滚

如果 iOS 壳切域名后异常：

- 暂停 TestFlight 外部分发。
- 回退 `project.yml` 的 staging/release URL。
- 重跑 `ios:shell:build` 与 `ios:shell:regression`。
