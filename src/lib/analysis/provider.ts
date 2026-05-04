import type { Mode } from "@/lib/types";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import {
  requestAnthropicAnalysisEnhancement,
  requestOpenAIAnalysisEnhancement,
  type ProviderEnhancementScope,
} from "@/lib/analysis/provider-adapters";
import { buildAnalysisPromptPayload } from "@/lib/analysis/prompt-shaping";
import { mergeAnalysisProviderEnhancement } from "@/lib/analysis/report-merge";
import type { AnalysisEngineResult, AnalysisInput, AnalysisProvider, AnalysisProviderEnhancement } from "@/lib/analysis/types";

function createUnavailableEnhancement(): Promise<AnalysisProviderEnhancement | null> {
  return Promise.resolve(null);
}

function hasEnhancementReport(enhancement: AnalysisProviderEnhancement | null | undefined) {
  return Boolean(enhancement?.report && Object.keys(enhancement.report).length > 0);
}

function mergeCompletedScopes(
  current: AnalysisProviderEnhancement["metadata"] | undefined,
  incoming: AnalysisProviderEnhancement["metadata"] | undefined,
) {
  const scopes = [...(current?.completedScopes ?? []), ...(incoming?.completedScopes ?? [])];
  return scopes.length > 0 ? [...new Set(scopes)] : undefined;
}

function mergeEnhancementMetadata(
  current: AnalysisProviderEnhancement["metadata"] | undefined,
  incoming: AnalysisProviderEnhancement["metadata"] | undefined,
  fallbackProviderId: string,
) {
  if (!current && !incoming) {
    return { providerId: fallbackProviderId };
  }

  return {
    providerId: incoming?.providerId ?? current?.providerId ?? fallbackProviderId,
    promptTemplateId: incoming?.promptTemplateId ?? current?.promptTemplateId,
    promptTemplateVersion: incoming?.promptTemplateVersion ?? current?.promptTemplateVersion,
    requestMode: incoming?.requestMode ?? current?.requestMode,
    model: incoming?.model ?? current?.model,
    requestId: incoming?.requestId ?? current?.requestId,
    completedScopes: mergeCompletedScopes(current, incoming),
    textReceived: Boolean(current?.textReceived || incoming?.textReceived),
    responsePreview: incoming?.responsePreview ?? current?.responsePreview,
  };
}

async function runOpenAIMultiPassEnhancement(
  input: AnalysisInput,
  baseline: AnalysisEngineResult,
  options: {
    providerId: string;
    model: string;
    apiKey: string;
    timeoutMs: number;
    softTimeoutMs: number;
    baseUrl?: string;
    forceStream?: boolean;
    store?: boolean;
    maxOutputTokens?: number;
    reasoningEffort?: "low" | "medium" | "high";
    mode: Mode;
  },
) {
  const prompt = buildAnalysisPromptPayload(input);
  const overallBudgetMs = Math.min(options.softTimeoutMs, options.timeoutMs);
  const startedAt = Date.now();
  let workingBaseline = baseline;
  let mergedMetadata: AnalysisProviderEnhancement["metadata"] = {
    providerId: options.providerId,
    promptTemplateId: prompt.template.id,
    promptTemplateVersion: prompt.template.version,
    requestMode: "live",
    model: options.model,
  };
  let reportChanged = false;

  const scopes: Array<{ scope: ProviderEnhancementScope; title: string; desiredTimeoutMs: number; maxOutputTokens: number }> = [
    {
      scope: "archetype_core",
      title: "原型核",
      desiredTimeoutMs: options.mode === "deep" ? 7000 : 5000,
      maxOutputTokens: 240,
    },
    {
      scope: "narrative_copy",
      title: "核心叙事镜像",
      desiredTimeoutMs: options.mode === "deep" ? 11000 : 7000,
      maxOutputTokens: 560,
    },
    {
      scope: "guidance_pack",
      title: "成长建议与相邻推荐",
      desiredTimeoutMs: options.mode === "deep" ? 9000 : 6000,
      maxOutputTokens: 420,
    },
  ];

  for (const [index, pass] of scopes.entries()) {
    const elapsedMs = Date.now() - startedAt;
    const remainingMs = overallBudgetMs - elapsedMs;
    const requestTimeoutMs = Math.min(options.timeoutMs, pass.desiredTimeoutMs, remainingMs - 1200);

    if (requestTimeoutMs < 4500) {
      break;
    }

    await input.stageReporter?.({
      key: "provider_enhanced",
      status: "running",
      detail:
        index === 0
          ? `正在生成 ${pass.title}，先让最轻的结构先落下来。`
          : `上一段已完成，继续补充 ${pass.title}。`,
    });

    try {
      const enhancement = await requestOpenAIAnalysisEnhancement(
        {
          model: options.model,
          apiKey: options.apiKey,
          timeoutMs: requestTimeoutMs,
          baseUrl: options.baseUrl,
          forceStream: options.forceStream,
          store: options.store,
          maxOutputTokens: Math.min(options.maxOutputTokens ?? pass.maxOutputTokens, pass.maxOutputTokens),
          reasoningEffort: options.reasoningEffort,
        },
        {
          providerId: options.providerId,
          prompt,
          baseline: workingBaseline,
        },
        pass.scope,
      );

      mergedMetadata = mergeEnhancementMetadata(mergedMetadata, enhancement.metadata, options.providerId);
      if (!hasEnhancementReport(enhancement)) {
        continue;
      }

      reportChanged = true;
      workingBaseline = mergeAnalysisProviderEnhancement(workingBaseline, enhancement);
    } catch {
      if (index === 0 && !reportChanged) {
        return {
          metadata: mergedMetadata,
        } satisfies AnalysisProviderEnhancement;
      }
      break;
    }
  }

  return {
    report: reportChanged ? workingBaseline.report : undefined,
    metadata: mergedMetadata,
  } satisfies AnalysisProviderEnhancement;
}

