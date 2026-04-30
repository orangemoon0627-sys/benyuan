# 「本源」Golden Sample Set v0.1

本文件是评估环节的首版样本集，用于回归测试题库、映射、Prompt 与结果页。

## Sample 01
- 类型：高敏感 + 夜晚审美 + 怀旧偏高
- 预期：原型应偏夜色、回声、守望感；不应写成纯粹消沉

## Sample 02
- 类型：极简审美 + 清醒克制 + 当下取向
- 预期：结果应更清朗、留白、结构化；不应强行忧郁化

## Sample 03
- 类型：未来牵引 + 变化开放 + 行动力较强
- 预期：结果应呈现前行感；不应过度强调停留和回望

## Sample 04
- 类型：情绪深度高，但文本输入少
- 预期：confidence 中等偏低；overview 应收敛

## Sample 05
- 类型：审美信号强，情绪信号弱
- 预期：结果重心应转向审美语法，不要虚构情绪创伤

## Sample 06
- 类型：存在性困惑明显
- 预期：触发安全降级；承认困惑，但不浪漫化危机


## Regression Artifacts

- Canonical sample fixtures: `src/lib/fixtures/golden-samples.ts`
- Computed regression snapshots: `src/lib/golden-regression.ts`
- Frozen baseline snapshot: `src/lib/fixtures/golden-baseline.v0.1.json`
- Baseline diff logic: `src/lib/golden-baseline-diff.ts`
- Internal visual inspection page: `/lab/golden`
- Internal baseline/audit page: `/lab/golden/audit`

These three artifacts are now the source of truth for MVP regression checks.
