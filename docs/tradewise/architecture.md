# TradeWise AI 架构说明

## 目标边界

- 当前仓库仍以 Next.js Web 为主。
- Flutter 客户端侧挂在 `mobile/tradewise_ai/`，Web 侧仅新增 `tradewise/*` API contract，不改现有主流程页面结构。
- V1 采用本地优先、Mock-first：先跑通录入、复盘、成长、研报三大页面的真实交互，再逐步切到真实 AI 与资讯源。

## 目录策略

```text
mobile/tradewise_ai/
├── lib/
│   ├── app/
│   ├── core/
│   └── features/
│       ├── trade_capture/
│       ├── review/
│       ├── dashboard/
│       ├── research/
│       └── settings/
├── assets/fixtures/
├── test/
└── tool/
```

## 关键决策

### feature-first

每个 feature 内部保持轻量 clean boundary：

- `domain/`：实体、仓储接口、服务接口
- `data/`：repository 实现、本地数据源、mock/live generator/source
- `presentation/`：providers、pages、widgets

### 本地数据库

- 使用 Drift + SQLite 建立本地主档案。
- 复盘、关注板块、书签、交易理由标签都用独立表，不再把一等数据塞进 JSON 文本列。
- `daily_reviews` 按天唯一，避免“一笔交易一篇日复盘”的混乱模型。
- `app_kv` 用于缓存最近一次复盘生成时间、版本、日期，以及 research feed 当前版本。

### Mock 与 Live 的切分

当前已经存在四层边界：

- 移动端 `MockReviewGenerator`
- 移动端 `LiveReviewGenerator`
- 移动端 `LocalFixtureResearchFeedSource` / `LiveResearchFeedSource`
- Web 侧 `POST /api/tradewise/review/generate` / `GET /api/tradewise/research/feed`

Flutter 通过 `TRADEWISE_REVIEW_MODE`、`TRADEWISE_RESEARCH_MODE` 和两个 endpoint override 做切换，默认仍走 mock。

## 页面流

- `/trade`：拍照/相册/粘贴原文 -> OCR 草稿 -> 人工确认 -> 保存交易
- `/growth`：手动触发“生成今日复盘” -> 最近生成记录 -> 六维评分、成长趋势、历史复盘
- `/research`：本地或服务端 feed -> 板块筛选 -> 阅读详情 -> 收藏
- `/settings`：本地用户档案与关注板块管理

## 当前实现状态

已实现：

- Flutter 工程骨架与依赖声明
- App 主题、底部导航、路由
- Drift schema 与 DAO 设计
- Trade / Review / Research / Settings repository 边界
- 三大页面与详情页骨架
- 测试骨架与 fixture 数据
- Android / iOS native shell 已生成并补齐最低版本与权限补丁
- 复盘同日覆盖逻辑（按 `review_date` 稳定更新，不重复膨胀）
- `app_kv` 复盘生成元数据缓存（最近生成时间/版本/日期）
- Growth 页面显示最近一次复盘生成记录
- Research feed 版本缓存与源版本刷新策略
- `LocalReviewRepository`、`LocalResearchRepository`、`LiveResearchFeedSource` 测试覆盖
- Growth 页面空态/有数据态/手动生成 CTA Widget 测试覆盖
- Web 侧 `tradewise/review/generate` mock/anthropic provider route 已落地
- Web 侧 `tradewise/research/feed` route 已落地

当前建议的回归命令：

1. `cd mobile/tradewise_ai && ./tool/flutterw analyze`
2. `cd mobile/tradewise_ai && ./tool/flutterw test`
3. `cd mobile/tradewise_ai && ./tool/flutterw build apk --debug`
4. `cd mobile/tradewise_ai && ./tool/flutterw build ios --simulator`
5. `npx eslint src/app/api/tradewise/review/generate/route.ts src/app/api/tradewise/research/feed/route.ts src/lib/tradewise/*.ts`
6. `npx tsc --noEmit --pretty false`
