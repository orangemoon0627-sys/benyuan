import { goldenRegressionSummarySnapshots } from "@/lib/golden-regression";
import { goldenBaselineDefaultVersion } from "@/lib/golden-baseline-registry";

export type GoldenBaselineFreezeCandidate = {
  version: string;
  frozenAt: string;
  sourceBaselineVersion: string;
  reportSchemaVersion: string;
  promptVersion: string;
  sampleCount: number;
  sampleIds: string[];
  freezeReason: string;
  notes: string;
  snapshots: typeof goldenRegressionSummarySnapshots;
};

export type GoldenBaselineFreezeOptions = {
  version?: string | null;
  freezeReason?: string | null;
  notes?: string | null;
  sourceBaselineVersion?: string | null;
  frozenAt?: string | null;
};

function normalizeVersion(version?: string | null) {
  const trimmed = version?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "v0.2";
}

function normalizeText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function getSingleValue(values: string[]) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  return unique.length === 1 ? unique[0] : unique.join(" | ");
}

export function buildGoldenBaselineFreezeCandidate(options: GoldenBaselineFreezeOptions = {}): GoldenBaselineFreezeCandidate {
  const version = normalizeVersion(options.version);

  return {
    version: `golden-baseline.${version}`,
    frozenAt: options.frozenAt?.trim() || new Date().toISOString(),
    sourceBaselineVersion: normalizeText(options.sourceBaselineVersion, goldenBaselineDefaultVersion),
    reportSchemaVersion: getSingleValue(goldenRegressionSummarySnapshots.map((snapshot) => snapshot.reportSchemaVersion)),
    promptVersion: getSingleValue(goldenRegressionSummarySnapshots.map((snapshot) => snapshot.promptVersion)),
    sampleCount: goldenRegressionSummarySnapshots.length,
    sampleIds: goldenRegressionSummarySnapshots.map((snapshot) => snapshot.sampleId),
    freezeReason: normalizeText(
      options.freezeReason,
      "Pending: capture the narrative, mapping, or safety change that justifies the next frozen baseline.",
    ),
    notes: normalizeText(
      options.notes,
      "Candidate artifact only. Review drift against the active baseline and record allowed drift before saving as a fixture.",
    ),
    snapshots: goldenRegressionSummarySnapshots,
  };
}
