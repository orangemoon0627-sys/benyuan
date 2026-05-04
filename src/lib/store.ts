import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { sampleReport } from "@/lib/fixtures/report";
import { buildAnalysisInput, buildCompletedPipelineStages, buildFailedPipelineStages, buildQueuedPipelineStages, buildRunningPipelineStages, resolveAnalysisEngine, transitionPipelineStages, type AnalysisAdminImpactMatrixItem } from "@/lib/analysis";
import type { AssessmentContentDraftBlueprint } from "@/features/assessment";
import { getLabRouteMeta } from "@/lib/lab-route-meta";
import { normalizeReportPayload } from "@/lib/report-normalization";
import type { AnalysisJob, DraftDeliveryStatus, DraftMilestoneStatus, DraftReviewPriority, DraftRouteReviewState, DraftRouteSessionSummary, DraftSessionRecord, DraftSimulationImpactArea, DraftSimulationResult, DraftSimulationRouteCheck, DraftWorkflowMilestone, DraftWorkflowRouteProgress, DraftWorkflowState, DraftWorkflowSummary, FeatureVector, ReportPayload, TestSession } from "@/lib/types";

type PersistedStore = {
  sessions: Record<string, TestSession>;
  featureVectors: Record<string, FeatureVector>;
  jobs: Record<string, AnalysisJob>;
  reports: Record<string, ReportPayload>;
  drafts: Record<string, DraftSessionRecord>;
};

type SessionRuntimeSnapshot = {
  session: TestSession | undefined;
  currentJob: AnalysisJob | undefined;
  latestJob: AnalysisJob | undefined;
  report: ReportPayload | undefined;
  featureVector: FeatureVector | undefined;
};

type SessionRuntimeSummary = {
  sessionId: string;
  mode: TestSession["mode"];
  assessmentVersion: string;
  lifecycleStatus: TestSession["lifecycleStatus"];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  currentJobId?: string;
  latestReportId?: string;
  answerCount: number;
  moodKeywordCount: number;
  currentJobStatus?: AnalysisJob["status"];
  latestJobStatus?: AnalysisJob["status"];
  currentStageKey?: AnalysisJob["currentStageKey"];
  pipelineStages?: AnalysisJob["pipelineStages"];
  reportReady: boolean;
  featureVectorReady: boolean;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "benyuan-store.json");

const defaultStore = (): PersistedStore => ({
  sessions: {},
  featureVectors: {},
  jobs: {},
  reports: {
    [sampleReport.sessionId]: sampleReport,
  },
  drafts: {},
});

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<PersistedStore>;
  return {
    ...defaultStore(),
    ...parsed,
    sessions: parsed.sessions ?? {},
    featureVectors: parsed.featureVectors ?? {},
    jobs: parsed.jobs ?? {},
    reports: parsed.reports ?? defaultStore().reports,
    drafts: parsed.drafts ?? {},
  } satisfies PersistedStore;
}

