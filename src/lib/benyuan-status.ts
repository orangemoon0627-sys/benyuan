import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import { benyuanBetaFreezeCurrent } from "@/lib/benyuan-beta-freeze";
import { getConstellationRecord, readBenyuanV3Store } from "@/lib/benyuan-v3-store";
import { BENYUAN_V3_CONSTELLATION_ENGINE, deriveConstellationSupportTone } from "@/lib/benyuan-v3-report-profile";
import { readBenyuanIosRealDeviceAcceptance } from "@/lib/benyuan-ios-real-device";
import { readCodexProviderDefaults } from "@/lib/codex-runtime";

type StageRuntime = {
  provider?: string;
  model?: string;
  mode?: "live" | "fallback";
  request_id?: string;
  error?: string;
};

type BenchmarkEvent = {
  pack?: string;
  stage?: string;
  attempt?: number;
  mode?: string;
  error?: string | null;
  recordedAt?: string;
};

type BenchmarkResult = {
  pack: string;
  label?: string;
  ids?: {
    part1_id?: string;
    theater_script_id?: string;
    part2_id?: string;
    constellation_id?: string;
  };
  durations?: {
    upload?: number;
    part1_submit?: number;
    multimodal?: number;
    theater_generate?: number;
    part2_submit?: number;
    constellation_generate?: number;
    total?: number;
  };
  runtime?: {
    multimodal?: StageRuntime;
    theater?: StageRuntime;
    constellation?: StageRuntime;
  };
  archetype?: string;
  events?: BenchmarkEvent[];
};

type BenchmarkSnapshot = {
  filePath: string;
  fileName: string;
  generatedAt: string;
  selectedPacks: string[];
  results: BenchmarkResult[];
};

type GoldenAuditOutput = {
  status?: string;
  summary?: {
    total?: number;
    passed?: number;
    failed?: number;
  };
};

type GoldenRegressionOutput = {
  generatedAt?: string;
  baseline?: {
    resolvedVersion?: string;
    title?: string;
    promptVersion?: string;
    schemaVersion?: string;
    filePath?: string;
  };
  diffSummary?: {
    total?: number;
    unchanged?: number;
    drifted?: number;
    missingBaseline?: number;
  };
};

type IosRegressionOutput = {
  summary?: {
    generatedAt?: string;
    baseUrl?: string;
    total?: number;
    passed?: number;
    failed?: number;
  };
};

type IosNativeSmokeOutput = {
  generatedAt?: string;
  baseUrl?: string;
  bundleId?: string;
  device?: {
    name?: string;
    udid?: string;
  };
  runs?: Array<{
    label?: string;
    ok?: boolean;
    status?: number;
  }>;
};

type JsonOutputSnapshot<T> = {
  filePath: string;
  fileName: string;
  modifiedAt: string;
  data: T | null;
};

type MarkdownSnapshot = {
  filePath: string;
  fileName: string;
  modifiedAt: string;
  raw: string;
};

type PilotSessionSnapshot = {
  filePath: string;
  fileName: string;
  title: string;
  sessionId: string;
  date: string | null;
  type: string | null;
  participant: string | null;
  environment: string | null;
  baseUrl: string | null;
  status: "completed" | "pending";
  currentStatus: string | null;
  conclusion: string | null;
  effectiveSession: boolean | null;
  blocker: boolean | null;
  updatedAt: string;
};

