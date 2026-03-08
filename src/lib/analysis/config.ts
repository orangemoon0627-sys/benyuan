import type { Mode } from "@/lib/types";

export type AnalysisEngineKey = "deterministic" | "hybrid";
export type AnalysisProviderKey = "disabled" | "openai" | "anthropic";

export type AnalysisRuntimeConfig = {
  mode: Mode;
  selectedEngineKey: AnalysisEngineKey;
  selectedProviderKey: AnalysisProviderKey;
  selectedPromptTemplateKey: "core";
  openAIKeyConfigured: boolean;
  anthropicKeyConfigured: boolean;
  openAIModel: string;
  anthropicModel: string;
};

function normalizeEngine(value: string | null | undefined): AnalysisEngineKey | null {
  if (value === "hybrid" || value === "deterministic") return value;
  return null;
}

function normalizeProvider(value: string | null | undefined): AnalysisProviderKey | null {
  if (value === "disabled" || value === "openai" || value === "anthropic") return value;
  return null;
}

export function readAnalysisRuntimeConfig(mode: Mode, options?: { engine?: string | null; provider?: string | null }): AnalysisRuntimeConfig {
  return {
    mode,
    selectedEngineKey: normalizeEngine(options?.engine ?? process.env.BENYUAN_ANALYSIS_ENGINE) ?? "deterministic",
    selectedProviderKey: normalizeProvider(options?.provider ?? process.env.BENYUAN_LLM_PROVIDER) ?? "disabled",
    selectedPromptTemplateKey: "core",
    openAIKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    openAIModel: process.env.BENYUAN_OPENAI_MODEL ?? "gpt-4.1-mini",
    anthropicModel: process.env.BENYUAN_ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
  };
}
