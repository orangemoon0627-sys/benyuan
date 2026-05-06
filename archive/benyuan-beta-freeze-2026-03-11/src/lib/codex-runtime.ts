import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export type CodexProviderDefaults = {
  providerName?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  reasoningEffort?: "low" | "medium" | "high";
  disableResponseStorage?: boolean;
  wireApi?: string;
};

function readIfExists(filePath: string) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
}

function matchString(source: string, pattern: RegExp) {
  return source.match(pattern)?.[1];
}

function matchBoolean(source: string, pattern: RegExp) {
  const value = source.match(pattern)?.[1];
  if (!value) return undefined;
  return value === "true";
}

export function readCodexProviderDefaults(): CodexProviderDefaults {
  const codexHome = process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
  const configPath = path.join(codexHome, "config.toml");
  const authPath = path.join(codexHome, "auth.json");

  const configRaw = readIfExists(configPath) ?? "";
  const authRaw = readIfExists(authPath) ?? "";

  const providerName = matchString(configRaw, /^model_provider\s*=\s*"([^"]+)"/m);
  const model = matchString(configRaw, /^model\s*=\s*"([^"]+)"/m);
  const reasoningEffort = matchString(configRaw, /^model_reasoning_effort\s*=\s*"(low|medium|high)"/m) as
    | "low"
    | "medium"
    | "high"
    | undefined;
  const disableResponseStorage = matchBoolean(configRaw, /^disable_response_storage\s*=\s*(true|false)/m);
  const wireApi = matchString(configRaw, /^wire_api\s*=\s*"([^"]+)"/m);

  let baseUrl: string | undefined;
  if (providerName) {
    const sectionPattern = new RegExp(`\\[model_providers\\.${providerName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\]([\\s\\S]*?)(?:\\n\\[|$)`);
    const section = configRaw.match(sectionPattern)?.[1] ?? "";
    baseUrl = matchString(section, /^base_url\s*=\s*"([^"]+)"/m);
  }

  let apiKey: string | undefined;
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw) as { OPENAI_API_KEY?: string };
      apiKey = parsed.OPENAI_API_KEY;
    } catch {
      apiKey = undefined;
    }
  }

  return {
    providerName,
    model,
    baseUrl,
    apiKey,
    reasoningEffort,
    disableResponseStorage,
    wireApi,
  };
}
