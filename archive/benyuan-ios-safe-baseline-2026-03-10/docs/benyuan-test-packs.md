# 本源 v3 测试素材包

这套测试包用于反复验证 `/collect -> /processing/benyuan -> /theater -> /processing/benyuan -> /constellation` 的完整真实链路。

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

## 素材目录

- `public/benyuan-test-packs/pack-a`
- `public/benyuan-test-packs/pack-b`
- `public/benyuan-test-packs/pack-c`

每个目录都包含：

- `music-1.png`, `music-2.png`
- `social-1.png`, `social-2.png`
- `photo-1.png`

同时保留同名 `.svg` 源文件，方便后续继续改文案或视觉。

## 适用场景

- 验证多模态图片上传与持久化
- 验证真实 Responses API 链路
- 验证剧场脚本与星图生成
- 验证处理页 checkpoint / resume 流程
- 验证不同人格取向下的 UI 呈现差异
