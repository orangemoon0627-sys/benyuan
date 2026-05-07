# 本源 Beta 发布检查表

每次把本源发给测试者前，按这个顺序检查。任何红灯都先处理，不要直接把链接或 TestFlight 发出去。

## Git 与工程隔离

- 确认工作目录：`/Users/fanhao/Documents/Playground-benyuan`
- 确认分支：`codex/benyuan-parallel`
- 确认推送 remote 是 `benyuan`，不要推到 `origin`

```bash
git status --short --branch
git remote -v
```

## Web staging 闸门

```bash
npm run smoke:beta:kit
npm run lint
npm run build
npm run test:product:gate
BENYUAN_BASE_URL=http://120.26.126.88 BENYUAN_PACKS=A,B,C npm run test:product:gate
```

通过后，再部署：

```bash
npm run deploy:staging -- --skip-checks
```

部署后确认：

```bash
BENYUAN_BASE_URL=http://120.26.126.88 npm run smoke:runtime:gate
```

## iOS 原生壳闸门

```bash
npm run ios:shell:build
npm run ios:shell:testflight:preflight
```

如果准备 TestFlight 包：

```bash
npm run ios:shell:archive
npm run ios:shell:export
```

## 发测试前人工检查

- 打开 http://120.26.126.88/collect，确认页面可访问。
- 用一条 A/B/C 测试包生成出来的 `/constellation` 链接检查结果页。
- 确认反馈表链接可填写。
- 确认已知问题已经同步给测试者。
- 确认本轮测试目标：先看稳定性、结果共鸣和分享保存，不追求正式发布。