function createDisabledProvider(reason = "No external LLM provider configured."): AnalysisProvider {
  return {
    id: "provider.disabled",
    label: "Disabled Analysis Provider",
    kind: "disabled",
    available: false,
    requestMode: "stub",
    reason,
    enhance: createUnavailableEnhancement,
  };
}

function createOpenAIProvider(mode: Mode): AnalysisProvider {
  const runtime = readAnalysisRuntimeConfig(mode);
  const keyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const available = keyConfigured && runtime.liveProviderEnabled;

  return {
    id: available ? "provider.openai.live" : "provider.openai.stub",
    label: available ? "OpenAI Provider" : "OpenAI Provider Stub",
    kind: "openai",
    available,
    requestMode: runtime.providerRequestMode,
    model: runtime.openAIModel,
    reason: !keyConfigured
      ? "OPENAI_API_KEY is not configured."
      : !runtime.liveProviderEnabled
        ? "BENYUAN_LLM_LIVE is not enabled; staying in stub mode."
        : undefined,
    async enhance(input: AnalysisInput, baseline: AnalysisEngineResult) {
      const prompt = buildAnalysisPromptPayload(input);

      if (!available || !process.env.OPENAI_API_KEY) {
        return {
          metadata: {
            providerId: "provider.openai.stub",
            promptTemplateId: prompt.template.id,
            promptTemplateVersion: prompt.template.version,
            requestMode: "stub",
            model: runtime.openAIModel,
          },
        };
      }

      return runOpenAIMultiPassEnhancement(input, baseline, {
        providerId: "provider.openai.live",
        mode,
        model: runtime.openAIModel,
        apiKey: process.env.OPENAI_API_KEY,
        timeoutMs: runtime.providerTimeoutMs,
        softTimeoutMs: runtime.providerSoftTimeoutMs,
        baseUrl: process.env.BENYUAN_OPENAI_BASE_URL,
        store: false,
        maxOutputTokens: Number(process.env.BENYUAN_OPENAI_MAX_OUTPUT_TOKENS ?? 900),
        reasoningEffort: (process.env.BENYUAN_OPENAI_REASONING_EFFORT as "low" | "medium" | "high" | undefined) ?? "low",
      });
    },
  };
}