const OUTPUT_DIR = path.join(process.cwd(), "output");
const DOCS_DIR = path.join(process.cwd(), "docs");
const BENCHMARK_PREFIX = "benyuan-pack-benchmark";
const PILOT_RUNBOOK_PATH = path.join(DOCS_DIR, "benyuan-guided-pilot-runbook-2026-03-14.md");
const PILOT_HANDOFF_PATH = path.join(DOCS_DIR, "benyuan-pilot-handoff-2026-03-14.md");
const PILOT_FEEDBACK_LOG_PATH = path.join(DOCS_DIR, "benyuan-pilot-feedback-log-2026-03-14.md");
const PILOT_SUMMARY_PATH = path.join(DOCS_DIR, "benyuan-pilot-summary-2026-03-14.md");
const PILOT_SESSION_PATHS = [
  path.join(DOCS_DIR, "benyuan-pilot-session-01.md"),
  path.join(DOCS_DIR, "benyuan-pilot-session-02.md"),
  path.join(DOCS_DIR, "benyuan-pilot-session-03.md"),
];
const SEVEN_DIMENSION_LABELS: Record<string, string> = {
  openness: "开放性",
  independence: "独立性",
  emotional_depth: "情感深度",
  meaning_seeking: "意义追寻",
  aesthetic_sensitivity: "审美敏感",
  action_tendency: "行动力",
  relationship_need: "关系需求",
};

