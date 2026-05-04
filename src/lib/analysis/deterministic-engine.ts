import { buildFeatureVector } from "@/lib/feature-mapper";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { buildAnalysisPromptPayload } from "@/lib/analysis/prompt-shaping";
import { resolveAnalysisReportSchema } from "@/lib/analysis/report-schemas";
import { buildReport } from "@/lib/report-builder";
import type { AnalysisEngine } from "@/lib/analysis/types";

export const deterministicAnalysisEngine: AnalysisEngine = {
  id: "deterministic.v1",
  label: "Deterministic Narrative Engine",
  kind: "deterministic",
  supportedModes: ["lite", "deep"],
  async run(input) {
    const runtime = readAnalysisRuntimeConfig(input.session.mode);
    const prompt = buildAnalysisPromptPayload(input);
    await input.stageReporter?.({
      key: "feature_mapped",
      status: "running",
      detail: `已选择 ${prompt.template.id} / ${prompt.template.version}，开始计算特征向量。`,
    });
    const reportSchema = resolveAnalysisReportSchema(runtime.selectedReportSchemaKey, input.session.mode);
    const featureVector = buildFeatureVector(input);
    await input.stageReporter?.({
      key: "report_built",
      status: "running",
      detail: `feature vector 已生成，正在按 ${reportSchema.id} 组织报告。`,
    });
    const report = buildReport(input, featureVector);

    return {
      featureVector,
      report,
      trace: {
        engineId: "deterministic.v1",
        engineLabel: "Deterministic Narrative Engine",
        engineKind: "deterministic",
        providerId: "provider.disabled",
        providerKind: "disabled",
        providerAvailable: false,
        providerRequestMode: "stub",
        promptTemplateId: prompt.template.id,
        promptTemplateVersion: prompt.template.version,
        reportSchemaId: reportSchema.id,
        reportSchemaVersion: reportSchema.version,
        answeredCount: prompt.summary.answeredCount,
        openReflectionCount: prompt.summary.openReflectionCount,
        topSignals: prompt.summary.topSignals,
        effectiveRuntime: "deterministic",
      },
    };
  },
};
