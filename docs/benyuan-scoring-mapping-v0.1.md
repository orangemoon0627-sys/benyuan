# 「本源」Scoring and Confidence Mapping v0.1

版本：`mapping.v0.1`

## 1. Goal

本文件定义：
- 题目如何映射到 `FeatureVector`
- 如何生成 `confidenceScore`
- 如何识别低信息量与高解释风险

适用范围：MVP 三维版本。

## 2. Core Feature Set

### 2.1 Aesthetic Features
- `aesthetic_literary_existential`
- `aesthetic_literary_tenderness`
- `aesthetic_music_intensity`
- `aesthetic_music_nocturnal`
- `aesthetic_visual_surreal`
- `aesthetic_visual_minimal`
- `aesthetic_niche_orientation`

### 2.2 Emotional Features
- `emotional_granularity`
- `emotional_depth`
- `emotional_rhythm_tidal`
- `emotional_rhythm_stable`
- `emotional_transformation`

### 2.3 Temporal Features
- `temporal_past_weight`
- `temporal_present_depth`
- `temporal_future_pull`
- `temporal_narrative_coherence`
- `temporal_change_openness`
- `temporal_meaning_density`

## 3. Mapping Principles

### 3.1 Weight Types

- `strong = 1.0`
- `medium = 0.6`
- `light = 0.3`

### 3.2 Multi-Select Normalization

对于多选题：
- 每个选项先按原始权重累计
- 再除以实际选择数量，避免多选天然抬高分值

### 3.3 Scale Question Normalization

对于 1-5 量表题：
- 映射到 `0.0 - 1.0`
- 公式：`(score - 1) / 4`

### 3.4 Text Question Contribution

开放题不直接决定主结论。
只用于：
- 提升 narrative specificity
- 提升/降低 confidence
- 为 archetype naming 提供语义素材

## 4. Question-to-Feature Mapping

### Q001 最近的内在天气
- `Q001_A` -> `emotional_depth:0.6`, `temporal_present_depth:0.3`
- `Q001_B` -> `emotional_depth:0.6`, `temporal_past_weight:0.3`
- `Q001_C` -> `emotional_rhythm_tidal:1.0`
- `Q001_D` -> `temporal_future_pull:0.6`, `temporal_change_openness:0.3`
- `Q001_E` -> `temporal_future_pull:0.6`, `emotional_depth:0.3`
- `Q001_F` -> `emotional_rhythm_stable:1.0`

### Q002 最近生活像哪段路
- `Q002_A` -> `temporal_present_depth:0.6`
- `Q002_B` -> `temporal_past_weight:0.6`, `temporal_change_openness:0.3`
- `Q002_C` -> `temporal_narrative_coherence:0.6`
- `Q002_D` -> `temporal_future_pull:1.0`
- `Q002_E` -> `temporal_meaning_density:0.6`, `temporal_present_depth:0.3`

### Q003 现在最容易被击中的片刻
- `Q003_A` -> `emotional_granularity:0.6`, `aesthetic_literary_tenderness:0.3`
- `Q003_B` -> `aesthetic_visual_minimal:0.6`, `temporal_present_depth:0.3`
- `Q003_C` -> `aesthetic_music_intensity:0.6`, `emotional_depth:0.3`
- `Q003_D` -> `temporal_past_weight:0.6`, `temporal_meaning_density:0.3`
- `Q003_E` -> `temporal_future_pull:0.6`

### Q004 情绪来临的天气系统
- `Q004_A` -> `emotional_rhythm_tidal:0.6`
- `Q004_B` -> `emotional_depth:0.6`
- `Q004_C` -> `emotional_rhythm_tidal:1.0`
- `Q004_D` -> `emotional_depth:1.0`
- `Q004_E` -> `emotional_depth:0.6`, `emotional_granularity:0.3`

### Q005 别人问你怎么了
- `Q005_A` -> `emotional_depth:0.6`
- `Q005_B` -> `emotional_granularity:0.3`
- `Q005_C` -> `emotional_granularity:1.0`
- `Q005_D` -> `emotional_transformation:0.3`
- `Q005_E` -> `emotional_depth:0.3`, `emotional_transformation:0.3`

### Q006 处理强烈情绪
- `Q006_A` -> `emotional_transformation:1.0`, `aesthetic_literary_tenderness:0.3`
- `Q006_B` -> `emotional_rhythm_stable:0.6`
- `Q006_C` -> `emotional_depth:0.3`
- `Q006_D` -> `emotional_transformation:0.6`
- `Q006_E` -> `emotional_depth:1.0`

### Q007 情绪细分能力
- scale normalized -> `emotional_granularity`

### Q008 情绪被放大的时刻
- `Q008_A` -> `aesthetic_music_nocturnal:0.3`, `emotional_depth:0.6`
- `Q008_B` -> `temporal_past_weight:0.6`, `temporal_meaning_density:0.3`
- `Q008_C` -> `emotional_depth:0.6`
- `Q008_D` -> `temporal_future_pull:0.6`
- `Q008_E` -> `aesthetic_music_intensity:0.3`, `emotional_transformation:0.3`

