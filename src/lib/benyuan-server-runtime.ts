import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { readCodexProviderDefaults } from "@/lib/codex-runtime";
import type { AgentReasoningEffort, AgentRuntimeOverride } from "@/lib/benyuan-v3-types";

export type BenyuanResolvedAgentRuntime = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  providerName: string;
  reasoningEffort: AgentReasoningEffort;
  disableStorage: boolean;
  live: boolean;
  available: boolean;
  timeoutMs: number;
  apiKeySource: "server-env" | "codex-local" | "override" | "missing";
  secretStorage: "server-private-env" | "local-codex-config" | "request-override" | "missing";
  serverIndependent: boolean;
};

function allowRequestRuntimeProviderOverride() {
  return process.env.BENYUAN_ALLOW_REQUEST_RUNTIME_PROVIDER_OVERRIDE === "1" && process.env.NODE_ENV !== "production";
}

function allowCodexRuntimeDefaults() {
  return process.env.BENYUAN_ALLOW_CODEX_RUNTIME_DEFAULTS === "1" || process.env.NODE_ENV !== "production";
}

function readAllowedCodexDefaults() {
  return allowCodexRuntimeDefaults() ? readCodexProviderDefaults() : {};
}

export function readBenyuanAgentRuntime(override?: AgentRuntimeOverride): BenyuanResolvedAgentRuntime {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const codexDefaults = readAllowedCodexDefaults();
  const allowProviderOverride = allowRequestRuntimeProviderOverride();
  const envApiKey = process.env.OPENAI_API_KEY?.trim();
  const overrideApiKey = allowProviderOverride ? override?.api_key?.trim() : undefined;
  const apiKey = overrideApiKey || envApiKey || codexDefaults.apiKey;
  const apiKeySource = overrideApiKey ? "override" : envApiKey ? "server-env" : codexDefaults.apiKey ? "codex-local" : "missing";
  const secretStorage =
    apiKeySource === "override"
      ? "request-override"
      : apiKeySource === "server-env"
        ? "server-private-env"
        : apiKeySource === "codex-local"
          ? "local-codex-config"
          : "missing";
  const baseUrl = (allowProviderOverride ? override?.base_url : undefined) ?? runtime.customBaseUrl ?? codexDefaults.baseUrl;
  const model = (allowProviderOverride ? override?.model : undefined) ?? runtime.customModel ?? codexDefaults.model ?? "gpt-5.5";
  const providerName =
    (allowProviderOverride ? override?.provider_name : undefined) ?? runtime.customProviderName ?? codexDefaults.providerName ?? "custom";
  const reasoningEffort =
    override?.reasoning_effort ??
    (process.env.BENYUAN_CUSTOM_REASONING_EFFORT as AgentReasoningEffort | undefined) ??
    codexDefaults.reasoningEffort ??
    "xhigh";
  const disableStorage = override?.disable_response_storage ?? codexDefaults.disableResponseStorage ?? true;
  const live = (allowProviderOverride ? override?.live : undefined) ?? runtime.liveProviderEnabled;
  const available = Boolean(live && apiKey && baseUrl);
  const timeoutMs = Math.max(runtime.providerSoftTimeoutMs, Math.min(runtime.providerTimeoutMs, 180000));

  return {
    apiKey,
    baseUrl,
    model,
    providerName,
    reasoningEffort,
    disableStorage,
    live,
    available,
    timeoutMs,
    apiKeySource,
    secretStorage,
    serverIndependent: apiKeySource === "server-env",
  };
}

export function readBenyuanServerRuntimeStatus() {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const resolved = readBenyuanAgentRuntime();
  const codexDefaults = readAllowedCodexDefaults();

  return {
    provider: resolved.providerName,
    model: resolved.model,
    liveProviderEnabled: runtime.liveProviderEnabled,
    providerRequestMode: runtime.liveProviderEnabled ? "live" : runtime.providerRequestMode,
    customBaseUrlConfigured: Boolean(runtime.customBaseUrl),
    defaultBaseUrl: resolved.baseUrl,
    apiKeyConfigured: Boolean(resolved.apiKey),
    apiKeySource: resolved.apiKeySource,
    secretStorage: resolved.secretStorage,
    serverIndependent: resolved.serverIndependent,
    softTimeoutMs: runtime.providerSoftTimeoutMs,
    providerTimeoutMs: runtime.providerTimeoutMs,
    source: resolved.apiKeySource === "codex-local" ? "codex-config" : "environment",
    wireApi: codexDefaults.wireApi ?? "responses",
  };
}
