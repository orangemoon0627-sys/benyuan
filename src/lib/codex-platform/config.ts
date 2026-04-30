import type { CodexHomeExperience, CodexPlatformConfig } from './types';

type ResolveCodexPlatformConfigOptions = {
  env?: Record<string, string | undefined>;
};

function readBooleanFlag(value: string | undefined) {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

export function resolveCodexPlatformConfig(options: ResolveCodexPlatformConfigOptions = {}): CodexPlatformConfig {
  const env = options.env ?? process.env;

  return {
    platformEnabled: readBooleanFlag(env.CODEX_PLATFORM_ENABLED ?? env.NEXT_PUBLIC_CODEX_PLATFORM_ENABLED),
    dashboardHref: env.CODEX_PLATFORM_DASHBOARD_HREF ?? '/codex',
    legacyHomeHref: env.CODEX_PLATFORM_LEGACY_HREF ?? '/legacy',
    takeoverMode: 'shadow',
    companionUrl: env.CODEX_COMPANION_URL ?? 'http://127.0.0.1:4319',
    companionProxyEnabled: readBooleanFlag(env.CODEX_COMPANION_PROXY_ENABLED),
  };
}

export function resolveHomeExperience(config: CodexPlatformConfig): CodexHomeExperience {
  return config.platformEnabled ? 'codex' : 'legacy';
}