function createAnthropicProvider(mode: Mode): AnalysisProvider {
  const runtime = readAnalysisRuntimeConfig(mode);
  const keyConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  const available = keyConfigured && runtime.liveProviderEnabled;

  return {
    id: available ? "provider.anthropic.live" : "provider.anthropic.stub",
    label: available ? "Anthropic Provider" : "Anthropic Provider Stub",
    kind: "anthropic",
    available,
    requestMode: runtime.providerRequestMode,
    model: runtime.anthropicModel,
    reason: !keyConfigured
      ? "ANTHROPIC_API_KEY is not configured."
      : !runtime.liveProviderEnabled
        ? "BENYUAN_LLM_LIVE is not enabled; staying in stub mode."
        : undefined,
    async enhance(input: AnalysisInput, baseline: AnalysisEngineResult) {
      const prompt = buildAnalysisPromptPayload(input);

      if (!available || !process.env.ANTHROPIC_API_KEY) {
        return {
          metadata: {
            providerId: "provider.anthropic.stub",
            promptTemplateId: prompt.template.id,
            promptTemplateVersion: prompt.template.version,
            requestMode: "stub",
            model: runtime.anthropicModel,
          },
        };
      }

      return requestAnthropicAnalysisEnhancement(
        {
          model: runtime.anthropicModel,
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeoutMs: runtime.providerTimeoutMs,
        },
        {
          providerId: "provider.anthropic.live",
          prompt,
          baseline,
        },
        "narrative_copy",
      );
    },
  };
}

function createCustomProvider(mode: Mode): AnalysisProvider {
  const runtime = readAnalysisRuntimeConfig(mode);
  const keyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const baseUrlConfigured = Boolean(runtime.customBaseUrl);
  const available = keyConfigured && baseUrlConfigured && runtime.liveProviderEnabled;
  const label = runtime.customProviderName ? `${runtime.customProviderName.toUpperCase()} Compatible Provider` : "Custom Compatible Provider";

  return {
    id: available ? `provider.${runtime.customProviderName ?? "custom"}.live` : `provider.${runtime.customProviderName ?? "custom"}.stub`,
    label: available ? label : `${label} Stub`,
    kind: "custom",
    available,
    requestMode: runtime.providerRequestMode,
    model: runtime.customModel,
    reason: !keyConfigured
      ? "OPENAI_API_KEY is not configured for the custom provider."
      : !baseUrlConfigured
        ? "BENYUAN_CUSTOM_BASE_URL is not configured."
        : !runtime.liveProviderEnabled
          ? "BENYUAN_LLM_LIVE is not enabled; staying in stub mode."
          : undefined,
    async enhance(input: AnalysisInput, baseline: AnalysisEngineResult) {
      const prompt = buildAnalysisPromptPayload(input);

      if (!available || !process.env.OPENAI_API_KEY || !runtime.customBaseUrl) {
        return {
          metadata: {
            providerId: `provider.${runtime.customProviderName ?? "custom"}.stub`,
            promptTemplateId: prompt.template.id,
            promptTemplateVersion: prompt.template.version,
            requestMode: "stub",
            model: runtime.customModel,
          },
        };
      }

      return runOpenAIMultiPassEnhancement(input, baseline, {
        providerId: `provider.${runtime.customProviderName ?? "custom"}.live`,
        mode,
        model: runtime.customModel,
        apiKey: process.env.OPENAI_API_KEY,
        timeoutMs: runtime.providerTimeoutMs,
        softTimeoutMs: runtime.providerSoftTimeoutMs,
        baseUrl: runtime.customBaseUrl,
        forceStream: true,
        store: false,
        maxOutputTokens: Number(process.env.BENYUAN_CUSTOM_MAX_OUTPUT_TOKENS ?? 800),
        reasoningEffort: (process.env.BENYUAN_CUSTOM_REASONING_EFFORT as "low" | "medium" | "high" | undefined) ?? "low",
      });
    },
  };
}

export function resolveAnalysisProvider(options?: { mode?: Mode; provider?: string | null }) {
  const mode = options?.mode ?? "lite";
  const runtime = readAnalysisRuntimeConfig(mode, { provider: options?.provider });

  if (runtime.selectedProviderKey === "disabled") {
    return createDisabledProvider();
  }

  if (runtime.selectedProviderKey === "openai") {
    return createOpenAIProvider(mode);
  }

  if (runtime.selectedProviderKey === "anthropic") {
    return createAnthropicProvider(mode);
  }

  if (runtime.selectedProviderKey === "custom") {
    return createCustomProvider(mode);
  }

  return createDisabledProvider("Unknown provider selection.");
}
