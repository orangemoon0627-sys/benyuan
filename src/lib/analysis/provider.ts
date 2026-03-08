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
    void prompt;
    return null;
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
    void prompt;
    return null;
  },
};

const providerRegistry: Record<string, AnalysisProvider> = {
  disabled: disabledAnalysisProvider,
  openai: openAIAnalysisProvider,
  anthropic: anthropicAnalysisProvider,
};

export function resolveAnalysisProvider() {
  const providerKey = (process.env.BENYUAN_LLM_PROVIDER ?? "disabled").toLowerCase();
  return providerRegistry[providerKey] ?? disabledAnalysisProvider;
}
