# TradeWise AI 数据字典

## user_profile_records

单行本地用户档案：

- `id`
- `nickname`
- `trading_style`
- `preferred_market`
- `created_at`
- `updated_at`

## watch_sectors_table

关注板块列表：

- `id`
- `name`
- `created_at`

## trade_rows

交易主表：

- `id`
- `stock_code`
- `stock_name`
- `market`
- `direction`
- `price`
- `quantity`
- `amount`
- `commission`
- `trade_time`
- `reason`
- `industry_logic`
- `emotion_score`
- `ocr_image_path`
- `ocr_raw_text`
- `created_at`
- `updated_at`

## trade_reason_tag_rows

交易标签子表：

- `id`
- `trade_id`
- `tag`

## daily_review_rows

单日复盘快照：

- `id`
- `review_date`
- `summary`
- 六维评分列
- `trading_pattern`
- `win_rate`
- `profit_loss_ratio`
- `total_profit`
- `max_drawdown`
- `tomorrow_plan`
- `generator_version`
- `generated_at`
- `updated_at`

## review_trade_link_rows

复盘与交易的关联表：

- `id`
- `review_id`
- `trade_id`

## review_strength_sector_rows

复盘赛道优势表：

- `id`
- `review_id`
- `sector`
- `rank`

## research_feed_rows

本地精选研报 / 资讯缓存：

- `id`
- `market`
- `sector`
- `title`
- `summary`
- `source`
- `publish_date`
- `relevance_score`
- `content`
- `keywords_text`
- `fixture_version`
- `created_at`

## research_bookmark_rows

阅读和收藏状态：

- `id`
- `feed_id`
- `is_bookmarked`
- `is_read`
- `bookmarked_at`
- `last_read_at`

## app_kv_entries

轻量配置表：

- `key`
- `value`
- `updated_at`

V1 当前已使用的 key：

- `review.last_generated_at`
- `review.last_generator_version`
- `review.last_review_date`
