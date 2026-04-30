import { resolveCodexPlatformConfig } from './config';
import type { CompanionStatus } from './types';

type FetchLike = typeof fetch;

type FetchCompanionStatusOptions = {
  companionUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

function buildFallbackStatus(companionUrl: string, reason: string): CompanionStatus {
  return {
    connected: false,
    mode: 'fallback',
    summary: `Companion offline, using fallback runtime (${reason}).`,
    bridgeHealth: 'degraded',
    baseUrl: companionUrl,
    capabilities: ['local-store', 'deterministic-agent', 'project-registry'],
    lastHeartbeatAt: new Date().toISOString(),
  };
}

export async function fetchCompanionStatus(options: FetchCompanionStatusOptions = {}): Promise<CompanionStatus> {
  const companionUrl = options.companionUrl ?? resolveCodexPlatformConfig().companionUrl;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 1200;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${companionUrl}/healthz`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return buildFallbackStatus(companionUrl, `HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Partial<CompanionStatus>;
    return {
      connected: true,
      mode: 'remote',
      summary: payload.summary ?? 'Companion connected.',
      bridgeHealth: payload.bridgeHealth ?? 'online',
      baseUrl: payload.baseUrl ?? companionUrl,
      capabilities: payload.capabilities ?? ['sessions', 'agents', 'tools', 'permissions'],
      lastHeartbeatAt: payload.lastHeartbeatAt ?? new Date().toISOString(),
    };
  } catch (error) {
    return buildFallbackStatus(companionUrl, error instanceof Error ? error.message : 'unknown error');
  } finally {
    clearTimeout(timer);
  }
}
