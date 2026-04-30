import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export type BenyuanRealDeviceAcceptanceItem = {
  label: string;
  route: string;
  target: string;
  done: boolean;
  evidence: string;
  notes: string;
  evidencePaths: string[];
  latestEvidencePath: string | null;
  latestEvidenceModifiedAt: string | null;
};

export type BenyuanRealDeviceAcceptanceSnapshot = {
  boardPath: string;
  boardUpdatedAt: string | null;
  totalChecks: number;
  completedChecks: number;
  pendingChecks: number;
  ready: boolean;
  items: BenyuanRealDeviceAcceptanceItem[];
  pendingItems: BenyuanRealDeviceAcceptanceItem[];
  completedItems: BenyuanRealDeviceAcceptanceItem[];
  latestCompletedItem: BenyuanRealDeviceAcceptanceItem | null;
};

const ACCEPTANCE_BOARD_PATH = path.join(process.cwd(), "docs", "benyuan-ios-camera-acceptance-board.md");

function parseMarkdownTableRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [] as string[];
  return trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function extractEvidencePaths(raw: string) {
  const normalized = raw.replace(/<br\s*\/?>/gi, "\n");
  const values = new Set<string>();

  for (const match of normalized.matchAll(/`([^`]+)`/g)) {
    if (match[1]) values.add(match[1].trim());
  }

  for (const match of normalized.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (match[1]) values.add(match[1].trim());
  }

  for (const match of normalized.matchAll(/(?:\/|\.\.\/|\.\/)[^\s|,]+/g)) {
    if (match[0]) values.add(match[0].trim());
  }

  return [...values];
}

async function statMaybe(filePath: string) {
  try {
    if (!path.isAbsolute(filePath)) return null;
    const fileStat = await stat(filePath);
    return {
      filePath,
      modifiedAt: fileStat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function readBenyuanIosRealDeviceAcceptance(): Promise<BenyuanRealDeviceAcceptanceSnapshot | null> {
  try {
    const [raw, boardStat] = await Promise.all([readFile(ACCEPTANCE_BOARD_PATH, "utf8"), stat(ACCEPTANCE_BOARD_PATH)]);
    const lines = raw.split(/\r?\n/);
    const headerIndex = lines.findIndex((line) => line.includes("| Check item |") && line.includes("| Status |"));

    if (headerIndex === -1) {
      return {
        boardPath: ACCEPTANCE_BOARD_PATH,
        boardUpdatedAt: boardStat.mtime.toISOString(),
        totalChecks: 0,
        completedChecks: 0,
        pendingChecks: 0,
        ready: false,
        items: [],
        pendingItems: [],
        completedItems: [],
        latestCompletedItem: null,
      };
    }

    const rowLines: string[] = [];
    for (let index = headerIndex + 2; index < lines.length; index += 1) {
      const line = lines[index]?.trim() ?? "";
      if (!line.startsWith("|")) break;
      rowLines.push(line);
    }

    const items = await Promise.all(
      rowLines.map(async (line) => {
        const [label = "", route = "", target = "", status = "", evidence = "", notes = ""] = parseMarkdownTableRow(line);
        const evidencePaths = extractEvidencePaths(evidence);
        const evidenceStats = (await Promise.all(evidencePaths.map((filePath) => statMaybe(filePath))))
          .filter((item): item is { filePath: string; modifiedAt: string } => Boolean(item))
          .sort((left, right) => new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime());
        const latestEvidence = evidenceStats[0] ?? null;

        return {
          label,
          route,
          target,
          done: /\[x\]/i.test(status),
          evidence,
          notes,
          evidencePaths,
          latestEvidencePath: latestEvidence?.filePath ?? null,
          latestEvidenceModifiedAt: latestEvidence?.modifiedAt ?? null,
        } satisfies BenyuanRealDeviceAcceptanceItem;
      }),
    );

    const completedItems = items.filter((item) => item.done);
    const pendingItems = items.filter((item) => !item.done);
    const latestCompletedItem = [...completedItems].sort((left, right) => {
      const leftTime = new Date(left.latestEvidenceModifiedAt ?? 0).getTime();
      const rightTime = new Date(right.latestEvidenceModifiedAt ?? 0).getTime();
      return rightTime - leftTime;
    })[0] ?? completedItems.at(-1) ?? null;

    return {
      boardPath: ACCEPTANCE_BOARD_PATH,
      boardUpdatedAt: boardStat.mtime.toISOString(),
      totalChecks: items.length,
      completedChecks: completedItems.length,
      pendingChecks: pendingItems.length,
      ready: items.length > 0 && pendingItems.length === 0,
      items,
      pendingItems,
      completedItems,
      latestCompletedItem,
    };
  } catch {
    return null;
  }
}
