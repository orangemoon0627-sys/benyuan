import type { Mode } from "@/lib/types";
import type { AnalysisPromptTemplateKey } from "@/lib/analysis/prompt-templates";
import type { AnalysisReportSchemaKey } from "@/lib/analysis/report-schemas";

export type AnalysisEngineKey = "deterministic" | "hybrid";
export type AnalysisProviderKey = "disabled" | "openai" | "anthropic" | "custom";
export type AnalysisProviderRequestMode = "stub" | "live";

export type AnalysisRuntimeConfig = {
  mode: Mode;
  selectedEngineKey: AnalysisEngineKey;
  selectedProviderKey: AnalysisProviderKey;
  selectedPromptTemplateKey: AnalysisPromptTemplateKey;
  selectedReportSchemaKey: AnalysisReportSchemaKey;
  openAIKeyConfigured: boolean;
  anthropicKeyConfigured: boolean;
  customKeyConfigured: boolean;
  openAIModel: string;
  anthropicModel: string;
  customModel: string;
  customBaseUrl?: string;
  customProviderName?: string;
  liveProviderEnabled: boolean;
  providerRequestMode: AnalysisProviderRequestMode;
  providerTimeoutMs: number;
  providerSoftTimeoutMs: number;
};

function normalizeEngine(value: string | null | undefined): AnalysisEngineKey | null {
  if (value === "hybrid" || value === "deterministic") return value;
  return null;
}

function normalizeProvider(value: string | null | undefined): AnalysisProviderKey | null {
  if (value === "disabled" || value === "openai" || value === "anthropic" || value === "custom") return value;
  if (value === "crs") return "custom";
  return null;
}

function normalizePromptTemplate(value: string | null | undefined): AnalysisPromptTemplateKey | null {
  if (value === "core" || value === "depth" || value === "constellation_v3") return value;
  return null;
}

function normalizeReportSchema(value: string | null | undefined): AnalysisReportSchemaKey | null {
  if (value === "standard" || value === "deep_focus" || value === "psyche_constellation_v3") return value;
  return null;
}

function normalizeBooleanFlag(value: string | null | undefined) {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function readAnalysisRuntimeConfig(
  mode: Mode,
  options?: { engine?: string | null; provider?: string | null; promptTemplate?: string | null; reportSchema?: string | null },
): AnalysisRuntimeConfig {
  const liveProviderEnabled = normalizeBooleanFlag(process.env.BENYUAN_LLM_LIVE);
  const selectedEngineKey = normalizeEngine(options?.engine ?? process.env.BENYUAN_ANALYSIS_ENGINE) ?? "deterministic";
  const selectedProviderKey = normalizeProvider(options?.provider ?? process.env.BENYUAN_LLM_PROVIDER) ?? "disabled";
  const selectedPromptTemplateKey =
    normalizePromptTemplate(options?.promptTemplate ?? process.env.BENYUAN_ANALYSIS_PROMPT_TEMPLATE) ??
    "constellation_v3";
  const selectedReportSchemaKey =
    normalizeReportSchema(options?.reportSchema ?? process.env.BENYUAN_ANALYSIS_REPORT_SCHEMA) ??
    "psyche_constellation_v3";
  const providerTimeoutMs = Number(process.env.BENYUAN_PROVIDER_TIMEOUT_MS ?? 120000);
  const defaultSoftTimeoutMs =
    selectedProviderKey === "custom"
      ? mode === "deep"
        ? 38000
        : 28000
      : mode === "deep"
        ? 24000
        : 18000;
  const providerSoftTimeoutMs = Number(process.env.BENYUAN_PROVIDER_SOFT_TIMEOUT_MS ?? defaultSoftTimeoutMs);

  return {
    mode,
    selectedEngineKey,
    selectedProviderKey,
    selectedPromptTemplateKey,
    selectedReportSchemaKey,
    openAIKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    customKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    openAIModel: process.env.BENYUAN_OPENAI_MODEL ?? "gpt-4.1-mini",
    anthropicModel: process.env.BENYUAN_ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    customModel: process.env.BENYUAN_CUSTOM_MODEL ?? process.env.BENYUAN_OPENAI_MODEL ?? "gpt-5.4",
    customBaseUrl: process.env.BENYUAN_CUSTOM_BASE_URL ?? process.env.BENYUAN_OPENAI_BASE_URL ?? undefined,
    customProviderName: process.env.BENYUAN_CUSTOM_PROVIDER_NAME ?? process.env.BENYUAN_MODEL_PROVIDER ?? undefined,
    liveProviderEnabled,
    providerRequestMode: liveProviderEnabled ? "live" : "stub",
    providerTimeoutMs,
    providerSoftTimeoutMs,
  };
}
