import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { fetchCompanionStatus } from './companion';
import { resolveCodexPlatformConfig, resolveHomeExperience } from './config';
import { buildLegacyProjectSpaceSummaries } from './legacy-adapters';
import {
  listAgentRuns,
  listPermissionDecisions,
  listPlanRuns,
  listPlatformSessions,
  listRuntimeEvents,
  listToolCalls,
} from './local-store';
import { listProjectSpaceManifests } from './project-manifests';
import { listProjectSpaces } from './project-spaces';
import type {
  CodexPlatformBootstrap,
  CompanionStatus,
  McpConnection,
  MemoryRecord,
  PluginBinding,
  ProjectSpaceSummary,
  SkillSpec,
} from './types';

type BuildCodexPlatformBootstrapOptions = {
  env?: Record<string, string | undefined>;
  companionStatus?: CompanionStatus;
  fetchImpl?: typeof fetch;
  platformStoreFilePath?: string;
  benyuanStoreFilePath?: string;
  codexConfigRaw?: string;
  memoryPaths?: Partial<Record<'profile' | 'active' | 'project', string>>;
};

function normalizePreview(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .join(' ')
    .slice(0, 160);
}

async function buildMemoryRecord(id: string, title: string, filePath: string): Promise<MemoryRecord> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return {
      id,
      title,
      path: filePath,
      preview: normalizePreview(raw) || 'Memory file is present.',
      status: 'loaded',
    };
  } catch {
    return {
      id,
      title,
      path: filePath,
      preview: 'Not loaded yet.',
      status: 'missing',
    };
  }
}

function buildSkillSpecs(codexHome: string): SkillSpec[] {
  const specs = [
    {
      id: 'superpowers.using-superpowers',
      label: 'Using Superpowers',
      path: path.join(codexHome, 'superpowers', 'skills', 'using-superpowers', 'SKILL.md'),
      source: 'superpowers' as const,
    },
    {
      id: 'superpowers.executing-plans',
      label: 'Executing Plans',
      path: path.join(codexHome, 'superpowers', 'skills', 'executing-plans', 'SKILL.md'),
      source: 'superpowers' as const,
    },
    {
      id: 'superpowers.test-driven-development',
      label: 'Test Driven Development',
      path: path.join(codexHome, 'superpowers', 'skills', 'test-driven-development', 'SKILL.md'),
      source: 'superpowers' as const,
    },
    {
      id: 'codex.self-improving',
      label: 'Self Improving for Codex',
      path: path.join(codexHome, 'skills', 'self-improving-for-codex', 'SKILL.md'),
      source: 'skills' as const,
    },
  ];

  return specs.map((spec) => ({
    ...spec,
    status: existsSync(spec.path) ? 'loaded' : 'missing',
    scope: 'platform',
  }));
}

function extractTomlTables(raw: string, prefix: string) {
  const tableRegex = /^\[(.+)\]\s*$/gm;
  const matches = Array.from(raw.matchAll(tableRegex));

  return matches
    .map((match, index) => {
      const header = match[1];
      if (!header.startsWith(`${prefix}.`)) return null;

      const nextTableIndex = matches[index + 1]?.index ?? raw.length;
      const bodyStart = (match.index ?? 0) + match[0].length;
      const key = header.slice(prefix.length + 1).trim().replace(/^"|"$/g, '');
      return {
        key,
        body: raw.slice(bodyStart, nextTableIndex).trim(),
      };
    })
    .filter((value): value is { key: string; body: string } => Boolean(value));
}

function buildPluginBindings(configRaw: string): PluginBinding[] {
  return extractTomlTables(configRaw, 'plugins').map(({ key, body }) => {
    const enabled = /^\s*enabled\s*=\s*true\s*$/m.test(body);
    const provider = key.includes('@') ? key.split('@')[1] : 'local';

    return {
      id: key,
      label: key,
      provider,
      status: enabled ? 'configured' : 'available',
      detail: enabled ? 'Enabled in Codex config.' : 'Plugin listed but not yet enabled.',
    };
  });
}

