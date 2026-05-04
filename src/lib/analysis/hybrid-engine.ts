import { deterministicAnalysisEngine } from "@/lib/analysis/deterministic-engine";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { mergeAnalysisProviderEnhancement } from "@/lib/analysis/report-merge";
import { resolveAnalysisProvider } from "@/lib/analysis/provider";
import type { AnalysisEngine } from "@/lib/analysis/types";

export const hybridAnalysisEngine: AnalysisEngine = {
  id: "hybrid.v1",
  label: "Hybrid Narrative Engine",
  kind: "llm",
  supportedModes: ["lite", "deep"],
  async run(input) {
    await input.stageReporter?.({
      key: "prompt_shaped",
      status: "running",
      detail: "正在根据当前题集、mode 与 prompt template 整形 provider 输入。",
    });
    const baseline = await deterministicAnalysisEngine.run(input);
    const runtime = readAnalysisRuntimeConfig(input.session.mode);
    const provider = resolveAnalysisProvider({ mode: input.session.mode });

    const tracedBaseline = {
      ...baseline,
      trace: {
        ...baseline.trace,
        engineId: "hybrid.v1",
        engineLabel: "Hybrid Narrative Engine",
        engineKind: "llm" as const,
        providerId: provider.id,
        providerKind: provider.kind,
        providerAvailable: provider.available,
        providerRequestMode: provider.requestMode,
        providerModel: provider.model,
        effectiveRuntime: provider.available ? "hybrid_provider" : "deterministic_fallback",
      },
    };

    if (!provider.available) {
      await input.stageReporter?.({
        key: "provider_enhanced",
        status: "skipped",
        detail: `provider ${provider.id} 当前不可用，直接回退 deterministic 输出。`,
      });
      return {
        ...tracedBaseline,
        trace: {
          ...tracedBaseline.trace,
          providerEnhancementStatus: "skipped",
        },
      };
    }

    await input.stageReporter?.({
      key: "provider_enhanced",
      status: "running",
      detail: `正在请求 ${provider.id} / ${provider.model ?? "default-model"} 做叙事增强。`,
    });

    const providerStartedAt = Date.now();
    const enhancementPromise = provider.enhance(input, tracedBaseline).catch(() => null);
    const enhancement = await Promise.race([
      enhancementPromise,
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), Math.min(runtime.providerSoftTimeoutMs, runtime.providerTimeoutMs));
      }),
    ]);

    const hasEnhancementReport = Boolean(enhancement?.report && Object.keys(enhancement.report).length > 0);

    if (!enhancement) {
      await input.stageReporter?.({
        key: "report_built",
        status: "running",
        detail: `外部增强超过 ${Math.min(runtime.providerSoftTimeoutMs, runtime.providerTimeoutMs)}ms，正在回退 deterministic 报告。`,
      });
      return {
        ...tracedBaseline,
        trace: {
          ...tracedBaseline.trace,
          effectiveRuntime: "deterministic_fallback",
          providerEnhancementStatus: "timed_out",
          providerLatencyMs: Math.min(runtime.providerSoftTimeoutMs, runtime.providerTimeoutMs),
          providerFallbackReason: `soft-timeout-${Math.min(runtime.providerSoftTimeoutMs, runtime.providerTimeoutMs)}ms`,
        },
      };
    }

    if (!hasEnhancementReport) {
      await input.stageReporter?.({
        key: "report_built",
        status: "running",
        detail: "外部增强已返回，但没有产出可合并的结构化字段，正在回退 deterministic 报告。",
      });
      return {
        ...tracedBaseline,
        trace: {
          ...tracedBaseline.trace,
          effectiveRuntime: "deterministic_fallback",
          providerEnhancementStatus: "empty",
          providerLatencyMs: Date.now() - providerStartedAt,
          providerFallbackReason: enhancement.metadata?.textReceived ? "no-structured-json" : "empty-provider-response",
          providerCompletedScopes: enhancement.metadata?.completedScopes,
          providerTextReceived: enhancement.metadata?.textReceived,
          providerResponsePreview: enhancement.metadata?.responsePreview,
        },
      };
    }

    await input.stageReporter?.({
      key: "report_built",
      status: "running",
      detail: "外部增强已返回，正在合并 provider 输出并生成最终报告。",
    });

    const merged = mergeAnalysisProviderEnhancement(tracedBaseline, enhancement);
    return {
      ...merged,
      trace: {
        ...merged.trace,
        providerEnhancementStatus: "completed",
        providerLatencyMs: Date.now() - providerStartedAt,
        providerCompletedScopes: enhancement.metadata?.completedScopes ?? merged.trace.providerCompletedScopes,
        providerTextReceived: enhancement.metadata?.textReceived ?? merged.trace.providerTextReceived,
        providerResponsePreview: enhancement.metadata?.responsePreview ?? merged.trace.providerResponsePreview,
      },
    };
  },
};
