import { NextResponse } from "next/server";
import { summarizeBenyuanAgentTimings } from "@/lib/benyuan-agent-timing";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { readCodexProviderDefaults } from "@/lib/codex-runtime";
import { readBenyuanAgentSpeedProfile } from "@/lib/benyuan-v3-agent";

export async function GET() {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const codexDefaults = readCodexProviderDefaults();
  const liveProviderEnabled = runtime.liveProviderEnabled;
  const apiKeyConfigured = runtime.customKeyConfigured || Boolean(codexDefaults.apiKey);
  const defaultBaseUrl = runtime.customBaseUrl ?? codexDefaults.baseUrl;

  const agentTiming = await summarizeBenyuanAgentTimings(200);
  const agentSpeedProfile = readBenyuanAgentSpeedProfile();

  return NextResponse.json({
    provider: runtime.customProviderName ?? codexDefaults.providerName ?? "custom",
    model: runtime.customModel ?? codexDefaults.model ?? "gpt-5.4",
    liveProviderEnabled,
    providerRequestMode: liveProviderEnabled ? "live" : runtime.providerRequestMode,
    customBaseUrlConfigured: Boolean(defaultBaseUrl),
    defaultBaseUrl,
    apiKeyConfigured,
    softTimeoutMs: runtime.providerSoftTimeoutMs,
    wireApi: codexDefaults.wireApi ?? "responses",
    source: codexDefaults.apiKey && codexDefaults.baseUrl ? "codex-config" : "environment",
    agentSpeedProfile,
    agentTiming,
  });
}
