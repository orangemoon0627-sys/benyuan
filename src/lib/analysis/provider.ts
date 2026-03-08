import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { buildAnalysisPromptPayload } from "@/lib/analysis/prompt-shaping";
import type { AnalysisEngineResult, AnalysisInput, AnalysisProvider, AnalysisProviderEnhancement } from "@/lib/analysis/types";

function createUnavailableEnhancement(): Promise<AnalysisProviderEnhancement | null> {
  return Promise.resolve(null);
}

export const disabledAnalysisProvider: AnalysisProvider = {
  id: "provider.disabled",
  label: "Disabled Analysis Provider",
  kind: "disabled",
  available: false,
  reason: "No external LLM provider configured.",
  enhance: createUnavailableEnhancement,
};

export const openAIAnalysisProvider: AnalysisProvider = {
  id: "provider.openai.stub",
  label: "OpenAI Provider Stub",
  kind: "openai",
  available: Boolean(process.env.OPENAI_API_KEY),
  reason: process.env.OPENAI_API_KEY ? undefined : "OPENAI_API_KEY is not configured.",
  async enhance(input: AnalysisInput, _baseline: AnalysisEngineResult) {
    const prompt = buildAnalysisPromptPayload(input);
    return {
      metadata: {
        providerId: "provider.openai.stub",
        promptTemplateId: prompt.template.id,
        promptTemplateVersion: prompt.template.version,
      },
    };
  },
};

export const anthropicAnalysisProvider: AnalysisProvider = {
  id: "provider.anthropic.stub",
  label: "Anthropic Provider Stub",
  kind: "anthropic",
  available: Boolean(process.env.ANTHROPIC_API_KEY),
  reason: process.env.ANTHROPIC_API_KEY ? undefined : "ANTHROPIC_API_KEY is not configured.",
  async enhance(input: AnalysisInput, _baseline: AnalysisEngineResult) {
    const prompt = buildAnalysisPromptPayload(input);
    return {
      metadata: {
        providerId: "provider.anthropic.stub",
        promptTemplateId: prompt.template.id,
        promptTemplateVersion: prompt.template.version,
      },
    };
  },
};

const providerRegistry: Record<string, AnalysisProvider> = {
  disabled: disabledAnalysisProvider,
  openai: openAIAnalysisProvider,
  anthropic: anthropicAnalysisProvider,
};

export function resolveAnalysisProvider(options?: { provider?: string | null }) {
  const config = readAnalysisRuntimeConfig("lite", { provider: options?.provider });
  return providerRegistry[config.selectedProviderKey] ?? disabledAnalysisProvider;
}
