import { buildFeatureVector } from "@/lib/feature-mapper";
import { goldenSampleDefinitions, goldenSampleSessions } from "@/lib/fixtures/golden-samples";
import { buildReport } from "@/lib/report-builder";

export type GoldenRegressionSummarySnapshot = {
  sampleId: string;
  title: string;
  archetypeName: string;
  confidenceBand: string;
  safetyFlags: string[];
  topFeatures: Array<{ key: string; score: number }>;
  tensionNames: string[];
  overview: string;
  reportSchemaVersion: string;
  promptVersion: string;
};

export type GoldenRegressionSnapshot = {
  sampleId: string;
  title: string;
  summary: string;
  expectation: string;
  session: (typeof goldenSampleSessions)[number];
  vector: ReturnType<typeof buildFeatureVector>;
  report: ReturnType<typeof buildReport>;
  topFeatures: Array<{ key: string; score: number }>;
};

export const goldenRegressionSnapshots: GoldenRegressionSnapshot[] = goldenSampleSessions.map((session, index) => {
  const definition = goldenSampleDefinitions[index];
  const vector = buildFeatureVector(session);
  const report = buildReport(session, vector);
  const topFeatures = Object.entries(vector.values)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([key, score]) => ({ key, score: Number(score.toFixed(3)) }));

  return {
    sampleId: definition.sampleId,
    title: definition.title,
    summary: definition.summary,
    expectation: definition.expectation,
    session,
    vector,
    report,
    topFeatures,
  };
});

export const goldenRegressionSummarySnapshots: GoldenRegressionSummarySnapshot[] = goldenRegressionSnapshots.map((snapshot) => ({
  sampleId: snapshot.sampleId,
  title: snapshot.title,
  archetypeName: snapshot.report.archetype.name,
  confidenceBand: snapshot.report.confidenceBand,
  safetyFlags: snapshot.report.safetyFlags,
  topFeatures: snapshot.topFeatures,
  tensionNames: snapshot.report.tensions.map((tension) => tension.name),
  overview: snapshot.report.overview,
  reportSchemaVersion: snapshot.report.reportSchemaVersion,
  promptVersion: snapshot.report.promptVersion,
}));
