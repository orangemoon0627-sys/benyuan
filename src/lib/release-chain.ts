import { buildAssessmentContentWorkbench, buildAssessmentSchemaMigrationLedger } from "@/features/assessment";
import { buildAnalysisWorkbenchCatalog } from "@/lib/analysis";
import { getLabRouteMeta } from "@/lib/lab-route-meta";
import { projectRoadmapBoard } from "@/lib/project-roadmap";
import { getDraftDeliverySnapshot, syncWorkbenchDraftSessions } from "@/lib/store";

function priorityRank(value: string) {
  return value === "critical" ? 3 : value === "high" ? 2 : 1;
}

function summarizeBlockers(item: {
  releaseChain: Array<{ layer: string; status: "done" | "review" | "pending" | "skip"; detail: string }>;
  freezeChecklist: Array<{ title: string; status: "done" | "review" | "pending"; detail: string }>;
  applyChecklist: Array<{ title: string; status: "done" | "review" | "pending"; detail: string }>;
}) {
  const blockers = [
    ...item.releaseChain
      .filter((entry) => entry.status === "review" || entry.status === "pending")
      .map((entry) => ({
        kind: entry.status === "review" ? "review" as const : "pending" as const,
        title: entry.layer,
        detail: entry.detail,
      })),
    ...item.freezeChecklist
      .filter((entry) => entry.status !== "done")
      .map((entry) => ({
        kind: entry.status,
        title: `Freeze · ${entry.title}`,
        detail: entry.detail,
      })),
    ...item.applyChecklist
      .filter((entry) => entry.status !== "done")
      .map((entry) => ({
        kind: entry.status,
        title: `Apply · ${entry.title}`,
        detail: entry.detail,
      })),
  ];

  return blockers.slice(0, 5);
}

function buildHandoffChain(item: {
  recommendedOwner: string;
  supportOwners: string[];
  recommendedRouteOrder: Array<{ route: string; title: string; reason: string }>;
}) {
  const leadRoute = item.recommendedRouteOrder[0];
  const handoff = [
    {
      stage: "owner lead",
      owner: item.recommendedOwner,
      route: leadRoute?.route ?? "/lab/delivery",
      title: leadRoute?.title ?? getLabRouteMeta("/lab/delivery")?.title ?? "/lab/delivery",
      reason: leadRoute ? `先从 ${leadRoute.title} 开始，${leadRoute.reason}` : "当前没有显式 route order，先在交付调度台确认首个动作。",
    },
    ...item.supportOwners.map((owner, index) => {
      const fallbackRoute = item.recommendedRouteOrder[Math.min(index + 1, Math.max(item.recommendedRouteOrder.length - 1, 0))];
      return {
        stage: `support ${index + 1}`,
        owner,
        route: fallbackRoute?.route ?? "/lab/release-chain",
        title: fallbackRoute?.title ?? getLabRouteMeta("/lab/release-chain")?.title ?? "/lab/release-chain",
        reason: fallbackRoute ? `配合 ${fallbackRoute.title} 的验证与回跳。` : "在统一发布链路台继续承接跨层动作。",
      };
    }),
  ];

  return handoff;
}