### Q009 对脆弱的感受
- `Q009_A` -> `emotional_depth:0.6`
- `Q009_B` -> `emotional_transformation:0.6`
- `Q009_C` -> `emotional_rhythm_stable:0.3`
- `Q009_D` -> `emotional_transformation:1.0`
- `Q009_E` -> `emotional_granularity:0.3`

### Q010 从情绪中走出来的方式
- `Q010_A` -> `emotional_granularity:0.6`, `emotional_transformation:0.3`
- `Q010_B` -> `emotional_rhythm_stable:0.6`
- `Q010_C` -> `emotional_transformation:1.0`
- `Q010_D` -> `temporal_present_depth:0.3`
- `Q010_E` -> `emotional_depth:0.3`

### Q011 文学击中方式
- `Q011_A` -> `aesthetic_literary_existential:1.0`
- `Q011_B` -> `aesthetic_literary_tenderness:0.6`, `aesthetic_music_nocturnal:0.3`
- `Q011_C` -> `aesthetic_literary_existential:0.6`, `aesthetic_visual_minimal:0.3`
- `Q011_D` -> `temporal_meaning_density:0.6`, `aesthetic_literary_existential:0.3`
- `Q011_E` -> `aesthetic_literary_tenderness:1.0`

### Q012 精神背景音
- `Q012_A` -> `aesthetic_music_nocturnal:1.0`
- `Q012_B` -> `aesthetic_music_intensity:1.0`, `emotional_depth:0.3`
- `Q012_C` -> `temporal_future_pull:0.3`, `temporal_meaning_density:0.3`
- `Q012_D` -> `aesthetic_visual_surreal:0.3`, `aesthetic_music_intensity:0.6`
- `Q012_E` -> `aesthetic_literary_tenderness:0.3`, `aesthetic_music_nocturnal:0.6`

### Q013 一下午待在哪种空间
- `Q013_A` -> `aesthetic_visual_minimal:1.0`
- `Q013_B` -> `temporal_past_weight:0.3`, `aesthetic_literary_tenderness:0.3`
- `Q013_C` -> `aesthetic_visual_surreal:1.0`
- `Q013_D` -> `aesthetic_visual_minimal:0.6`
- `Q013_E` -> `aesthetic_visual_surreal:0.6`, `temporal_meaning_density:0.3`

### Q014 会被哪种时间感打动
- `Q014_A` -> `temporal_past_weight:1.0`
- `Q014_B` -> `temporal_present_depth:1.0`
- `Q014_C` -> `temporal_future_pull:1.0`
- `Q014_D` -> `aesthetic_visual_surreal:0.6`, `temporal_meaning_density:0.6`
- `Q014_E` -> `temporal_past_weight:0.3`, `temporal_present_depth:0.3`

### Q015 本能靠近的词
- `Q015_A` -> `aesthetic_literary_existential:0.6`
- `Q015_B` -> `aesthetic_visual_surreal:0.3`, `aesthetic_music_nocturnal:0.3`
- `Q015_C` -> `temporal_meaning_density:0.3`
- `Q015_D` -> `aesthetic_visual_minimal:0.6`
- `Q015_E` -> `temporal_present_depth:0.3`
- `Q015_F` -> `emotional_rhythm_tidal:0.6`
- `Q015_G` -> `aesthetic_visual_surreal:0.6`
- `Q015_H` -> `aesthetic_niche_orientation:0.6`, `temporal_future_pull:0.3`

### Q016 对裂痕感作品的态度
- `Q016_A` -> `aesthetic_literary_tenderness:0.6`
- `Q016_B` -> `aesthetic_visual_minimal:0.3`
- `Q016_C` -> `aesthetic_visual_minimal:0.6`
- `Q016_D` -> `aesthetic_literary_tenderness:0.6`, `emotional_transformation:0.3`
- `Q016_E` -> `aesthetic_literary_existential:0.6`, `emotional_depth:0.3`

### Q017 喜欢作品时最在意的是什么
- `Q017_A` -> `emotional_granularity:0.3`, `aesthetic_literary_tenderness:0.6`
- `Q017_B` -> `aesthetic_visual_surreal:0.3`, `aesthetic_music_nocturnal:0.3`
- `Q017_C` -> `aesthetic_literary_existential:0.6`
- `Q017_D` -> `aesthetic_visual_minimal:0.3`, `emotional_granularity:0.3`
- `Q017_E` -> `temporal_meaning_density:0.3`, `emotional_transformation:0.3`

### Q018 对小众的态度
- `Q018_A` -> `aesthetic_niche_orientation:1.0`
- `Q018_B` -> `aesthetic_niche_orientation:0.3`
- `Q018_C` -> `temporal_past_weight:0.3`
- `Q018_D` -> `aesthetic_niche_orientation:0.6`
- `Q018_E` -> `temporal_present_depth:0.3`

