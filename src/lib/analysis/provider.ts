import type { Mode } from "@/lib/types";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { requestAnthropicAnalysisEnhancement, requestOpenAIAnalysisEnhancement } from "@/lib/analysis/provider-adapters";
import { buildAnalysisPromptPayload } from "@/lib/analysis/prompt-shaping";
import type { AnalysisEngineResult, AnalysisInput, AnalysisProvider, AnalysisProviderEnhancement } from "@/lib/analysis/types";

function createUnavailableEnhancement(): Promise<AnalysisProviderEnhancement | null> {
  return Promise.resolve(null);
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

      return requestOpenAIAnalysisEnhancement(
        {
          model: runtime.openAIModel,
          apiKey: process.env.OPENAI_API_KEY,
          timeoutMs: runtime.providerTimeoutMs,
        },
        {
          providerId: "provider.openai.live",
          prompt,
          baseline,
        },
      );
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
      );
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

  return createDisabledProvider("Unknown provider selection.");
}
