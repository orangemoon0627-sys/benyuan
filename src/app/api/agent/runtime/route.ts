import { NextResponse } from "next/server";
import { summarizeBenyuanAgentTimings } from "@/lib/benyuan-agent-timing";
import { getBenyuanV3StoreHealth } from "@/lib/benyuan-v3-store";
import { readBenyuanServerRuntimeStatus } from "@/lib/benyuan-server-runtime";
import { readBenyuanAgentSpeedProfile } from "@/lib/benyuan-v3-agent";

export async function GET() {
  const runtime = readBenyuanServerRuntimeStatus();
  const [agentTiming, persistence] = await Promise.all([
    summarizeBenyuanAgentTimings(200),
    getBenyuanV3StoreHealth(),
  ]);
  const agentSpeedProfile = readBenyuanAgentSpeedProfile();

  return NextResponse.json({
    provider: runtime.provider,
    model: runtime.model,
    liveProviderEnabled: runtime.liveProviderEnabled,
    providerRequestMode: runtime.providerRequestMode,
    customBaseUrlConfigured: runtime.customBaseUrlConfigured,
    defaultBaseUrl: runtime.defaultBaseUrl,
    apiKeyConfigured: runtime.apiKeyConfigured,
    apiKeySource: runtime.apiKeySource,
    secretStorage: runtime.secretStorage,
    serverIndependent: runtime.serverIndependent,
    softTimeoutMs: runtime.softTimeoutMs,
    providerTimeoutMs: runtime.providerTimeoutMs,
    source: runtime.source,
    wireApi: runtime.wireApi,
    agentSpeedProfile,
    agentTiming,
    persistence,
  });
}