async function writeStore(store: PersistedStore) {
  const tempFile = `${STORE_FILE}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await rename(tempFile, STORE_FILE);
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function sortRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortRecord);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortRecord(nested)]),
    );
  }
  return value;
}

function buildDraftSignature(value: unknown) {
  return JSON.stringify(sortRecord(value));
}

function upsertDraftRecord(
  store: PersistedStore,
  next: Omit<DraftSessionRecord, "createdAt" | "updatedAt" | "status">,
) {
  const current = store.drafts[next.draftId];
  const now = new Date().toISOString();
  const changed = current?.payloadSignature !== next.payloadSignature;

  const record: DraftSessionRecord = {
    ...next,
    createdAt: current?.createdAt ?? now,
    updatedAt: changed || !current ? now : current.updatedAt,
    status: !current ? "synced" : changed ? "updated" : current.status,
  };

  store.drafts[next.draftId] = record;
  return record;
}


function listSessionJobsFromStore(store: PersistedStore, sessionId: string) {
  return Object.values(store.jobs)
    .filter((job) => job.sessionId === sessionId)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function getLatestJobFromStore(store: PersistedStore, sessionId: string) {
  const jobs = listSessionJobsFromStore(store, sessionId);
  return jobs[jobs.length - 1];
}

function getRuntimeSnapshotFromStore(store: PersistedStore, sessionId: string): SessionRuntimeSnapshot {
  const session = store.sessions[sessionId];
  const latestJob = getLatestJobFromStore(store, sessionId);
  const currentJob = session?.currentJobId ? store.jobs[session.currentJobId] : latestJob;

  return {
    session,
    currentJob,
    latestJob,
    report: store.reports[sessionId] ? normalizeReportPayload(store.reports[sessionId]) : undefined,
    featureVector: store.featureVectors[sessionId],
  };
}

export async function createSession(session: Omit<TestSession, "sessionId" | "createdAt" | "updatedAt" | "lifecycleStatus">) {
  const store = await readStore();
  const timestamp = new Date().toISOString();
  const record: TestSession = {
    ...session,
    sessionId: uid("sess"),
    lifecycleStatus: "accepted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.sessions[record.sessionId] = record;
  await writeStore(store);
  return record;
}

export async function getSession(sessionId: string) {
  const store = await readStore();
  return store.sessions[sessionId];
}

export async function getSessionRuntime(sessionId: string) {
  const store = await readStore();
  return getRuntimeSnapshotFromStore(store, sessionId);
}

export async function listSessionRuntimeSummaries(limit = 12) {
  const store = await readStore();

  return Object.values(store.sessions)
    .sort((left, right) => {
      const rightTimestamp = new Date(right.updatedAt ?? right.createdAt).getTime();
      const leftTimestamp = new Date(left.updatedAt ?? left.createdAt).getTime();
      return rightTimestamp - leftTimestamp;
    })
    .slice(0, limit)
    .map((session) => {
      const runtime = getRuntimeSnapshotFromStore(store, session.sessionId);
      const updatedAt = session.updatedAt ?? session.createdAt;
      return {
        sessionId: session.sessionId,
        mode: session.mode,
        assessmentVersion: session.assessmentVersion,
        lifecycleStatus: session.lifecycleStatus,
        createdAt: session.createdAt,
        updatedAt,
        completedAt: session.completedAt,
        currentJobId: session.currentJobId,
        latestReportId: session.latestReportId,
        answerCount: session.answers.length,
        moodKeywordCount: session.basicInfo.moodKeywords.length,
        currentJobStatus: runtime.currentJob?.status,
        latestJobStatus: runtime.latestJob?.status,
        currentStageKey: runtime.currentJob?.currentStageKey,
        pipelineStages: runtime.currentJob?.pipelineStages,
        reportReady: Boolean(runtime.report),
        featureVectorReady: Boolean(runtime.featureVector),
      } satisfies SessionRuntimeSummary;
    });
}

export async function getDraftSession(draftId: string) {
  const store = await readStore();
  return store.drafts[draftId];
}

export async function getDraftWorkflowSummary(draftId: string) {
  const store = await readStore();
  const draft = store.drafts[draftId];
  if (!draft) return undefined;
  const simulation = simulateDraftApplicationFromStore(store, draftId);
  return buildDraftWorkflowSummary(store, draft, simulation);
}

export async function getLinkedDraftSessions(draftId: string) {
  const store = await readStore();
  const draft = store.drafts[draftId];
  if (!draft) return [];
  return draft.linkedDraftIds.map((id) => store.drafts[id]).filter((value): value is DraftSessionRecord => Boolean(value));
}

function getRouteCheckTemplates(route: string, kind: DraftSessionRecord["kind"]) {
  if (route === "/lab/content") {
    return kind === "assessment_content"
      ? ["确认 patch line、版本差异和 linked analysis drafts 已同步。"]
      : ["确认 analysis 侧改动没有让题库解释层出现错位。"];
  }

  if (route === "/lab/schema") {
    return ["确认 question order、phase count 和 module diff 仍与目标版本一致。"];
  }

  if (route === "/lab/native-handoff") {
    return ["确认 native blueprint contract、screen sequence 与 answer type 提示仍可承接。"];
  }

  if (route === "/lab/kernel-admin") {
    return ["确认 impact matrix、risk level 和 linked drafts 已按最新草稿刷新。"];
  }

  if (route === "/lab/kernel") {
    return ["确认 prompt/schema/preset resolve 正常，preview 组合没有丢失。"];
  }

  if (route === "/lab/runtime") {
    return ["确认 engine/provider/prompt/schema 的组合仍可解析，fallback 状态符合预期。"];
  }

  if (route === "/lab/golden") {
    return ["确认 golden sample 是否需要重冻，以及 narrative / structure 回归是否可接受。"];
  }

  return ["确认该面板对当前草稿的摘要、联动状态和校验提示都已刷新。"];
}

function rankDraftImpactSeverity(severity: DraftSimulationImpactArea["severity"]) {
  if (severity === "blocking") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function resolveDraftReviewPriority(simulation: DraftSimulationResult | undefined): DraftReviewPriority {
  const topSeverity = simulation?.impactAreas
    .slice()
    .sort((left, right) => rankDraftImpactSeverity(right.severity) - rankDraftImpactSeverity(left.severity))[0]?.severity;

  if (topSeverity === "blocking") return "critical";
  if (topSeverity === "warning") return "high";
  return "normal";
}

function resolveDraftWorkflowState(draft: DraftSessionRecord, simulation: DraftSimulationResult | undefined): DraftWorkflowState {
  if (draft.status === "updated") return "apply_candidate";
  if (simulation?.status === "review_required") return "review_required";
  return "ready_to_apply";
}

function resolveDraftNextAction(state: DraftWorkflowState, draft: DraftSessionRecord, simulation: DraftSimulationResult | undefined) {
  if (state === "apply_candidate") {
    return draft.kind === "assessment_content"
      ? "先核对 patch document 与 schema/native 影响，再决定是否进入 apply。"
      : "先核对 prompt/schema/preset 改动面，再进入 runtime/golden 复核。";
  }

  if (state === "review_required") {
    return simulation?.routeChecks[0]?.checks[0] ?? "先打开首个 primary route，完成联动复核。";
  }

  return "当前草稿已满足 apply 前置检查，可以进入下一轮冻结或实施。";
}

function resolveMilestoneStatus(state: DraftWorkflowState, target: "route_review" | "apply_gate"): DraftMilestoneStatus {
  if (state === "ready_to_apply") return "done";
  if (state === "review_required") return target === "route_review" ? "in_progress" : "pending";
  return "pending";
}

function buildDraftWorkflowMilestones(
  draft: DraftSessionRecord,
  simulation: DraftSimulationResult | undefined,
  state: DraftWorkflowState,
): DraftWorkflowMilestone[] {
  return [
    {
      key: "draft_synced",
      title: "草稿落库",
      status: "done",
      detail: draft.status === "updated" ? "已有新 payload 等待下一轮 apply 决策。" : "当前草稿已同步进内部草稿库。",
    },
    {
      key: "impact_simulated",
      title: "影响面模拟",
      status: simulation ? "done" : "pending",
      detail: simulation ? `已生成 ${simulation.impactAreas.length} 个 impact areas。` : "尚未生成 simulation。",
    },
    {
      key: "route_review",
      title: "验证节点复核",
      status: resolveMilestoneStatus(state, "route_review"),
      detail: state === "ready_to_apply" ? "关键 route 已完成复核，可进入实施前冻结。" : state === "review_required" ? "正在 primary routes 上逐步复核。" : "先确认 patch 与影响矩阵，再开始逐路由复核。",
    },
    {
      key: "apply_gate",
      title: "Apply / Freeze Gate",
      status: resolveMilestoneStatus(state, "apply_gate"),
      detail: state === "ready_to_apply" ? "已满足进入 apply queue 或 freeze candidate 的前置条件。" : "仍需完成 route review 与 linked draft 复核。",
    },
  ];
}

function resolveRouteReviewState(state: DraftWorkflowState, priority: DraftSimulationRouteCheck["priority"]): DraftRouteReviewState {
  if (state === "ready_to_apply") return "completed";
  if (state === "review_required") return priority === "primary" ? "in_progress" : "pending";
  return "pending";
}

function buildDraftWorkflowRouteProgress(
  simulation: DraftSimulationResult | undefined,
  state: DraftWorkflowState,
): DraftWorkflowRouteProgress[] {
  return (simulation?.routeChecks ?? []).map((routeCheck) => {
    const reviewState = resolveRouteReviewState(state, routeCheck.priority);
    return {
      route: routeCheck.route,
      title: routeCheck.title,
      priority: routeCheck.priority,
      state: reviewState,
      completedChecks: reviewState === "completed" ? routeCheck.checks.length : reviewState === "in_progress" ? 1 : 0,
      totalChecks: routeCheck.checks.length,
    } satisfies DraftWorkflowRouteProgress;
  });
}

function buildDraftReadinessScore(
  state: DraftWorkflowState,
  simulation: DraftSimulationResult | undefined,
  routeProgress: DraftWorkflowRouteProgress[],
) {
  const base = state === "apply_candidate" ? 28 : state === "review_required" ? 64 : 92;
  const blockingPenalty = (simulation?.impactAreas.filter((item) => item.severity === "blocking").length ?? 0) * 6;
  const routeCompletion = routeProgress.length === 0
    ? 0
    : Math.round(routeProgress.reduce((sum, item) => sum + item.completedChecks / Math.max(item.totalChecks, 1), 0) / routeProgress.length * 18);
  return Math.max(0, Math.min(100, base - blockingPenalty + routeCompletion));
}

function resolveDraftDeliveryStatus(
  state: DraftWorkflowState,
  reviewPriority: DraftReviewPriority,
  linkedDraftCount: number,
  readinessScore: number,
): DraftDeliveryStatus {
  if (state === "ready_to_apply" && reviewPriority === "normal" && linkedDraftCount === 0 && readinessScore >= 90) {
    return "archived";
  }

  if (state === "ready_to_apply") {
    return "apply_queue";
  }

  return "freeze_candidate";
}

function buildDraftWorkflowSummary(store: PersistedStore, draft: DraftSessionRecord, simulation?: DraftSimulationResult): DraftWorkflowSummary {
  const linkedDrafts = draft.linkedDraftIds
    .map((id) => store.drafts[id])
    .filter((value): value is DraftSessionRecord => Boolean(value));
  const lastCheckedAt = [draft.updatedAt, ...linkedDrafts.map((item) => item.updatedAt)]
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? draft.updatedAt;
  const state = resolveDraftWorkflowState(draft, simulation);
  const reviewPriority = resolveDraftReviewPriority(simulation);
  const routeProgress = buildDraftWorkflowRouteProgress(simulation, state);
  const milestones = buildDraftWorkflowMilestones(draft, simulation, state);
  const readinessScore = buildDraftReadinessScore(state, simulation, routeProgress);
  const linkedDraftCount = draft.linkedDraftIds.length;

  return {
    draftId: draft.draftId,
    state,
    reviewPriority,
    deliveryStatus: resolveDraftDeliveryStatus(state, reviewPriority, linkedDraftCount, readinessScore),
    nextAction: resolveDraftNextAction(state, draft, simulation),
    lastCheckedAt,
    blockingImpactCount: simulation?.impactAreas.filter((item) => item.severity === "blocking").length ?? 0,
    routeCount: draft.linkedRoutes.length,
    linkedDraftCount,
    readinessScore,
    milestones,
    routeProgress,
  } satisfies DraftWorkflowSummary;
}

function buildDraftImpactAreas(draft: DraftSessionRecord, linkedDrafts: DraftSessionRecord[]): DraftSimulationImpactArea[] {
  const impacts: DraftSimulationImpactArea[] = [];
  const hasRoute = (route: string) => draft.linkedRoutes.includes(route);
  const hasFile = (token: string) => draft.targetFiles.some((file) => file.includes(token));

  if (draft.kind === "assessment_content") {
    impacts.push({
      key: "content-structure",
      title: "题库结构与单题流程",
      severity: "blocking",
      summary: "题目顺序、phase 编排和版本描述一旦变化，单题推进、review 回跳和草稿恢复都要跟着重验。",
      reasons: [
        draft.baseVersion && draft.targetVersion ? `版本迁移：${draft.baseVersion} -> ${draft.targetVersion}` : "题库结构草稿更新",
        hasFile("version-manifests") ? "manifest 元数据被触达。" : "question source 发生变化。",
      ],
      routes: ["/lab/content", "/lab/schema"].filter(hasRoute),
    });

    if (linkedDrafts.length > 0 || hasFile("analysis-mapping")) {
      impacts.push({
        key: "analysis-linkage",
        title: "分析映射与解释层联动",
        severity: "blocking",
        summary: "新增模块或题序偏移会直接影响 feature mapping、解释重心和报告段落的承接方式。",
        reasons: [
          linkedDrafts.length > 0 ? `存在 ${linkedDrafts.length} 个关联 analysis drafts。` : "analysis mapping 文件被触达。",
          `关联草稿：${linkedDrafts.map((item) => item.draftId).join(" · ") || "-"}`,
        ],
        routes: ["/lab/kernel-admin", "/lab/content"].filter(hasRoute),
      });
    }

    if (hasRoute("/lab/schema") || hasRoute("/lab/native-handoff") || hasFile("assessment-schema")) {
      impacts.push({
        key: "client-contract",
        title: "Schema / Native 契约",
        severity: hasFile("assessment-schema") ? "blocking" : "warning",
        summary: "answer type、presentation kind 与 flow contract 的变化，需要 Web、iOS、RN 共用契约继续对齐。",
        reasons: [
          hasFile("assessment-schema") ? "assessment schema 文件进入改动面。" : "linked routes 已覆盖 schema/native handoff。",
          "需要同时检查 schema matrix 与 native handoff 的承接状态。",
        ],
        routes: ["/lab/schema", "/lab/native-handoff"].filter(hasRoute),
      });
    }
  } else {
    const isPrompt = draft.sourceKey === "prompt_templates";
    const isSchema = draft.sourceKey === "report_schemas";
    const isPreset = draft.sourceKey === "runtime_preview_presets";

    impacts.push({
      key: "analysis-runtime",
      title: isPreset ? "运行路径与预设组合" : "分析内核运行态",
      severity: isPreset ? "warning" : "blocking",
      summary: isPreset
        ? "preset 变化决定 workbench 如何复现 engine/provider 路径，是整个内核实验面的入口层。"
        : "prompt / schema 变化会立刻影响 runtime resolve、解释风格与回归视图。",
      reasons: [
        isPrompt ? "prompt template 会先改 narrative 风格。" : isSchema ? "report schema 会改输出结构和推荐数量。" : "runtime preset 会改 engine/provider/prompt/schema 组合。",
        `关联 routes：${draft.linkedRoutes.join(" · ") || "-"}`,
      ],
      routes: ["/lab/kernel", "/lab/runtime", "/lab/kernel-admin"].filter(hasRoute),
    });

    if (isPrompt || isSchema || hasRoute("/lab/golden")) {
      impacts.push({
        key: "golden-regression",
        title: "Golden 基线与报告回归",
        severity: isSchema ? "blocking" : "warning",
        summary: "只要 narrative 或结构层发生变化，就需要重新确认 golden sample 是否还能代表当前输出。",
        reasons: [
          isSchema ? "report schema 直接影响报告段落与导出布局。" : "prompt/golden 回归需要对齐新的叙事风格。",
          linkedDrafts.length > 0 ? `还牵动 ${linkedDrafts.length} 个内容草稿。` : "当前没有额外内容草稿联动。",
        ],
        routes: ["/lab/golden", "/lab/content"].filter(hasRoute),
      });
    }

    if (linkedDrafts.length > 0) {
      impacts.push({
        key: "content-backlink",
        title: "题库侧反向校验",
        severity: "warning",
        summary: "analysis 草稿虽然改的是配置层，但仍需回看题库结构草案，确认解释语气和结构没有与题目体系脱节。",
        reasons: [
          `linked content drafts：${linkedDrafts.map((item) => item.draftId).join(" · ")}`,
          "需要在 content / schema / native handoff 重新确认承接关系。",
        ],
        routes: ["/lab/content", "/lab/schema", "/lab/native-handoff"].filter(hasRoute),
      });
    }
  }

  return impacts;
}

function buildDraftRouteChecks(draft: DraftSessionRecord): DraftSimulationRouteCheck[] {
  return draft.linkedRoutes.map((route, index) => {
    const meta = getLabRouteMeta(route);
    return {
      route,
      title: meta?.title ?? route,
      reason: meta?.detail ?? "用于复核当前草稿是否已被对应面板完整承接。",
      priority: index < 3 ? "primary" : "secondary",
      checks: getRouteCheckTemplates(route, draft.kind),
    } satisfies DraftSimulationRouteCheck;
  });
}

function simulateDraftApplicationFromStore(store: PersistedStore, draftId: string) {
  const draft = store.drafts[draftId];
  if (!draft) return undefined;

  const linkedDrafts = draft.linkedDraftIds.map((id) => store.drafts[id]).filter((value): value is DraftSessionRecord => Boolean(value));
  const applyOrder = draft.kind === "assessment_content"
    ? [
        "1. 应用题库 manifest / source patch",
        "2. 复核 schema / analysis mapping / native contract",
        "3. 重新打开 linked analysis drafts 做联动检查",
      ]
    : [
        "1. 应用 analysis config patch",
        "2. 在 runtime / kernel workbench 重算组合状态",
        "3. 回到 linked content drafts 确认解释层是否仍匹配",
      ];

  const routeChecks = buildDraftRouteChecks(draft);
  const impactAreas = buildDraftImpactAreas(draft, linkedDrafts);
  const verificationChecklist = [
    ...routeChecks.map((item) => `检查 ${item.route} · ${item.checks[0]}`),
    ...linkedDrafts.map((item) => `复核关联草稿 ${item.draftId}`),
  ];

  const notes = draft.kind === "assessment_content"
    ? [
        draft.baseVersion && draft.targetVersion ? `版本变更：${draft.baseVersion} -> ${draft.targetVersion}` : "结构草案变更",
        `source key：${draft.sourceKey}`,
        `影响域：${impactAreas.map((item) => item.title).join(" · ")}`,
      ]
    : [
        `analysis surface：${draft.sourceKey}`,
        `linked content drafts：${linkedDrafts.length}`,
        `影响域：${impactAreas.map((item) => item.title).join(" · ")}`,
      ];

  return {
    draftId: draft.draftId,
    status: linkedDrafts.length > 0 ? "review_required" : "ready",
    kind: draft.kind,
    applyOrder,
    refreshedRoutes: draft.linkedRoutes,
    impactedDraftIds: linkedDrafts.map((item) => item.draftId),
    touchedFiles: draft.targetFiles,
    verificationChecklist,
    notes,
    impactAreas,
    routeChecks,
  } satisfies DraftSimulationResult;
}

export async function simulateDraftApplication(draftId: string) {
  const store = await readStore();
  return simulateDraftApplicationFromStore(store, draftId);
}

export async function listDraftSessions() {
  const store = await readStore();
  return Object.values(store.drafts).sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export async function listDraftWorkflowSummaries() {
  const store = await readStore();
  return Object.values(store.drafts)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map((draft) => {
      const simulation = simulateDraftApplicationFromStore(store, draft.draftId);
      return {
        draft,
        simulation,
        workflow: buildDraftWorkflowSummary(store, draft, simulation),
      };
    });
}

export async function listDraftSessionsForRoute(route: string) {
  const store = await readStore();
  return Object.values(store.drafts)
    .filter((draft) => draft.linkedRoutes.includes(route))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map((draft) => {
      const simulation = simulateDraftApplicationFromStore(store, draft.draftId);
      return {
        route,
        draft,
        simulation,
        routeCheck: simulation?.routeChecks.find((item) => item.route === route),
        workflow: buildDraftWorkflowSummary(store, draft, simulation),
      } satisfies DraftRouteSessionSummary;
    });
}

function rankWorkflowSummaryItem(
  item: { workflow: DraftWorkflowSummary },
) {
  const priorityRank = item.workflow.reviewPriority === "critical" ? 3 : item.workflow.reviewPriority === "high" ? 2 : 1;
  const deliveryRank = item.workflow.deliveryStatus === "freeze_candidate" ? 3 : item.workflow.deliveryStatus === "apply_queue" ? 2 : 1;
  return { priorityRank, deliveryRank };
}

function sortDraftWorkflowItems(
  left: { workflow: DraftWorkflowSummary },
  right: { workflow: DraftWorkflowSummary },
) {
  const leftRank = rankWorkflowSummaryItem(left);
  const rightRank = rankWorkflowSummaryItem(right);
  if (rightRank.priorityRank !== leftRank.priorityRank) return rightRank.priorityRank - leftRank.priorityRank;
  if (rightRank.deliveryRank !== leftRank.deliveryRank) return rightRank.deliveryRank - leftRank.deliveryRank;
  if (right.workflow.blockingImpactCount !== left.workflow.blockingImpactCount) {
    return right.workflow.blockingImpactCount - left.workflow.blockingImpactCount;
  }
  if (left.workflow.deliveryStatus === "apply_queue" || right.workflow.deliveryStatus === "apply_queue") {
    return right.workflow.readinessScore - left.workflow.readinessScore;
  }
  return new Date(right.workflow.lastCheckedAt).getTime() - new Date(left.workflow.lastCheckedAt).getTime();
}

function buildDeliveryChecklistStatus(score: number, reviewScore: number) {
  if (score >= reviewScore) return "done" as const;
  if (score > 0) return "review" as const;
  return "pending" as const;
}

function buildFreezeChecklist(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
  simulation?: DraftSimulationResult;
}) {
  const completedRoutes = item.workflow.routeProgress.filter((entry) => entry.state === "completed").length;
  const totalRoutes = item.workflow.routeProgress.length;
  const hasRuntimeOrGolden = item.draft.linkedRoutes.some((route) => route === "/lab/runtime" || route === "/lab/golden");

  return [
    {
      key: "blocking-impacts",
      title: "清空 blocking impacts",
      status: buildDeliveryChecklistStatus(item.workflow.blockingImpactCount === 0 ? 2 : 0, 2),
      detail: item.workflow.blockingImpactCount === 0
        ? "当前没有 blocking 级影响域，可以继续冻结前检查。"
        : `仍有 ${item.workflow.blockingImpactCount} 个 blocking impacts 需要先消化。`,
    },
    {
      key: "route-review",
      title: "完成 route review",
      status: buildDeliveryChecklistStatus(totalRoutes === 0 ? 2 : completedRoutes === totalRoutes ? 2 : completedRoutes > 0 ? 1 : 0, 2),
      detail: totalRoutes === 0
        ? "当前没有显式 route review 队列。"
        : `已完成 ${completedRoutes}/${totalRoutes} 个 route review。`,
    },
    {
      key: "linked-drafts",
      title: "联动草稿对齐",
      status: buildDeliveryChecklistStatus(item.workflow.linkedDraftCount === 0 ? 2 : 1, 2),
      detail: item.workflow.linkedDraftCount === 0
        ? "当前没有挂起的 linked drafts。"
        : `仍有 ${item.workflow.linkedDraftCount} 个 linked drafts 需要对齐。`,
    },
    {
      key: "runtime-golden",
      title: "runtime / golden 复核",
      status: buildDeliveryChecklistStatus(hasRuntimeOrGolden ? (item.workflow.reviewPriority === "normal" ? 1 : 0) : 2, 2),
      detail: hasRuntimeOrGolden
        ? "这次草稿会波及 runtime 或 golden，冻结前要补一次回归复核。"
        : "这次草稿没有直接命中 runtime / golden 验证面。",
    },
  ];
}

function buildApplyChecklist(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
  simulation?: DraftSimulationResult;
}) {
  const allRoutesCompleted = item.workflow.routeProgress.length > 0 && item.workflow.routeProgress.every((entry) => entry.state === "completed");
  const hasApplyOrder = Boolean(item.simulation && item.simulation.applyOrder.length > 0);

  return [
    {
      key: "apply-order",
      title: "确认 apply 顺序",
      status: buildDeliveryChecklistStatus(hasApplyOrder ? (item.workflow.deliveryStatus === "freeze_candidate" ? 1 : 2) : 0, 2),
      detail: hasApplyOrder
        ? `已生成 ${item.simulation?.applyOrder.length ?? 0} 步 apply 顺序，可作为执行脚本。`
        : "当前还没有可执行的 apply 顺序。",
    },
    {
      key: "touched-files",
      title: "锁定 touched files",
      status: buildDeliveryChecklistStatus(item.simulation?.touchedFiles.length ? 2 : 0, 2),
      detail: item.simulation?.touchedFiles.length
        ? `本次变更会触达 ${item.simulation.touchedFiles.length} 个文件。`
        : "当前没有明确的 touched files 列表。",
    },
    {
      key: "verification-window",
      title: "保留 post-apply 验证窗口",
      status: buildDeliveryChecklistStatus(allRoutesCompleted ? 2 : item.workflow.routeProgress.some((entry) => entry.state === "in_progress") ? 1 : 0, 2),
      detail: item.workflow.routeProgress.length === 0
        ? "当前没有 route-based 验证窗口。"
        : `route review 完成度：${item.workflow.routeProgress.filter((entry) => entry.state === "completed").length}/${item.workflow.routeProgress.length}`,
    },
    {
      key: "archive-slot",
      title: "归档位与回退点",
      status: buildDeliveryChecklistStatus(item.workflow.deliveryStatus === "archived" ? 2 : item.workflow.deliveryStatus === "apply_queue" ? 1 : 0, 2),
      detail: item.workflow.deliveryStatus === "archived"
        ? "当前草稿已经进入归档态。"
        : item.workflow.deliveryStatus === "apply_queue"
          ? "apply 之后可直接转入归档或保留回退点。"
          : "还没到可以预留归档位的时候。",
    },
  ];
}

function buildReleaseChain(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
  simulation?: DraftSimulationResult;
}) {
  const hitsSchema = item.draft.linkedRoutes.includes("/lab/schema");
  const hitsNative = item.draft.linkedRoutes.includes("/lab/native-handoff") || item.draft.targetFiles.some((file) => file.includes("assessment-schema"));
  const hitsAnalysis = item.workflow.linkedDraftCount > 0 || item.simulation?.impactAreas.some((area) => area.title.includes("分析") || area.title.includes("analysis"));

  return [
    {
      key: "content",
      layer: item.draft.kind === "assessment_content" ? "content patch" : "analysis patch",
      status: "done" as const,
      detail: `${item.draft.sourceKey} · ${item.draft.targetFiles.length} files`,
    },
    {
      key: "schema",
      layer: "schema contract",
      status: !hitsSchema ? "skip" as const : item.workflow.blockingImpactCount > 0 ? "review" as const : "done" as const,
      detail: hitsSchema ? `routes：${item.draft.linkedRoutes.filter((route) => route === "/lab/schema").join(" · ") || "/lab/schema"}` : "本次变更未直接命中 schema 面板。",
    },
    {
      key: "native",
      layer: "native handoff",
      status: !hitsNative ? "skip" as const : item.workflow.deliveryStatus === "archived" ? "done" as const : "review" as const,
      detail: hitsNative ? "需要同步 screen sequence / blueprint contract。" : "本次变更未命中 native handoff。",
    },
    {
      key: "analysis",
      layer: "analysis linkage",
      status: !hitsAnalysis ? "done" as const : item.workflow.deliveryStatus === "archived" ? "done" as const : "review" as const,
      detail: hitsAnalysis ? `linked drafts：${item.workflow.linkedDraftCount}` : "当前没有额外 analysis linkage。",
    },
    {
      key: "release",
      layer: "release window",
      status: item.workflow.deliveryStatus === "archived" ? "done" as const : item.workflow.deliveryStatus === "apply_queue" ? "review" as const : "pending" as const,
      detail: item.workflow.deliveryStatus === "archived"
        ? "已完成交付并进入归档。"
        : item.workflow.deliveryStatus === "apply_queue"
          ? "可进入 apply window，等待执行与回归。"
          : "仍停留在冻结前检查层。",
    },
  ];
}

function resolveRecommendedOwner(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
  simulation?: DraftSimulationResult;
}) {
  const hitsNative = item.draft.linkedRoutes.includes("/lab/native-handoff") || item.draft.targetFiles.some((file) => file.includes("assessment-schema"));
  const hitsAnalysis = item.draft.kind === "analysis_admin"
    || item.simulation?.impactAreas.some((area) => area.title.toLowerCase().includes("analysis") || area.title.includes("分析"));
  const hitsFrontend = item.draft.linkedRoutes.some((route) => route === "/lab/schema" || route === "/lab/content");

  if (hitsNative) return "native";
  if (hitsAnalysis) return "analysis";
  if (hitsFrontend) return "frontend";
  return "ops";
}

function resolveSupportOwners(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
}) {
  const owners = new Set<string>();

  if (item.draft.linkedRoutes.some((route) => route === "/lab/golden" || route === "/lab/runtime")) {
    owners.add("ops");
  }

  if (item.workflow.linkedDraftCount > 0) {
    owners.add("analysis");
  }

  if (item.draft.linkedRoutes.includes("/lab/native-handoff") || item.draft.targetFiles.some((file) => file.includes("assessment-schema"))) {
    owners.add("native");
  }

  if (item.draft.linkedRoutes.some((route) => route === "/lab/schema" || route === "/lab/content")) {
    owners.add("frontend");
  }

  return Array.from(owners);
}

function buildRecommendedRouteOrder(item: {
  draft: DraftSessionRecord;
  workflow: DraftWorkflowSummary;
}) {
  const routeEntries = item.workflow.routeProgress.length > 0
    ? item.workflow.routeProgress.map((entry) => ({
      route: entry.route,
      title: entry.title,
      priority: entry.priority,
      state: entry.state,
      completedChecks: entry.completedChecks,
      totalChecks: entry.totalChecks,
    }))
    : item.draft.linkedRoutes.map((route, index) => ({
      route,
      title: getLabRouteMeta(route)?.title ?? route,
      priority: index === 0 ? "primary" as const : "secondary" as const,
      state: "pending" as const,
      completedChecks: 0,
      totalChecks: 0,
    }));

  const stateRank = (state: "pending" | "in_progress" | "completed") => {
    if (state === "pending") return 3;
    if (state === "in_progress") return 2;
    return 1;
  };

  return routeEntries
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority === "primary" ? -1 : 1;
      if (stateRank(right.state) !== stateRank(left.state)) return stateRank(right.state) - stateRank(left.state);
      return left.route.localeCompare(right.route);
    })
    .map((entry) => ({
      route: entry.route,
      title: entry.title,
      reason:
        entry.state === "completed"
          ? `${entry.priority === "primary" ? "primary" : "secondary"} route，已完成 ${entry.completedChecks}/${entry.totalChecks || entry.completedChecks} checks。`
          : entry.state === "in_progress"
            ? `${entry.priority === "primary" ? "primary" : "secondary"} route，当前 review 进行中。`
            : `${entry.priority === "primary" ? "primary" : "secondary"} route，建议优先补齐验证。`,
    }));
}

function resolveNextBestAction(item: {
  workflow: DraftWorkflowSummary;
  freezeChecklist: Array<{ title: string; status: "done" | "review" | "pending"; detail: string }>;
  applyChecklist: Array<{ title: string; status: "done" | "review" | "pending"; detail: string }>;
}) {
  const freezeEntry = item.freezeChecklist.find((entry) => entry.status !== "done");
  if (freezeEntry) {
    return `Freeze · ${freezeEntry.title} · ${freezeEntry.detail}`;
  }

  const applyEntry = item.applyChecklist.find((entry) => entry.status !== "done");
  if (applyEntry) {
    return `Apply · ${applyEntry.title} · ${applyEntry.detail}`;
  }

  return item.workflow.nextAction;
}

export async function getDraftDeliverySnapshot() {
  const store = await readStore();
  const items = Object.values(store.drafts)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map((draft) => {
      const simulation = simulateDraftApplicationFromStore(store, draft.draftId);
      const workflow = buildDraftWorkflowSummary(store, draft, simulation);
      const freezeChecklist = buildFreezeChecklist({ draft, workflow, simulation });
      const applyChecklist = buildApplyChecklist({ draft, workflow, simulation });
      const recommendedOwner = resolveRecommendedOwner({ draft, workflow, simulation });
      const supportOwners = resolveSupportOwners({ draft, workflow }).filter((owner) => owner !== recommendedOwner);
      const recommendedRouteOrder = buildRecommendedRouteOrder({ draft, workflow });
      return {
        draft,
        simulation,
        workflow,
        freezeChecklist,
        applyChecklist,
        releaseChain: buildReleaseChain({ draft, workflow, simulation }),
        recommendedOwner,
        supportOwners,
        recommendedRouteOrder,
        nextBestAction: resolveNextBestAction({ workflow, freezeChecklist, applyChecklist }),
      };
    });

  const buckets = {
    freezeCandidate: items.filter((item) => item.workflow.deliveryStatus === "freeze_candidate").sort(sortDraftWorkflowItems),
    applyQueue: items.filter((item) => item.workflow.deliveryStatus === "apply_queue").sort(sortDraftWorkflowItems),
    archived: items.filter((item) => item.workflow.deliveryStatus === "archived").sort(sortDraftWorkflowItems),
  };

  const routeLoadMap = new Map<string, {
    route: string;
    title: string;
    linkedDrafts: number;
    freezeCandidateCount: number;
    applyQueueCount: number;
    archivedCount: number;
    criticalCount: number;
    averageReadiness: number;
    nextActions: string[];
  }>();

  for (const item of items) {
    const progressEntries = item.workflow.routeProgress.length > 0
      ? item.workflow.routeProgress
      : item.draft.linkedRoutes.map((route) => ({ route, title: getLabRouteMeta(route)?.title ?? route }));

    for (const entry of progressEntries) {
      const current = routeLoadMap.get(entry.route) ?? {
        route: entry.route,
        title: entry.title,
        linkedDrafts: 0,
        freezeCandidateCount: 0,
        applyQueueCount: 0,
        archivedCount: 0,
        criticalCount: 0,
        averageReadiness: 0,
        nextActions: [],
      };

      current.linkedDrafts += 1;
      current.averageReadiness += item.workflow.readinessScore;
      current.nextActions = Array.from(new Set([...current.nextActions, item.nextBestAction]));
      if (item.workflow.deliveryStatus === "freeze_candidate") current.freezeCandidateCount += 1;
      if (item.workflow.deliveryStatus === "apply_queue") current.applyQueueCount += 1;
      if (item.workflow.deliveryStatus === "archived") current.archivedCount += 1;
      if (item.workflow.reviewPriority === "critical") current.criticalCount += 1;
      routeLoadMap.set(entry.route, current);
    }
  }

  const routeLoad = Array.from(routeLoadMap.values())
    .map((item) => ({
      ...item,
      averageReadiness: item.linkedDrafts === 0 ? 0 : Math.round(item.averageReadiness / item.linkedDrafts),
    }))
    .sort((left, right) => {
      if (right.freezeCandidateCount !== left.freezeCandidateCount) return right.freezeCandidateCount - left.freezeCandidateCount;
      if (right.applyQueueCount !== left.applyQueueCount) return right.applyQueueCount - left.applyQueueCount;
      if (right.criticalCount !== left.criticalCount) return right.criticalCount - left.criticalCount;
      return right.linkedDrafts - left.linkedDrafts;
    });

  const nextActionMap = items.reduce((map, item) => {
    const current = map.get(item.nextBestAction) ?? {
      action: item.nextBestAction,
      count: 0,
      criticalCount: 0,
      freezeCandidateCount: 0,
      applyQueueCount: 0,
      draftIds: [] as string[],
    };
    current.count += 1;
    if (item.workflow.reviewPriority === "critical") current.criticalCount += 1;
    if (item.workflow.deliveryStatus === "freeze_candidate") current.freezeCandidateCount += 1;
    if (item.workflow.deliveryStatus === "apply_queue") current.applyQueueCount += 1;
    current.draftIds.push(item.draft.draftId);
    map.set(item.nextBestAction, current);
    return map;
  }, new Map<string, {
    action: string;
    count: number;
    criticalCount: number;
    freezeCandidateCount: number;
    applyQueueCount: number;
    draftIds: string[];
  }>());

  const nextActions = Array.from(nextActionMap.values()).sort((left, right) => {
    if (right.criticalCount !== left.criticalCount) return right.criticalCount - left.criticalCount;
    if (right.freezeCandidateCount !== left.freezeCandidateCount) return right.freezeCandidateCount - left.freezeCandidateCount;
    return right.count - left.count;
  });

  const freezeChecklistSummary = items.map((item) => ({
    draftId: item.draft.draftId,
    title: item.draft.title,
    deliveryStatus: item.workflow.deliveryStatus,
    outstandingCount: item.freezeChecklist.filter((entry) => entry.status !== "done").length,
    reviewCount: item.freezeChecklist.filter((entry) => entry.status === "review").length,
    pendingCount: item.freezeChecklist.filter((entry) => entry.status === "pending").length,
  })).sort((left, right) => right.outstandingCount - left.outstandingCount);

  const applyChecklistSummary = items.map((item) => ({
    draftId: item.draft.draftId,
    title: item.draft.title,
    deliveryStatus: item.workflow.deliveryStatus,
    outstandingCount: item.applyChecklist.filter((entry) => entry.status !== "done").length,
    reviewCount: item.applyChecklist.filter((entry) => entry.status === "review").length,
    pendingCount: item.applyChecklist.filter((entry) => entry.status === "pending").length,
  })).sort((left, right) => right.outstandingCount - left.outstandingCount);

  const releaseChain = items.map((item) => ({
    draftId: item.draft.draftId,
    title: item.draft.title,
    deliveryStatus: item.workflow.deliveryStatus,
    recommendedOwner: item.recommendedOwner,
    supportOwners: item.supportOwners,
    nextBestAction: item.nextBestAction,
    recommendedRouteOrder: item.recommendedRouteOrder,
    chain: item.releaseChain,
  }));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDrafts: items.length,
      criticalDrafts: items.filter((item) => item.workflow.reviewPriority === "critical").length,
      freezeCandidates: buckets.freezeCandidate.length,
      applyQueue: buckets.applyQueue.length,
      archived: buckets.archived.length,
      averageReadiness: items.length === 0 ? 0 : Math.round(items.reduce((sum, item) => sum + item.workflow.readinessScore, 0) / items.length),
      freezeChecklistOutstanding: freezeChecklistSummary.reduce((sum, item) => sum + item.outstandingCount, 0),
      applyChecklistOutstanding: applyChecklistSummary.reduce((sum, item) => sum + item.outstandingCount, 0),
    },
    buckets,
    routeLoad,
    nextActions,
    freezeChecklistSummary,
    applyChecklistSummary,
    releaseChain,
  };
}

export async function syncWorkbenchDraftSessions(
  contentDrafts: AssessmentContentDraftBlueprint[],
  analysisDrafts: AnalysisAdminImpactMatrixItem[],
) {
  const store = await readStore();
  const contentDraftKeyMap = new Map(contentDrafts.map((draft) => [draft.key, draft.draftId]));
  const nextIds = new Set<string>();

  const content = contentDrafts.map((draft) => {
    nextIds.add(draft.draftId);
    return upsertDraftRecord(store, {
      draftId: draft.draftId,
      kind: "assessment_content",
      title: draft.title,
      sourceKey: draft.linkedQuestionSource,
      mode: draft.mode,
      baseVersion: draft.baseVersion,
      targetVersion: draft.targetVersion,
      summary: draft.summary,
      targetFiles: draft.targetFiles,
      linkedRoutes: draft.linkedRoutes,
      linkedDraftIds: analysisDrafts.filter((item) => item.linkedContentDraftKeys.includes(draft.key)).map((item) => item.draftId),
      payloadSignature: buildDraftSignature(draft.patchDocument),
    });
  });

  const analysis = analysisDrafts.map((draft) => {
    nextIds.add(draft.draftId);
    return upsertDraftRecord(store, {
      draftId: draft.draftId,
      kind: "analysis_admin",
      title: draft.title,
      sourceKey: draft.surfaceKey,
      summary: draft.why,
      targetFiles: [],
      linkedRoutes: draft.verificationRoutes,
      linkedDraftIds: draft.linkedContentDraftKeys.map((key) => contentDraftKeyMap.get(key)).filter((value): value is string => Boolean(value)),
      payloadSignature: buildDraftSignature(draft),
    });
  });

  for (const key of Object.keys(store.drafts)) {
    if (!nextIds.has(key) && (key.startsWith("draft.content.") || key.startsWith("draft.analysis."))) {
      delete store.drafts[key];
    }
  }

  await writeStore(store);

  return {
    content,
    analysis,
    all: Object.values(store.drafts).sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
  };
}

export async function createFeatureVector(session: TestSession) {
  const store = await readStore();
  const engine = resolveAnalysisEngine(session.mode);
  const { featureVector } = await engine.run(buildAnalysisInput(session));

  store.featureVectors[session.sessionId] = featureVector;
  await writeStore(store);
  return featureVector;
}

export async function getFeatureVector(sessionId: string) {
  const store = await readStore();
  return store.featureVectors[sessionId];
}

export async function createAnalysisJob(sessionId: string) {
  const store = await readStore();
  const session = store.sessions[sessionId];

  if (!session) {
    return undefined;
  }

  const timestamp = new Date().toISOString();
  const attempt = listSessionJobsFromStore(store, sessionId).length + 1;
  const job: AnalysisJob = {
    jobId: uid("job"),
    sessionId,
    status: "queued",
    attempt,
    createdAt: timestamp,
    currentStageKey: "input_prepared",
    pipelineStages: buildQueuedPipelineStages(),
  };

  store.jobs[job.jobId] = job;
  store.sessions[sessionId] = {
    ...session,
    lifecycleStatus: "analyzing",
    currentJobId: job.jobId,
    updatedAt: timestamp,
  };
  await writeStore(store);
  return job;
}

export async function ensureAnalysisJob(sessionId: string) {
  const store = await readStore();
  const snapshot = getRuntimeSnapshotFromStore(store, sessionId);

  if (!snapshot.session) {
    return { created: false, job: undefined, runtime: snapshot };
  }

  if (snapshot.report && snapshot.latestJob?.status === "done") {
    return { created: false, job: snapshot.latestJob, runtime: snapshot };
  }

  if (snapshot.currentJob && (snapshot.currentJob.status === "queued" || snapshot.currentJob.status === "running")) {
    return { created: false, job: snapshot.currentJob, runtime: snapshot };
  }

  const job = await createAnalysisJob(sessionId);
  const runtime = await getSessionRuntime(sessionId);
  return { created: true, job, runtime };
}

export async function getJob(jobId: string) {
  const store = await readStore();
  return store.jobs[jobId];
}

export async function getReport(sessionId: string) {
  const store = await readStore();
  return store.reports[sessionId] ? normalizeReportPayload(store.reports[sessionId]) : undefined;
}

async function updateAnalysisJobStage(
  jobId: string,
  sessionId: string,
  key: Parameters<typeof transitionPipelineStages>[1] | undefined,
  detail: string,
  status: Parameters<typeof transitionPipelineStages>[2] = "running",
) {
  if (!key) return;

  const store = await readStore();
  const job = store.jobs[jobId];
  const session = store.sessions[sessionId];
  if (!job || !session || job.status === "done" || job.status === "failed") return;

  const at = new Date().toISOString();
  job.currentStageKey = key;
  job.pipelineStages = transitionPipelineStages(job.pipelineStages as Parameters<typeof transitionPipelineStages>[0], key, status, detail, at);
  store.jobs[jobId] = job;
  store.sessions[sessionId] = {
    ...session,
    updatedAt: at,
  };
  await writeStore(store);
}

export async function runAnalysis(jobId: string) {
  const initialStore = await readStore();
  const initialJob = initialStore.jobs[jobId];

  if (!initialJob) return undefined;
  if (initialJob.status === "done") return initialJob;

  const session = initialStore.sessions[initialJob.sessionId];
  if (!session) {
    initialJob.status = "failed";
    initialJob.finishedAt = new Date().toISOString();
    initialJob.error = "session_not_found";
    initialStore.jobs[jobId] = initialJob;
    await writeStore(initialStore);
    return initialJob;
  }

  const startedAt = initialJob.startedAt ?? new Date().toISOString();
  initialJob.status = "running";
  initialJob.startedAt = startedAt;
  initialJob.currentStageKey = "input_prepared";
  initialJob.pipelineStages = buildRunningPipelineStages(startedAt);
  initialStore.jobs[jobId] = initialJob;
  initialStore.sessions[session.sessionId] = {
    ...session,
    lifecycleStatus: "analyzing",
    currentJobId: jobId,
    updatedAt: startedAt,
  };
  await writeStore(initialStore);

  const engine = resolveAnalysisEngine(session.mode);

  try {
    const latestStore = await readStore();
    const latestJob = latestStore.jobs[jobId];
    const latestSession = latestStore.sessions[session.sessionId];
    if (!latestJob || !latestSession) return undefined;

    const { featureVector, report, trace } = await engine.run(
      buildAnalysisInput(latestSession, {
        stageReporter: async (update) => {
          await updateAnalysisJobStage(jobId, latestSession.sessionId, update.key, update.detail, update.status ?? "running");
        },
      }),
    );
    const finishedAt = new Date().toISOString();
    const finalReport: ReportPayload = {
      ...report,
      generatedAt: finishedAt,
      analysisMeta: {
        ...trace,
        generatedFromJobId: jobId,
      },
    };

    latestJob.status = "done";
    latestJob.finishedAt = finishedAt;
    latestJob.engineId = trace.engineId;
    latestJob.engineLabel = trace.engineLabel;
    latestJob.engineKind = trace.engineKind;
    latestJob.effectiveRuntime = trace.effectiveRuntime;
    latestJob.providerId = trace.providerId;
    latestJob.providerKind = trace.providerKind;
    latestJob.providerRequestMode = trace.providerRequestMode;
    latestJob.providerModel = trace.providerModel;
    latestJob.providerEnhancementStatus = trace.providerEnhancementStatus;
    latestJob.providerLatencyMs = trace.providerLatencyMs;
    latestJob.providerFallbackReason = trace.providerFallbackReason;
    latestJob.providerCompletedScopes = trace.providerCompletedScopes;
    latestJob.providerTextReceived = trace.providerTextReceived;
    latestJob.providerResponsePreview = trace.providerResponsePreview;
    latestJob.promptTemplateId = trace.promptTemplateId;
    latestJob.promptTemplateVersion = trace.promptTemplateVersion;
    latestJob.reportSchemaId = trace.reportSchemaId;
    latestJob.reportSchemaVersion = trace.reportSchemaVersion;
    latestJob.answeredCount = trace.answeredCount;
    latestJob.openReflectionCount = trace.openReflectionCount;
    latestJob.topSignals = trace.topSignals;
    latestJob.currentStageKey = "persisted";
    latestJob.pipelineStages = buildCompletedPipelineStages(trace, latestJob.startedAt ?? finishedAt, finishedAt);
    latestJob.reportId = finalReport.reportId;

    latestStore.jobs[jobId] = latestJob;
    latestStore.featureVectors[latestSession.sessionId] = featureVector;
    latestStore.reports[latestSession.sessionId] = finalReport;
    latestStore.sessions[latestSession.sessionId] = {
      ...latestSession,
      lifecycleStatus: "completed",
      currentJobId: jobId,
      latestReportId: finalReport.reportId,
      updatedAt: finishedAt,
      completedAt: finishedAt,
    };
    await writeStore(latestStore);
    return latestJob;
  } catch (error) {
    const failedStore = await readStore();
    const failedJob = failedStore.jobs[jobId];
    const failedSession = failedStore.sessions[session.sessionId];
    if (!failedJob || !failedSession) return undefined;

    const finishedAt = new Date().toISOString();
    failedJob.status = "failed";
    failedJob.finishedAt = finishedAt;
    failedJob.error = error instanceof Error ? error.message : "analysis_failed";
    failedJob.pipelineStages = buildFailedPipelineStages(
      failedJob.pipelineStages as Parameters<typeof buildFailedPipelineStages>[0],
      finishedAt,
      failedJob.error,
    );
    failedStore.jobs[jobId] = failedJob;
    failedStore.sessions[failedSession.sessionId] = {
      ...failedSession,
      lifecycleStatus: "failed",
      currentJobId: jobId,
      updatedAt: finishedAt,
    };
    await writeStore(failedStore);
    return failedJob;
  }
}