function buildMcpConnections(configRaw: string): McpConnection[] {
  return extractTomlTables(configRaw, 'mcp_servers').map(({ key, body }) => {
    const hasUrl = /^\s*url\s*=\s*"([^"]+)"/m.test(body);
    const hasCommand = /^\s*command\s*=\s*"([^"]+)"/m.test(body);
    const transport = hasUrl ? 'http' : hasCommand || /^\s*type\s*=\s*"stdio"/m.test(body) ? 'stdio' : 'unknown';
    const detail =
      transport === 'http'
        ? 'Remote MCP bridge is configured.'
        : transport === 'stdio'
          ? 'Local stdio MCP bridge is configured.'
          : 'MCP entry is present but transport needs inspection.';

    return {
      id: key,
      label: key,
      status: 'configured',
      transport,
      detail,
    };
  });
}

function mergeProjectSpaceSummary(
  baseSummary: ProjectSpaceSummary | undefined,
  sessionCount: number,
  companion: CompanionStatus,
  spaceId: string,
): ProjectSpaceSummary {
  const summary = baseSummary ?? {
    sessionCount: 0,
    draftCount: 0,
    health: 'watch',
    signal: 'Awaiting adapter bootstrap.',
  };

  const mergedSessionCount = summary.sessionCount + sessionCount;
  if (spaceId === 'codex' && companion.mode === 'fallback') {
    return {
      ...summary,
      sessionCount: mergedSessionCount,
      health: 'watch',
      signal: `${summary.signal} Companion fallback is active, so the web shell stays connected through local runtime defaults.`,
    };
  }

  return {
    ...summary,
    sessionCount: mergedSessionCount,
  };
}

export async function buildCodexPlatformBootstrap(
  options: BuildCodexPlatformBootstrapOptions = {},
): Promise<CodexPlatformBootstrap> {
  const config = resolveCodexPlatformConfig({ env: options.env });
  const codexHome = process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex');
  const workspaceRoot = process.cwd();
  const defaultMemoryPaths = {
    profile: path.join(codexHome, 'memories', 'PROFILE.md'),
    active: path.join(codexHome, 'memories', 'ACTIVE.md'),
    project: path.join(workspaceRoot, 'AGENTS.md'),
  };
  const memoryPaths = {
    ...defaultMemoryPaths,
    ...options.memoryPaths,
  };
  const companion =
    options.companionStatus ??
    (await fetchCompanionStatus({
      companionUrl: config.companionUrl,
      fetchImpl: options.fetchImpl,
    }));
  const [sessions, toolCalls, agentRuns, planRuns, permissions, runtimeEvents, legacySummaries] = await Promise.all([
    listPlatformSessions({ storeFilePath: options.platformStoreFilePath }),
    listToolCalls({ storeFilePath: options.platformStoreFilePath }),
    listAgentRuns({ storeFilePath: options.platformStoreFilePath }),
    listPlanRuns({ storeFilePath: options.platformStoreFilePath }),
    listPermissionDecisions({ storeFilePath: options.platformStoreFilePath }),
    listRuntimeEvents({ storeFilePath: options.platformStoreFilePath }),
    buildLegacyProjectSpaceSummaries({ benyuanStoreFilePath: options.benyuanStoreFilePath }),
  ]);
  const configRaw = options.codexConfigRaw ?? (await readFile(path.join(codexHome, 'config.toml'), 'utf8').catch(() => ''));
  const sessionCountBySpace = sessions.reduce<Record<string, number>>((accumulator, session) => {
    accumulator[session.projectSpaceId] = (accumulator[session.projectSpaceId] ?? 0) + 1;
    return accumulator;
  }, {});
  const memories = await Promise.all([
    buildMemoryRecord('profile', 'Profile memory', memoryPaths.profile),
    buildMemoryRecord('active', 'Active memory', memoryPaths.active),
    buildMemoryRecord('project', 'Project memory', memoryPaths.project),
  ]);

  return {
    config,
    homeExperience: resolveHomeExperience(config),
    companion,
    projectSpaces: listProjectSpaces().map((space) => ({
      ...space,
      summary: mergeProjectSpaceSummary(legacySummaries[space.id], sessionCountBySpace[space.id] ?? 0, companion, space.id),
    })),
    projectManifests: listProjectSpaceManifests(),
    sessions,
    toolCalls,
    agentRuns,
    planRuns,
    permissions,
    runtimeEvents,
    memories,
    skills: buildSkillSpecs(codexHome),
    plugins: buildPluginBindings(configRaw),
    mcpConnections: buildMcpConnections(configRaw),
  };
}
