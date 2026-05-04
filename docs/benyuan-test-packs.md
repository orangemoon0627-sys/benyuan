# 本源 v3 测试素材包

这套测试包用于反复验证 `/collect -> /processing/benyuan -> /theater -> /processing/benyuan -> /constellation` 的完整真实链路。

## 共享清单

- 单一数据源：`/Users/fanhao/Documents/Playground/src/lib/fixtures/benyuan-v3-test-packs.json`
- 运行时导出：`/Users/fanhao/Documents/Playground/src/lib/benyuan-v3-test-packs.ts`
- 素材目录：
  - `/Users/fanhao/Documents/Playground/public/benyuan-test-packs/pack-a`
  - `/Users/fanhao/Documents/Playground/public/benyuan-test-packs/pack-b`
  - `/Users/fanhao/Documents/Playground/public/benyuan-test-packs/pack-c`

每个目录都包含：

- `music-1.png`, `music-2.png`
- `social-1.png`, `social-2.png`
- `photo-1.png`
- 同名 `.svg` 源文件，方便后续继续改文案或视觉

## 使用方式

1. 打开 `/collect`
2. 在页面顶部找到 `Test Packs`
3. 点击 `载入并上传 A/B/C 包`
4. 等待预设答案与测试图片自动注入当前会话
5. 直接点击「进入剧场并开始分析」

## 三套预设

- `A / 孤独求索者`：存在主义、深夜、深海暗流
- `B / 理性建构者`：结构化、未来导向、低波动
- `C / 温柔守护者`：关系、温度、安全感

## 审计与回归命令

- `npm run smoke:benyuan:test-packs`
  - 校验 manifest 结构、必填答案键和素材文件存在性
  - 输出：`/Users/fanhao/Documents/Playground/output/benyuan-test-pack-manifest.json`
- `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:golden`
  - 访问 `/api/internal/golden-audit` 与 `/api/internal/golden-regression`
  - 输出：
    - `/Users/fanhao/Documents/Playground/output/benyuan-golden-audit.json`
    - `/Users/fanhao/Documents/Playground/output/benyuan-golden-regression.json`
- `BENYUAN_BASE_URL=http://127.0.0.1:3015 npm run smoke:benyuan:benchmark`
  - 使用共享 manifest 依次跑 A/B/C 的真实上传、分析、剧场、星图链路
  - 输出：`/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark.json`

## 适用场景

- 验证多模态图片上传与持久化
- 验证真实 Responses API 链路
- 验证剧场脚本与星图生成
- 验证处理页 checkpoint / resume 流程
- 验证不同人格取向下的 UI 呈现差异
- 作为 iOS shell 与 Web 共用的稳定 smoke 素材底座
