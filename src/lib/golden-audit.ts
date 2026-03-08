import { goldenSampleDefinitions } from "@/lib/fixtures/golden-samples";
import { goldenRegressionSnapshots } from "@/lib/golden-regression";

export type GoldenAuditCheck = {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
};

export type GoldenAuditResult = {
  sampleId: string;
  title: string;
  status: "pass" | "fail";
  passedChecks: number;
  failedChecks: number;
  checks: GoldenAuditCheck[];
};

function formatList(values: string[]) {
  return values.length > 0 ? values.join(" / ") : "无";
}

function includesAny(source: string, candidates: string[]) {
  return candidates.some((candidate) => source.includes(candidate));
}

export const goldenAuditResults: GoldenAuditResult[] = goldenRegressionSnapshots.map((snapshot, index) => {
  const definition = goldenSampleDefinitions[index];
  const checks: GoldenAuditCheck[] = [];
  const topFeatureKeys = snapshot.topFeatures.map((feature) => feature.key);
  const tensionNames = snapshot.report.tensions.map((tension) => tension.name);
  const overview = snapshot.report.overview;
  const archetypeName = snapshot.report.archetype.name;
  const safetyFlags = snapshot.report.safetyFlags;

  if (definition.audit.confidenceBand) {
    checks.push({
      label: "confidence band",
      passed: snapshot.report.confidenceBand === definition.audit.confidenceBand,
      expected: definition.audit.confidenceBand,
      actual: snapshot.report.confidenceBand,
    });
  }

  if (definition.audit.archetypeAnyOf?.length) {
    checks.push({
      label: "archetype keywords",
      passed: includesAny(archetypeName, definition.audit.archetypeAnyOf),
      expected: formatList(definition.audit.archetypeAnyOf),
      actual: archetypeName,
    });
  }

  if (definition.audit.requiredSafetyFlags?.length) {
    const missing = definition.audit.requiredSafetyFlags.filter((flag) => !safetyFlags.includes(flag));
    checks.push({
      label: "required safety flags",
      passed: missing.length === 0,
      expected: formatList(definition.audit.requiredSafetyFlags),
      actual: formatList(safetyFlags),
    });
  }

  if (definition.audit.forbiddenSafetyFlags?.length) {
    const violated = definition.audit.forbiddenSafetyFlags.filter((flag) => safetyFlags.includes(flag));
    checks.push({
      label: "forbidden safety flags",
      passed: violated.length === 0,
      expected: `not ${formatList(definition.audit.forbiddenSafetyFlags)}`,
      actual: violated.length > 0 ? formatList(violated) : "clean",
    });
  }

  if (definition.audit.requiredTopFeatures?.length) {
    const missing = definition.audit.requiredTopFeatures.filter((feature) => !topFeatureKeys.includes(feature));
    checks.push({
      label: "top feature alignment",
      passed: missing.length === 0,
      expected: formatList(definition.audit.requiredTopFeatures),
      actual: formatList(topFeatureKeys),
    });
  }

  if (definition.audit.tensionAnyOf?.length) {
    checks.push({
      label: "tension keywords",
      passed: tensionNames.some((name) => includesAny(name, definition.audit.tensionAnyOf ?? [])),
      expected: formatList(definition.audit.tensionAnyOf),
      actual: formatList(tensionNames),
    });
  }

  if (definition.audit.overviewAnyOf?.length) {
    checks.push({
      label: "overview language",
      passed: includesAny(overview, definition.audit.overviewAnyOf),
      expected: formatList(definition.audit.overviewAnyOf),
      actual: overview,
    });
  }

  const failedChecks = checks.filter((check) => !check.passed).length;

  return {
    sampleId: snapshot.sampleId,
    title: snapshot.title,
    status: failedChecks === 0 ? "pass" : "fail",
    passedChecks: checks.length - failedChecks,
    failedChecks,
    checks,
  };
});

export const goldenAuditSummary = {
  total: goldenAuditResults.length,
  passed: goldenAuditResults.filter((result) => result.status === "pass").length,
  failed: goldenAuditResults.filter((result) => result.status === "fail").length,
};
