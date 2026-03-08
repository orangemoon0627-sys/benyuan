import { goldenBaselineDefaultVersion, goldenBaselineRegistry } from "@/lib/golden-baseline-registry";

export type GoldenBaselineHistoryEntry = {
  id: string;
  version: string;
  title: string;
  frozenAt: string;
  sampleCount: number;
  notes: string;
  filePath: string;
  schemaVersion: string;
  promptVersion: string;
  freezeReason: string;
  allowedDrift: string;
  reviewerSignoff: string;
  isCurrent: boolean;
};

export const goldenBaselineHistory: GoldenBaselineHistoryEntry[] = goldenBaselineRegistry.map((entry) => ({
  id: entry.id,
  version: entry.dataset.version,
  title: entry.title,
  frozenAt: entry.dataset.frozenAt,
  sampleCount: entry.dataset.snapshots.length,
  notes: entry.notes,
  filePath: entry.filePath,
  schemaVersion: entry.schemaVersion,
  promptVersion: entry.promptVersion,
  freezeReason: entry.freezeReason,
  allowedDrift: entry.allowedDrift,
  reviewerSignoff: entry.reviewerSignoff,
  isCurrent: entry.id === goldenBaselineDefaultVersion,
}));