### Q019 时间方向
- `Q019_A` -> `temporal_past_weight:1.0`
- `Q019_B` -> `temporal_present_depth:1.0`
- `Q019_C` -> `temporal_future_pull:1.0`
- `Q019_D` -> `temporal_narrative_coherence:0.6`
- `Q019_E` -> `temporal_meaning_density:0.6`

### Q020 回忆过去像什么
- `Q020_A` -> `temporal_past_weight:1.0`, `temporal_narrative_coherence:0.3`
- `Q020_B` -> `emotional_depth:0.3`, `temporal_past_weight:0.6`
- `Q020_C` -> `aesthetic_music_nocturnal:0.3`, `temporal_past_weight:0.3`
- `Q020_D` -> `temporal_narrative_coherence:0.6`, `temporal_meaning_density:0.3`
- `Q020_E` -> `temporal_future_pull:0.3`

### Q021 生命故事连贯度
- scale normalized -> `temporal_narrative_coherence`

### Q022 面对变化的内在动作
- `Q022_A` -> `temporal_change_openness:0.0`
- `Q022_B` -> `temporal_change_openness:0.6`
- `Q022_C` -> `temporal_change_openness:1.0`
- `Q022_D` -> `temporal_change_openness:0.8`, `temporal_meaning_density:0.3`
- `Q022_E` -> `temporal_meaning_density:0.6`

### Q023 击中你的作品与原因
文本增强信号：
- 若出现具体作品名 + 原因描述，`confidence +0.08`
- 若原因涉及情绪命名或审美细节，`emotional_granularity +0.1` 或相关 aesthetic feature `+0.1`
- 若只有泛泛表述，记作语义素材，不提升主特征

### Q024 给半年前自己的话
文本增强信号：
- 若出现清晰的时间参照与反思，`temporal_narrative_coherence +0.1`
- 若出现变化态度，`temporal_change_openness +0.1`
- 若有明显自我安抚/自我理解语言，`emotional_transformation +0.1`

## 5. Feature Aggregation

### 5.1 Raw Aggregation
对每个特征：
1. 累计各题权重贡献
2. 按该特征理论最大分值归一化
3. 限制在 `0..1`

### 5.2 Dimension Strength
维度强度由其下属特征均值决定：
- `aesthetic_strength`
- `emotional_strength`
- `temporal_strength`

维度文本解释优先使用：
- 高于 `0.7` 的显著特征
- 若没有高于 `0.7`，则取前 2 个最高特征

## 6. Confidence Logic

### 6.1 Confidence Score Inputs
`confidenceScore` 由五部分组成：
- 答题完成度 `0.30`
- 选项分布清晰度 `0.20`
- 特征集中度 `0.20`
- 开放题信息量 `0.15`
- 跨题一致性 `0.15`

### 6.2 Confidence Heuristics

#### 完成度
- 必答题全部完成：`1.0`
- 缺失 1-2 题：`0.7`
- 缺失 3 题以上：`0.4`

#### 选项分布清晰度
如果用户大量选择“都可以/无所谓”类型选项，降低该项分值。

#### 特征集中度
若所有特征都落在 `0.4-0.6`，说明画像不够聚焦，降低置信度。

#### 开放题信息量
- 两题都有具体内容：`1.0`
- 仅一题有内容：`0.6`
- 都跳过：`0.2`

#### 跨题一致性
例：
- 多题同时指向 `nocturnal / nostalgia / depth`，一致性高
- 若时间与审美信号完全反向且无解释素材，一致性降低

### 6.3 Confidence Band
- `0.00 - 0.39` -> `low`
- `0.40 - 0.74` -> `medium`
- `0.75 - 1.00` -> `high`

## 7. Low-Information Rules

以下任一满足则打上 `low_information`：
- 缺失超过 20% 必答题
- 两道文本题都为空，且多选题选择极少
- 关键维度没有显著特征
- 互相冲突信号过多，无法稳定形成两组张力

当 `low_information` 触发时：
- overview 长度缩短
- 少做高确定性判断
- archetype 命名更宽松、更阶段性
- recommendation 改为更轻量、更探索式

## 8. Tension Detection Rules

### 8.1 `depth_vs_stability`
触发条件示例：
- `emotional_depth > 0.70`
- `emotional_rhythm_stable > 0.55`

### 8.2 `nostalgia_vs_becoming`
触发条件示例：
- `temporal_past_weight > 0.65`
- `temporal_future_pull > 0.60`

### 8.3 `expression_vs_protection`
触发条件示例：
- `emotional_transformation > 0.65`
- 但开放题稀少或 `Q005_A/Q005_D` 类型比例高

### 8.4 `intensity_vs_gentleness`
触发条件示例：
- `aesthetic_music_intensity > 0.65`
- `aesthetic_literary_tenderness > 0.60`

## 9. Implementation Notes

- 所有题目原始答案必须保留，便于回放和调试。
- 所有 narrative claim 必须能回溯到至少一个 feature 和一个 evidence question。
- 后续若扩到七维，不重写总框架，只追加 feature namespace。
