import goldenBaselineV01 from "@/lib/fixtures/golden-baseline.v0.1.json";
import goldenBaselineV02 from "@/lib/fixtures/golden-baseline.v0.2.json";
import goldenBaselineV03 from "@/lib/fixtures/golden-baseline.v0.3.json";

export type GoldenBaselineSnapshot = (typeof goldenBaselineV01.snapshots)[number];

export type GoldenBaselineDataset = {
  version: string;
  frozenAt: string;
  snapshots: GoldenBaselineSnapshot[];
};

export type GoldenBaselineRegistryEntry = {
  id: string;
  title: string;
  notes: string;
  filePath: string;
  freezeReason: string;
  allowedDrift: string;
  schemaVersion: string;
  promptVersion: string;
  reviewerSignoff: string;
  dataset: GoldenBaselineDataset;
};

export const goldenBaselineRegistry: GoldenBaselineRegistryEntry[] = [
  {
    id: "v0.3",
    title: "v3 安全校准与 8 样本扩展基线",
    notes: "基于 report.v3.0 / prompt-template.v3 冻结，纳入 low-information 降级、高敏感/存在困惑识别，以及 deep 样本的完整 8 条覆盖。",
    filePath: "src/lib/fixtures/golden-baseline.v0.3.json",
    freezeReason: "Golden audit aligned after safety recalibration, archetype routing refinement, and expansion from 6 to 8 regression samples.",
    allowedDrift: "后续若 archetype、safety、top features、tension 或 overview 继续变动，必须重新审阅并决定是否冻结 v0.4。",
    schemaVersion: "report.v3.0",
    promptVersion: "prompt-template.v3",
    reviewerSignoff: "engineering-agent / evaluation-agent / codex",
    dataset: goldenBaselineV03,
  },
  {
    id: "v0.2",
    title: "文案分支化后的首个真实基线",
    notes: "基于 report.v0.3 / prompt.v0.2 冻结，纳入 overview、tension、recommendation 的受控叙述变体，作为新一轮回归锚点。",
    filePath: "src/lib/fixtures/golden-baseline.v0.2.json",
    freezeReason: "Controlled narrative variation landed in the report builder, changing user-visible wording while preserving evidence-backed structure.",
    allowedDrift: "允许相对 v0.1 的文案和版本字段变化；后续若 v0.2 再漂移 archetype、safety、top features 或核心 overview，需要重新审阅。",
    schemaVersion: "report.v0.3",
    promptVersion: "prompt.v0.2",
    reviewerSignoff: "evaluation-agent / engineering-agent / orchestrator-agent",
    dataset: goldenBaselineV02,
  },
  {
    id: "v0.1",
    title: "MVP 首次冻结基线",
    notes: "基于 report.v0.2 / prompt.v0.1 冻结，用于后续所有 archetype、safety、overview 漂移比对。",
    filePath: "src/lib/fixtures/golden-baseline.v0.1.json",
    freezeReason: "MVP 首个端到端版本完成，需要把真实 mapping 与动态报告输出锁定为可回归对照。",
    allowedDrift: "允许文案微调前先冻结；若 archetype、safety、top features、overview 变动，则必须记录原因。",
    schemaVersion: "report.v0.2",
    promptVersion: "prompt.v0.1",
    reviewerSignoff: "evaluation-agent / engineering-agent",
    dataset: goldenBaselineV01,
  },
].sort((left, right) => right.dataset.frozenAt.localeCompare(left.dataset.frozenAt));

export const goldenBaselineDefaultVersion = goldenBaselineRegistry[0]?.id ?? "v0.1";

export const goldenBaselineOptions = goldenBaselineRegistry.map((entry) => ({
  id: entry.id,
  version: entry.dataset.version,
  title: entry.title,
  frozenAt: entry.dataset.frozenAt,
  sampleCount: entry.dataset.snapshots.length,
}));

export function getGoldenBaselineRegistryEntry(requestedVersion?: string | null) {
  const normalized = requestedVersion?.trim();

  if (!normalized || normalized === "latest") {
    return {
      entry: goldenBaselineRegistry[0],
      requestedVersion: normalized ?? null,
      isFallback: false,
    };
  }

  const entry = goldenBaselineRegistry.find(
    (candidate) => candidate.id === normalized || candidate.dataset.version === normalized,
  );

  if (entry) {
    return {
      entry,
      requestedVersion: normalized,
      isFallback: false,
    };
  }

  return {
    entry: goldenBaselineRegistry[0],
    requestedVersion: normalized,
    isFallback: true,
  };
}