export async function getReleaseChainSnapshot() {
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  await syncWorkbenchDraftSessions(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  const delivery = await getDraftDeliverySnapshot();
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);
  const actionableDrafts = [...delivery.buckets.freezeCandidate, ...delivery.buckets.applyQueue];

  const ownerLoadMap = new Map<string, {
    owner: string;
    primaryCount: number;
    supportCount: number;
    criticalCount: number;
    draftIds: string[];
    nextActions: string[];
  }>();

  for (const item of actionableDrafts) {
    const primaryOwner = item.recommendedOwner;
    const primaryEntry = ownerLoadMap.get(primaryOwner) ?? {
      owner: primaryOwner,
      primaryCount: 0,
      supportCount: 0,
      criticalCount: 0,
      draftIds: [],
      nextActions: [],
    };
    primaryEntry.primaryCount += 1;
    if (item.workflow.reviewPriority === "critical") primaryEntry.criticalCount += 1;
    primaryEntry.draftIds = Array.from(new Set([...primaryEntry.draftIds, item.draft.draftId]));
    primaryEntry.nextActions = Array.from(new Set([...primaryEntry.nextActions, item.nextBestAction]));
    ownerLoadMap.set(primaryOwner, primaryEntry);

    for (const supportOwner of item.supportOwners) {
      const supportEntry = ownerLoadMap.get(supportOwner) ?? {
        owner: supportOwner,
        primaryCount: 0,
        supportCount: 0,
        criticalCount: 0,
        draftIds: [],
        nextActions: [],
      };
      supportEntry.supportCount += 1;
      supportEntry.draftIds = Array.from(new Set([...supportEntry.draftIds, item.draft.draftId]));
      supportEntry.nextActions = Array.from(new Set([...supportEntry.nextActions, item.nextBestAction]));
      ownerLoadMap.set(supportOwner, supportEntry);
    }
  }

  const ownerLoad = Array.from(ownerLoadMap.values()).sort((left, right) => {
    if (right.primaryCount !== left.primaryCount) return right.primaryCount - left.primaryCount;
    if (right.criticalCount !== left.criticalCount) return right.criticalCount - left.criticalCount;
    return right.supportCount - left.supportCount;
  });

  const routePriorityMap = new Map<string, {
    route: string;
    title: string;
    priorityMentions: number;
    criticalMentions: number;
    owners: string[];
    reasons: string[];
    draftIds: string[];
  }>();

  for (const item of actionableDrafts) {
    item.recommendedRouteOrder.forEach((entry, index) => {
      const current = routePriorityMap.get(entry.route) ?? {
        route: entry.route,
        title: entry.title,
        priorityMentions: 0,
        criticalMentions: 0,
        owners: [],
        reasons: [],
        draftIds: [],
      };
      current.priorityMentions += index === 0 ? 2 : 1;
      if (item.workflow.reviewPriority === "critical") current.criticalMentions += 1;
      current.owners = Array.from(new Set([...current.owners, item.recommendedOwner]));
      current.reasons = Array.from(new Set([...current.reasons, entry.reason]));
      current.draftIds = Array.from(new Set([...current.draftIds, item.draft.draftId]));
      routePriorityMap.set(entry.route, current);
    });
  }

  const routePriority = Array.from(routePriorityMap.values()).sort((left, right) => {
    if (right.priorityMentions !== left.priorityMentions) return right.priorityMentions - left.priorityMentions;
    if (right.criticalMentions !== left.criticalMentions) return right.criticalMentions - left.criticalMentions;
    return right.draftIds.length - left.draftIds.length;
  });

  const unifiedLanes = actionableDrafts
    .map((item) => {
      const schemaLedger = migrationLedger.find((entry) => entry.draftId === item.draft.draftId) ?? null;
      const schemaSignals = schemaLedger
        ? [
            schemaLedger.migrationCounts.questionMoves,
            schemaLedger.migrationCounts.phaseMoves,
            schemaLedger.migrationCounts.answerTypeChanges,
            schemaLedger.migrationCounts.presentationChanges,
            schemaLedger.migrationCounts.nativeContractChanges,
          ].reduce((sum, value) => sum + value, 0)
        : 0;
      const analysisSignals = schemaLedger?.linkedAnalysisDrafts ?? analysisWorkbench.impactMatrix.filter((entry) => entry.draftId === item.draft.draftId);
      const blockers = summarizeBlockers(item);
      const handoffChain = buildHandoffChain(item);
      const releaseStep = item.releaseChain.find((entry) => entry.key === "release");
      const primaryRoute = item.recommendedRouteOrder[0] ?? null;

      return {
        draftId: item.draft.draftId,
        title: item.draft.title,
        summary: item.draft.summary,
        kind: item.draft.kind,
        sourceKey: item.draft.sourceKey,
        deliveryStatus: item.workflow.deliveryStatus,
        reviewPriority: item.workflow.reviewPriority,
        readinessScore: item.workflow.readinessScore,
        recommendedOwner: item.recommendedOwner,
        supportOwners: item.supportOwners,
        nextBestAction: item.nextBestAction,
        targetFiles: item.draft.targetFiles,
        linkedRoutes: item.draft.linkedRoutes,
        recommendedRouteOrder: item.recommendedRouteOrder,
        impactAreas: item.simulation?.impactAreas ?? [],
        releaseChain: item.releaseChain,
        freezeChecklist: item.freezeChecklist,
        applyChecklist: item.applyChecklist,
        schemaLedger,
        schemaSignals,
        analysisSignals,
        blockers,
        blockerCount: blockers.length,
        handoffChain,
        primaryRoute,
        releaseStatus: releaseStep?.status ?? "pending",
      };
    })
    .sort((left, right) => {
      if (priorityRank(right.reviewPriority) !== priorityRank(left.reviewPriority)) {
        return priorityRank(right.reviewPriority) - priorityRank(left.reviewPriority);
      }
      if (right.blockerCount !== left.blockerCount) return right.blockerCount - left.blockerCount;
      if (right.schemaSignals !== left.schemaSignals) return right.schemaSignals - left.schemaSignals;
      return right.readinessScore - left.readinessScore;
    });

  const handoffSummary = unifiedLanes.map((lane) => ({
    draftId: lane.draftId,
    title: lane.title,
    leadOwner: lane.recommendedOwner,
    supportOwners: lane.supportOwners,
    primaryRoute: lane.primaryRoute?.title ?? "-",
    blockerCount: lane.blockerCount,
    nextBestAction: lane.nextBestAction,
  }));

  const crossLayerLinks = [
    {
      key: "content-schema",
      title: "Content → Schema",
      count: migrationLedger.length,
      detail: "题库版本迁移会先进入 schema ledger，再向 route review 和 freeze gate 扩散。",
    },
    {
      key: "schema-native",
      title: "Schema → Native",
      count: migrationLedger.reduce((sum, item) => sum + item.migrationCounts.nativeContractChanges, 0),
      detail: "native blueprint contract 漂移会直接进入 handoff 与 screen sequence 校验。",
    },
    {
      key: "schema-analysis",
      title: "Schema → Analysis",
      count: migrationLedger.reduce((sum, item) => sum + item.linkedAnalysisDrafts.length, 0),
      detail: "question/phase 迁移会牵动 prompt、schema 与运行预设的解释链路。",
    },
    {
      key: "analysis-delivery",
      title: "Analysis → Delivery",
      count: delivery.nextActions.length,
      detail: "调度动作池现在基于 freeze/apply checklist 生成 next best action。",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      actionableDrafts: actionableDrafts.length,
      totalDrafts: delivery.summary.totalDrafts,
      contentDrafts: contentWorkbench.draftBlueprints.length,
      analysisDrafts: analysisWorkbench.impactMatrix.length,
      schemaMigrations: migrationLedger.length,
      ownerGroups: ownerLoad.length,
      routeLanes: routePriority.length,
      criticalDrafts: actionableDrafts.filter((item) => item.workflow.reviewPriority === "critical").length,
      totalBlockers: unifiedLanes.reduce((sum, lane) => sum + lane.blockerCount, 0),
    },
    ownerLoad,
    routePriority,
    unifiedLanes,
    handoffSummary,
    crossLayerLinks,
    routeMeta: ["/lab/content", "/lab/schema", "/lab/native-handoff", "/lab/kernel", "/lab/delivery", "/lab/release-chain"].map((route) => ({
      route,
      title: getLabRouteMeta(route)?.title ?? route,
    })),
    roadmap: {
      currentFocus: projectRoadmapBoard.currentFocus,
      currentObjective: projectRoadmapBoard.currentObjective,
      nextObjective: projectRoadmapBoard.nextObjective,
    },
    delivery,
    migrationLedger,
  };
}
