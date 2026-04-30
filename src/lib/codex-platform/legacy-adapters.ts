import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ProjectSpaceSummary } from './types';

type BuildLegacyProjectSpaceSummariesOptions = {
  benyuanStoreFilePath?: string;
};

type BenyuanStoreSnapshot = {
  sessions?: Record<string, unknown>;
  drafts?: Record<string, unknown>;
};

const DEFAULT_BENYUAN_STORE_FILE = path.join(process.cwd(), 'data', 'benyuan-store.json');

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function buildLegacyProjectSpaceSummaries(
  options: BuildLegacyProjectSpaceSummariesOptions = {},
): Promise<Record<string, ProjectSpaceSummary>> {
  const benyuanStoreFilePath = options.benyuanStoreFilePath ?? DEFAULT_BENYUAN_STORE_FILE;
  const benyuanStore = await readJsonIfExists<BenyuanStoreSnapshot>(benyuanStoreFilePath);
  const benyuanSessionCount = Object.keys(benyuanStore?.sessions ?? {}).length;
  const benyuanDraftCount = Object.keys(benyuanStore?.drafts ?? {}).length;

  return {
    codex: {
      sessionCount: 0,
      draftCount: 0,
      health: 'healthy',
      signal: 'Shadow shell is ready to take over the root entry behind a feature flag.',
    },
    benyuan: {
      sessionCount: benyuanSessionCount,
      draftCount: benyuanDraftCount,
      health: benyuanSessionCount > 0 ? 'healthy' : 'watch',
      signal:
        benyuanDraftCount > 0
          ? `${benyuanDraftCount} legacy drafts remain available through the compatibility adapter.`
          : 'Legacy Benyuan routes stay available while the Codex shell takes over orchestration.',
    },
    tradewise: {
      sessionCount: 0,
      draftCount: 0,
      health: 'watch',
      signal: 'TradeWise remains compatible while project-space adapters and delivery lanes are normalized.',
    },
    embryo: {
      sessionCount: 0,
      draftCount: 0,
      health: 'planned',
      signal: 'Embryo is reserved as the next project-space slot under the shared Codex kernel.',
    },
  };
}
