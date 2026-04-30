import { goldenRegressionSummarySnapshots } from "@/lib/golden-regression";
import {
  getGoldenBaselineRegistryEntry,
  goldenBaselineDefaultVersion,
  goldenBaselineOptions,
  type GoldenBaselineSnapshot,
} from "@/lib/golden-baseline-registry";

export type GoldenBaselineDrift = {
  field: string;
  baseline: string;
  current: string;
};

export type GoldenBaselineDiffResult = {
  sampleId: string;
  title: string;
  status: "unchanged" | "drifted" | "missing_baseline";
  driftCount: number;
  drifts: GoldenBaselineDrift[];
};

export type GoldenBaselineSummary = {
  requestedVersion: string | null;
  resolvedVersion: string;
  fixtureVersion: string;
  title: string;
  frozenAt: string;
  total: number;
  filePath: string;
  schemaVersion: string;
  promptVersion: string;
  isFallback: boolean;
  defaultVersion: string;
};

function formatTopFeatures(snapshot: { topFeatures: Array<{ key: string; score: number }> }) {
  return snapshot.topFeatures.map((feature) => `${feature.key}:${feature.score}`).join(" | ");
}

function formatList(values: string[]) {
  return values.join(" | ");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 180) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function compareField(drifts: GoldenBaselineDrift[], field: string, baseline: string, current: string) {
  if (baseline !== current) {
    drifts.push({ field, baseline, current });
  }
}

export function buildGoldenBaselineDiff(baselineVersion?: string | null) {
  const { entry, requestedVersion, isFallback } = getGoldenBaselineRegistryEntry(baselineVersion);
  const baselineSnapshots = entry.dataset.snapshots as GoldenBaselineSnapshot[];

  const diffResults: GoldenBaselineDiffResult[] = goldenRegressionSummarySnapshots.map((snapshot) => {
    const baseline = baselineSnapshots.find((candidate) => candidate.sampleId === snapshot.sampleId);

    if (!baseline) {
      return {
        sampleId: snapshot.sampleId,
        title: snapshot.title,
        status: "missing_baseline",
        driftCount: 1,
        drifts: [{ field: "baseline", baseline: "missing", current: snapshot.sampleId }],
      };
    }

    const drifts: GoldenBaselineDrift[] = [];
    compareField(drifts, "archetype", baseline.archetypeName, snapshot.archetypeName);
    compareField(drifts, "confidence", baseline.confidenceBand, snapshot.confidenceBand);
    compareField(drifts, "safety", formatList(baseline.safetyFlags), formatList(snapshot.safetyFlags));
    compareField(drifts, "top_features", formatTopFeatures(baseline), formatTopFeatures(snapshot));
    compareField(drifts, "tensions", formatList(baseline.tensionNames), formatList(snapshot.tensionNames));
    compareField(drifts, "overview", truncate(normalizeText(baseline.overview)), truncate(normalizeText(snapshot.overview)));
    compareField(drifts, "report_schema", baseline.reportSchemaVersion, snapshot.reportSchemaVersion);
    compareField(drifts, "prompt_version", baseline.promptVersion, snapshot.promptVersion);

    return {
      sampleId: snapshot.sampleId,
      title: snapshot.title,
      status: drifts.length === 0 ? "unchanged" : "drifted",
      driftCount: drifts.length,
      drifts,
    };
  });

  const baselineSummary: GoldenBaselineSummary = {
    requestedVersion,
    resolvedVersion: entry.id,
    fixtureVersion: entry.dataset.version,
    title: entry.title,
    frozenAt: entry.dataset.frozenAt,
    total: entry.dataset.snapshots.length,
    filePath: entry.filePath,
    schemaVersion: entry.schemaVersion,
    promptVersion: entry.promptVersion,
    isFallback,
    defaultVersion: goldenBaselineDefaultVersion,
  };

  const diffSummary = {
    total: diffResults.length,
    unchanged: diffResults.filter((result) => result.status === "unchanged").length,
    drifted: diffResults.filter((result) => result.status === "drifted").length,
    missingBaseline: diffResults.filter((result) => result.status === "missing_baseline").length,
  };

  return {
    baselineSummary,
    diffResults,
    diffSummary,
    availableBaselines: goldenBaselineOptions,
  };
}

const defaultComparison = buildGoldenBaselineDiff();

export const goldenBaselineSummary = defaultComparison.baselineSummary;
export const goldenBaselineDiffResults = defaultComparison.diffResults;
export const goldenBaselineDiffSummary = defaultComparison.diffSummary;
export const goldenBaselineAvailableVersions = defaultComparison.availableBaselines;