function sortByGeneratedAt<T extends { generatedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

function normalizeSelectedPacks(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeResults(value: unknown) {
  return Array.isArray(value) ? (value as BenchmarkResult[]) : [];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readMarkdownField(raw: string, label: string) {
  const match = raw.match(new RegExp(`^- ${escapeRegExp(label)}：\\\`([^\\\`]+)\\\``, "m"));
  return match?.[1]?.trim() ?? null;
}

function readMarkdownHeading(raw: string) {
  const match = raw.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function parseMarkdownBoolean(value: string | null) {
  if (!value) return null;
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

async function readMarkdownSnapshot(filePath: string): Promise<MarkdownSnapshot | null> {
  try {
    const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
    return {
      filePath,
      fileName: path.basename(filePath),
      modifiedAt: fileStat.mtime.toISOString(),
      raw,
    };
  } catch {
    return null;
  }
}

function parsePilotSession(snapshot: MarkdownSnapshot): PilotSessionSnapshot {
  const title = readMarkdownHeading(snapshot.raw) ?? snapshot.fileName;
  const sessionId = readMarkdownField(snapshot.raw, "session id") ?? snapshot.fileName.replace(/\.md$/i, "");
  const date = readMarkdownField(snapshot.raw, "日期");
  const currentStatus = readMarkdownField(snapshot.raw, "当前状态");
  const conclusion = readMarkdownField(snapshot.raw, "结论");
  const effectiveSession = parseMarkdownBoolean(readMarkdownField(snapshot.raw, "是否达到“有效 session”"));
  const blocker = parseMarkdownBoolean(readMarkdownField(snapshot.raw, "是否出现 blocker"));
  const status =
    currentStatus?.includes("pending") || date === "pending" || snapshot.raw.includes("`pending live session`") ? "pending" : "completed";

  return {
    filePath: snapshot.filePath,
    fileName: snapshot.fileName,
    title,
    sessionId,
    date,
    type: readMarkdownField(snapshot.raw, "类型"),
    participant: readMarkdownField(snapshot.raw, "参与者"),
    environment: readMarkdownField(snapshot.raw, "环境"),
    baseUrl: readMarkdownField(snapshot.raw, "base URL"),
    status,
    currentStatus,
    conclusion,
    effectiveSession,
    blocker,
    updatedAt: snapshot.modifiedAt,
  };
}

function readPilotSummary(raw: string) {
  return {
    conclusion: readMarkdownField(raw, "结论"),
    reason: raw.match(/^- 原因：(.+)$/m)?.[1]?.trim() ?? null,
    nextSteps: [...raw.matchAll(/^\d+\.\s+(.+)$/gm)].map((match) => match[1]?.trim()).filter(Boolean),
  };
}

function readPilotFeedbackLog(raw: string) {
  return {
    blocker: readMarkdownField(raw, "blocker"),
    major: readMarkdownField(raw, "major"),
    minor: readMarkdownField(raw, "minor"),
    niceToHave: readMarkdownField(raw, "nice-to-have"),
    effectiveSessions: readMarkdownField(raw, "有效引导式 session"),
  };
}

async function readBenchmarkSnapshot(fileName: string): Promise<BenchmarkSnapshot | null> {
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { generatedAt?: string; selectedPacks?: unknown; results?: unknown };
    if (typeof parsed.generatedAt !== "string") return null;

    return {
      filePath,
      fileName,
      generatedAt: parsed.generatedAt,
      selectedPacks: normalizeSelectedPacks(parsed.selectedPacks),
      results: normalizeResults(parsed.results),
    };
  } catch {
    return null;
  }
}

async function listBenchmarkSnapshots() {
  try {
    const files = await readdir(OUTPUT_DIR);
    const snapshots = await Promise.all(
      files
        .filter((file) => file.startsWith(BENCHMARK_PREFIX) && file.endsWith(".json"))
        .map((file) => readBenchmarkSnapshot(file)),
    );

    return sortByGeneratedAt(snapshots.filter((item): item is BenchmarkSnapshot => Boolean(item)));
  } catch {
    return [] as BenchmarkSnapshot[];
  }
}

async function readOutputSnapshot<T>(fileName: string): Promise<JsonOutputSnapshot<T> | null> {
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    const [raw, fileStat] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
    return {
      filePath,
      fileName,
      modifiedAt: fileStat.mtime.toISOString(),
      data: JSON.parse(raw) as T,
    };
  } catch {
    return null;
  }
}

function isFullBaseline(snapshot: BenchmarkSnapshot) {
  const packs = [...snapshot.selectedPacks].sort().join(",");
  return packs === "A,B,C";
}

function flattenEvents(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return [] as Array<BenchmarkEvent & { generatedAt: string; fileName: string }>;
  return snapshot.results.flatMap((result) =>
    (result.events ?? []).map((event) => ({
      ...event,
      generatedAt: snapshot.generatedAt,
      fileName: snapshot.fileName,
    })),
  );
}

function inferFallbacks(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return [] as Array<BenchmarkEvent & { generatedAt: string; fileName: string }>;

  return snapshot.results.flatMap((result) => {
    const stages = [
      { stage: "multimodal", runtime: result.runtime?.multimodal },
      { stage: "theater", runtime: result.runtime?.theater },
      { stage: "constellation", runtime: result.runtime?.constellation },
    ];

    return stages
      .filter((entry) => entry.runtime?.error)
      .map((entry) => ({
        pack: result.pack,
        stage: entry.stage,
        attempt: 1,
        mode: entry.runtime?.mode,
        error: entry.runtime?.error ?? null,
        recordedAt: snapshot.generatedAt,
        generatedAt: snapshot.generatedAt,
        fileName: snapshot.fileName,
      }));
  });
}

function buildBenchmarkHealth(snapshot: BenchmarkSnapshot | null) {
  if (!snapshot) return null;

  let totalStages = 0;
  let liveStages = 0;
  let fallbackStages = 0;
  let errorStages = 0;
  let totalDuration = 0;
  let resultCount = 0;

  for (const result of snapshot.results) {
    resultCount += 1;
    totalDuration += result.durations?.total ?? 0;
    for (const runtime of [result.runtime?.multimodal, result.runtime?.theater, result.runtime?.constellation]) {
      if (!runtime) continue;
      totalStages += 1;
      if (runtime.mode === "live") liveStages += 1;
      if (runtime.mode === "fallback") fallbackStages += 1;
      if (runtime.error) errorStages += 1;
    }
  }

  return {
    totalStages,
    liveStages,
    fallbackStages,
    errorStages,
    resultCount,
    totalDuration,
    averageDuration: resultCount > 0 ? Number((totalDuration / resultCount).toFixed(1)) : null,
  };
}

function benchmarkStageLabel(stage: string) {
  if (stage === "multimodal") return "多模态";
  if (stage === "theater") return "剧场";
  if (stage === "constellation") return "星图";
  return stage;
}

function summarizeLatestConstellation(record: Awaited<ReturnType<typeof getConstellationRecord>>) {
  if (!record) return null;

  const dimensions = Object.entries(record.psyche_constellation.seven_dimensions)
    .map(([key, value]) => ({
      key,
      label: SEVEN_DIMENSION_LABELS[key] ?? key,
      score: value.score,
    }))
    .sort((a, b) => b.score - a.score);

  const topDimension = dimensions[0] ?? null;
  const supportTone = deriveConstellationSupportTone(record.psyche_constellation);
  const recommendationCount =
    record.psyche_constellation.recommendations.books.length +
    record.psyche_constellation.recommendations.films.length +
    record.psyche_constellation.recommendations.music.length;
  const paragraphCount = record.psyche_constellation.narrative_overview
    .split(/\n\n+/)
    .filter((item) => item.trim().length > 0).length;

  return {
    constellationId: record.constellation_id,
    archetype: record.psyche_constellation.archetype.name,
    createdAt: record.created_at,
    runtime: record.runtime,
    topDimension: topDimension ? `${topDimension.label} ${topDimension.score}%` : "--",
    firstTension: record.psyche_constellation.core_tensions[0]?.name ?? "--",
    supportTone,
    paragraphCount,
    recommendationCount,
  };
}

export async function getBenyuanStatusSnapshot() {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const codexDefaults = readCodexProviderDefaults();

  const [
    snapshots,
    store,
    goldenAuditSnapshot,
    goldenRegressionSnapshot,
    iosRegressionSnapshot,
    iosNativeSmokeSnapshot,
    manualRealDeviceSnapshot,
    pilotRunbookSnapshot,
    pilotHandoffSnapshot,
    pilotFeedbackLogSnapshot,
    pilotSummarySnapshot,
    pilotSessionSnapshots,
  ] = await Promise.all([
    listBenchmarkSnapshots(),
    readBenyuanV3Store(),
    readOutputSnapshot<GoldenAuditOutput>("benyuan-golden-audit.json"),
    readOutputSnapshot<GoldenRegressionOutput>("benyuan-golden-regression.json"),
    readOutputSnapshot<IosRegressionOutput>("benyuan-ios-regression.json"),
    readOutputSnapshot<IosNativeSmokeOutput>("benyuan-ios-native-smoke.json"),
    readBenyuanIosRealDeviceAcceptance(),
    readMarkdownSnapshot(PILOT_RUNBOOK_PATH),
    readMarkdownSnapshot(PILOT_HANDOFF_PATH),
    readMarkdownSnapshot(PILOT_FEEDBACK_LOG_PATH),
    readMarkdownSnapshot(PILOT_SUMMARY_PATH),
    Promise.all(PILOT_SESSION_PATHS.map((filePath) => readMarkdownSnapshot(filePath))),
  ]);

  const latestBenchmark = snapshots[0] ?? null;
  const latestFullBaseline = snapshots.find((snapshot) => isFullBaseline(snapshot)) ?? null;
  const latestConstellationMeta = Object.values(store.constellations).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
  const latestConstellationRecord = latestConstellationMeta
    ? await getConstellationRecord(latestConstellationMeta.constellation_id)
    : undefined;

  const recentFallbackEvents = [
    ...flattenEvents(latestBenchmark),
    ...inferFallbacks(latestBenchmark),
  ].filter((event) => event.error).sort((a, b) => {
    return new Date(b.recordedAt ?? b.generatedAt).getTime() - new Date(a.recordedAt ?? a.generatedAt).getTime();
  });

  const latestBenchmarkHealth = buildBenchmarkHealth(latestBenchmark);
  const latestFullBaselineHealth = buildBenchmarkHealth(latestFullBaseline);
  const goldenAudit = goldenAuditSnapshot?.data?.summary ?? null;
  const goldenRegression = goldenRegressionSnapshot?.data ?? null;
  const iosRegression = iosRegressionSnapshot?.data?.summary ?? null;
  const iosNativeSmoke = iosNativeSmokeSnapshot?.data ?? null;
  const manualRealDevice = manualRealDeviceSnapshot
    ? {
        boardPath: manualRealDeviceSnapshot.boardPath,
        boardUpdatedAt: manualRealDeviceSnapshot.boardUpdatedAt,
        totalChecks: manualRealDeviceSnapshot.totalChecks,
        completedChecks: manualRealDeviceSnapshot.completedChecks,
        pendingChecks: manualRealDeviceSnapshot.pendingChecks,
        ready: manualRealDeviceSnapshot.ready,
        latestCompletedItem: manualRealDeviceSnapshot.latestCompletedItem
          ? {
              label: manualRealDeviceSnapshot.latestCompletedItem.label,
              route: manualRealDeviceSnapshot.latestCompletedItem.route,
              evidence: manualRealDeviceSnapshot.latestCompletedItem.evidence,
              notes: manualRealDeviceSnapshot.latestCompletedItem.notes,
              modifiedAt: manualRealDeviceSnapshot.latestCompletedItem.latestEvidenceModifiedAt,
              filePath: manualRealDeviceSnapshot.latestCompletedItem.latestEvidencePath,
            }
          : null,
        pendingItems: manualRealDeviceSnapshot.pendingItems.map((item) => ({
          label: item.label,
          route: item.route,
          target: item.target,
        })),
      }
    : null;
  const pilotSessions = pilotSessionSnapshots.filter((item): item is MarkdownSnapshot => Boolean(item)).map(parsePilotSession);
  const pilotSummary = pilotSummarySnapshot ? readPilotSummary(pilotSummarySnapshot.raw) : { conclusion: null, reason: null, nextSteps: [] as string[] };
  const pilotFeedback = pilotFeedbackLogSnapshot ? readPilotFeedbackLog(pilotFeedbackLogSnapshot.raw) : null;
  const completedPilotSessions = pilotSessions.filter((item) => item.status === "completed");
  const effectivePilotSessions = pilotSessions.filter((item) => item.effectiveSession === true);
  const pendingPilotSessions = pilotSessions.filter((item) => item.status !== "completed");

  const automatedPilotChecks = [
    Boolean(latestFullBaseline && latestFullBaselineHealth?.fallbackStages === 0 && latestFullBaselineHealth.errorStages === 0),
    Boolean(goldenRegression?.diffSummary && (goldenRegression.diffSummary.drifted ?? 0) === 0 && (goldenRegression.diffSummary.missingBaseline ?? 0) === 0),
    Boolean(goldenAudit && (goldenAudit.failed ?? 0) === 0),
    Boolean(iosRegression && (iosRegression.failed ?? 0) === 0),
    Boolean(iosNativeSmoke),
  ];
  const automatedReady = automatedPilotChecks.every(Boolean);
  const manualRealDevicePending = manualRealDevice ? !manualRealDevice.ready : true;
  const freezeBenchmarkName = path.basename(benyuanBetaFreezeCurrent.benchmarkSnapshot);
  const pilotExecutionStatus = pilotSummary.conclusion ?? "pending";
  const effectiveSessionCount = effectivePilotSessions.length;
  const guidedPilotRemaining = Math.max(2 - effectiveSessionCount, 0);
  const currentPhase =
    automatedReady && !manualRealDevicePending
      ? effectiveSessionCount >= 2 && pilotExecutionStatus === "continue"
        ? "part3_candidate"
        : "guided_pilot"
      : automatedReady
        ? "real_device_closeout"
        : "technical_closeout";

  return {
    runtime: {
      provider: runtime.customProviderName ?? codexDefaults.providerName ?? "custom",
      model: runtime.customModel ?? codexDefaults.model ?? "gpt-5.5",
      baseUrl: runtime.customBaseUrl ?? codexDefaults.baseUrl ?? null,
      liveProviderEnabled: runtime.liveProviderEnabled,
      softTimeoutMs: runtime.providerSoftTimeoutMs,
      wireApi: codexDefaults.wireApi ?? "responses",
      source: codexDefaults.apiKey && codexDefaults.baseUrl ? "codex-config" : "environment",
      apiKeyConfigured: runtime.customKeyConfigured || Boolean(codexDefaults.apiKey),
    },
    reportEngine: {
      mode: BENYUAN_V3_CONSTELLATION_ENGINE.mode,
      promptVersion: BENYUAN_V3_CONSTELLATION_ENGINE.promptVersion,
      normalizationVersion: BENYUAN_V3_CONSTELLATION_ENGINE.normalizationVersion,
      safetyVersion: BENYUAN_V3_CONSTELLATION_ENGINE.safetyVersion,
      deltaDoc: BENYUAN_V3_CONSTELLATION_ENGINE.deltaDoc,
    },
    latestBenchmark,
    latestBenchmarkHealth,
    latestFullBaseline,
    latestFullBaselineHealth,
    latestConstellation: summarizeLatestConstellation(latestConstellationRecord),
    recentFallback: recentFallbackEvents[0]
      ? {
          ...recentFallbackEvents[0],
          stageLabel: benchmarkStageLabel(recentFallbackEvents[0].stage ?? "--"),
        }
      : null,
    regression: {
      goldenAudit: goldenAudit
        ? {
            ...goldenAudit,
            generatedAt: goldenAuditSnapshot?.modifiedAt ?? null,
          }
        : null,
      goldenRegression: goldenRegression
        ? {
            generatedAt: goldenRegression.generatedAt ?? goldenRegressionSnapshot?.modifiedAt ?? null,
            baseline: goldenRegression.baseline ?? null,
            diffSummary: goldenRegression.diffSummary ?? null,
          }
        : null,
    },
    ios: {
      regression: iosRegression
        ? {
            ...iosRegression,
            generatedAt: iosRegression.generatedAt ?? iosRegressionSnapshot?.modifiedAt ?? null,
          }
        : null,
      nativeSmoke: iosNativeSmoke
        ? {
            generatedAt: iosNativeSmoke.generatedAt ?? iosNativeSmokeSnapshot?.modifiedAt ?? null,
            baseUrl: iosNativeSmoke.baseUrl ?? null,
            bundleId: iosNativeSmoke.bundleId ?? null,
            deviceName: iosNativeSmoke.device?.name ?? null,
          }
        : null,
      manualRealDevice,
      manualRealDevicePending,
    },
    freezeReference: {
      benchmarkFileName: freezeBenchmarkName,
      benchmarkAligned: latestFullBaseline?.fileName === freezeBenchmarkName,
    },
    currentStage: {
      phase: currentPhase,
      architecture: {
        status: "done",
        detail: "Web 主流程 + WKWebView iOS shell 已锁定，当前不进入 native rewrite。",
      },
      visualClosure: {
        status: automatedReady ? "done" : "in_progress",
        detail: automatedReady
          ? "三大主页面视觉系统与 shell 第一、二轮收口已完成，并通过自动化护栏。"
          : "页面与 shell 收口仍在等待自动化护栏重新转绿。",
      },
      shellCalibration: {
        status: manualRealDevicePending ? "in_progress" : "done",
        detail: manualRealDevicePending
          ? "shell 自动化已通过，仍需补齐真机证据。"
          : "shell 自动化与真机 allow / deny / cancel / resume 已全部补齐。",
      },
      guidedPilot: {
        status: effectiveSessionCount >= 2 && pilotExecutionStatus === "continue" ? "done" : "pending",
        detail:
          effectiveSessionCount >= 2 && pilotExecutionStatus === "continue"
            ? "guided pilot 已达到继续进入 Part 3 的门槛。"
            : `真实 guided pilot 仍差 ${guidedPilotRemaining} 场有效 session，当前不要提前进入 Part 3。`,
      },
      nextAction:
        effectiveSessionCount >= 1
          ? guidedPilotRemaining > 0
            ? `执行 pilot-session-0${effectiveSessionCount + 2} 并回写 feedback / summary。`
            : "复核 summary 是否可升级为 continue。"
          : "先执行 pilot-session-02，并把真实反馈写回 session / feedback / summary。",
    },
    pilotReadiness: {
      status: automatedReady ? (manualRealDevicePending ? "pending_real_device" : "ready") : "blocked",
      automatedReady,
      summary: automatedReady
        ? manualRealDevicePending
          ? `自动化链路已基本稳定，真机验收还差 ${manualRealDevice?.pendingChecks ?? "--"} / ${manualRealDevice?.totalChecks ?? "--"} 项。`
          : "自动化链路与真机相机/相册验收均已补齐，可进入 pilot handoff。"
        : "仍有自动化回归项未达标，暂不建议继续外扩 pilot。",
      checklist: [
        {
          label: "A/B/C 全量 benchmark 保持 live",
          ok: Boolean(latestFullBaseline && latestFullBaselineHealth?.fallbackStages === 0 && latestFullBaselineHealth.errorStages === 0),
          detail: latestFullBaseline ? latestFullBaseline.fileName : "尚未发现全量 benchmark",
        },
        {
          label: "golden regression 无漂移",
          ok: Boolean(goldenRegression?.diffSummary && (goldenRegression.diffSummary.drifted ?? 0) === 0 && (goldenRegression.diffSummary.missingBaseline ?? 0) === 0),
          detail: goldenRegression?.baseline?.resolvedVersion ?? "未找到 golden regression 输出",
        },
        {
          label: "golden audit 全部通过",
          ok: Boolean(goldenAudit && (goldenAudit.failed ?? 0) === 0),
          detail: goldenAudit ? `${goldenAudit.passed ?? 0}/${goldenAudit.total ?? 0} passed` : "未找到 golden audit 输出",
        },
        {
          label: "iOS shell regression 通过",
          ok: Boolean(iosRegression && (iosRegression.failed ?? 0) === 0),
          detail: iosRegression ? `${iosRegression.passed ?? 0}/${iosRegression.total ?? 0} passed` : "未找到 iOS regression 输出",
        },
        {
          label: "iOS native smoke 已跑通",
          ok: Boolean(iosNativeSmoke),
          detail: iosNativeSmoke?.device?.name ?? "未找到 native smoke 输出",
        },
        {
          label: "真机相机/相册 allow-deny-cancel 记录",
          ok: Boolean(manualRealDevice && manualRealDevice.ready),
          detail: manualRealDevice
            ? `${manualRealDevice.completedChecks}/${manualRealDevice.totalChecks} completed${manualRealDevice.latestCompletedItem ? ` · latest ${manualRealDevice.latestCompletedItem.label}` : ""}`
            : "尚未读取到 acceptance board。",
        },
      ],
    },
    pilotExecution: {
      status: pilotExecutionStatus,
      reason: pilotSummary.reason,
      requiredEffectiveSessions: 2,
      recordedSessions: completedPilotSessions.length,
      effectiveSessions: effectivePilotSessions.length,
      pendingSessions: pendingPilotSessions.length,
      sessions: pilotSessions,
      nextSteps: pilotSummary.nextSteps,
      feedback: pilotFeedback,
      docs: {
        runbookPath: pilotRunbookSnapshot?.filePath ?? PILOT_RUNBOOK_PATH,
        handoffPath: pilotHandoffSnapshot?.filePath ?? PILOT_HANDOFF_PATH,
        summaryPath: pilotSummarySnapshot?.filePath ?? PILOT_SUMMARY_PATH,
        feedbackLogPath: pilotFeedbackLogSnapshot?.filePath ?? PILOT_FEEDBACK_LOG_PATH,
      },
    },
  };
}
