import {
  buildAssessmentContentWorkbench,
  buildAssessmentSchemaMigrationLedger,
  listAssessmentDefinitionSnapshots,
  listAssessmentVersions,
} from '@/features/assessment';
import {
  buildAnalysisWorkbenchCatalog,
  getAnalysisRuntimeStatus,
  listAnalysisPromptTemplates,
  listAnalysisReportSchemas,
} from '@/lib/analysis';
import { analystSteps, directorOutputs } from '@/lib/benyuan-framework';
import { readBenyuanIosRealDeviceAcceptance } from '@/lib/benyuan-ios-real-device';
import { ANALYST_SYSTEM_PROMPT, DIRECTOR_SYSTEM_PROMPT } from '@/lib/benyuan-v3-prompts';
import { readCodexProviderDefaults } from '@/lib/codex-runtime';
import { getDraftDeliverySnapshot, listDraftSessionsForRoute, listSessionRuntimeSummaries } from '@/lib/store';
import { loadTradeWiseResearchFeed } from '@/lib/tradewise/research-provider';

import { getProjectSpaceManifest } from './project-manifests';
import type {
  WorkspaceSectionLink,
  WorkspaceSectionPanel,
  WorkspaceSectionRecord,
  WorkspaceSectionResponse,
} from './types';

const REVIEW_SCORE_KEYS = ['emotion', 'logic', 'discipline', 'industryInsight', 'timing', 'riskManagement'] as const;

function record(title: string, detail: string, meta?: string, href?: string): WorkspaceSectionRecord {
  return { title, detail, meta, href };
}

function panel(id: string, title: string, records: WorkspaceSectionRecord[], summary?: string): WorkspaceSectionPanel {
  return { id, title, records, summary };
}

function link(
  label: string,
  href: string,
  description: string,
  kind: WorkspaceSectionLink['kind'] = 'workspace',
): WorkspaceSectionLink {
  return { label, href, description, kind };
}

function fallbackRecords(title: string, detail: string, meta?: string) {
  return [record(title, detail, meta)];
}

function trimPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  return normalized.length > 220 ? `${normalized.slice(0, 220)}...` : normalized;
}

function manifestCompatibility(spaceId: string) {
  const manifest = getProjectSpaceManifest(spaceId);
  if (!manifest) return [];
  return manifest.workbenches
    .filter((workbench) => Boolean(workbench.compatibilityHref))
    .map((workbench) => link(workbench.title, workbench.compatibilityHref as string, workbench.detail, 'compatibility'));
}

function overviewPanels(spaceId: string): WorkspaceSectionPanel[] {
  const manifest = getProjectSpaceManifest(spaceId);
  if (!manifest) return [];

  return [
    panel(
      'sections',
      'Workspace sections',
      manifest.workbenches.map((workbench) =>
        record(workbench.title, workbench.detail, `${workbench.sectionId} · ${workbench.status}`, workbench.href),
      ),
      '新工作区入口优先，旧入口只保留 compatibility 角色。',
    ),
    panel(
      'boundaries',
      'Boundaries',
      manifest.boundaries.slice(0, 6).map((boundary) => record(boundary.title, boundary.detail, `${boundary.owner} · ${boundary.type}`)),
      '平台层与项目层边界直接来自 manifest。',
    ),
    panel(
      'milestones',
      'Next milestones',
      manifest.nextMilestones.map((milestone, index) => record(`Milestone ${index + 1}`, milestone)),
    ),
  ];
}

function response(data: WorkspaceSectionResponse): WorkspaceSectionResponse {
  return data;
}

function resolveTradeWiseReviewProvider() {
  const rawProvider = (process.env.TRADEWISE_REVIEW_PROVIDER ?? 'mock').toLowerCase();
  if (rawProvider === 'anthropic') return 'anthropic';
  if (['crs', 'openai', 'responses', 'custom'].includes(rawProvider)) return 'crs';
  return 'mock';
}

function resolveTradeWiseResearchProvider() {
  return (process.env.TRADEWISE_RESEARCH_PROVIDER ?? 'fixture').toLowerCase() === 'remote' ? 'remote' : 'fixture';
}

async function buildCodexOverviewSection() {
  return response({
    spaceId: 'codex',
    sectionId: 'overview',
    title: 'Codex Platform Overview',
    summary: '平台 overview 继续负责 session、agent、tool、permission、memory、plugin、MCP 与 companion runtime。',
    panels: overviewPanels('codex'),
    links: [link('Shadow shell', '/codex', '稳定影子入口。', 'legacy')],
    compatibility: manifestCompatibility('codex'),
  });
}

async function buildEmbryoOverviewSection() {
  return response({
    spaceId: 'embryo',
    sectionId: 'overview',
    title: 'Embryo Workspace Stub',
    summary: 'Embryo 保持为未来项目模板，只展示 manifest、边界和下一阶段里程碑。',
    panels: overviewPanels('embryo'),
    links: [],
    compatibility: manifestCompatibility('embryo'),
  });
}

async function buildBenyuanOverviewSection() {
  const [runtimeSessions, deliverySnapshot] = await Promise.all([listSessionRuntimeSummaries(4), getDraftDeliverySnapshot()]);

  return response({
    spaceId: 'benyuan',
    sectionId: 'overview',
    title: 'Benyuan Workspace',
    summary: '以平台视角聚合 Benyuan 的 schema、runtime、agents、native 与 delivery 页面，并保留主产品链路回跳。',
    panels: [
      panel('posture', 'Current posture', [
        record('Runtime sessions', `${runtimeSessions.length} recent sessions`, runtimeSessions[0]?.currentStageKey ?? 'No recent stage snapshot yet.'),
        record(
          'Delivery buckets',
          `${deliverySnapshot.buckets.freezeCandidate.length} freeze / ${deliverySnapshot.buckets.applyQueue.length} apply`,
          `${deliverySnapshot.buckets.archived.length} archived`,
        ),
        record('Main compatibility route', '/collect', 'collect -> processing -> theater -> constellation'),
      ]),
      ...overviewPanels('benyuan'),
    ],
    links: [
      link('Main flow', '/collect', '继续 Benyuan 主链路。', 'legacy'),
      link('Processing shell', '/processing/benyuan', '兼容处理中转页。', 'legacy'),
      link('Theater', '/theater', '兼容剧场体验。', 'legacy'),
      link('Constellation', '/constellation', '兼容星图呈现。', 'legacy'),
    ],
    compatibility: manifestCompatibility('benyuan'),
  });
}

async function buildBenyuanSchemaSection() {
  const snapshots = listAssessmentDefinitionSnapshots();
  const modes = [...new Set(snapshots.map((snapshot) => snapshot.mode))];
  const contentWorkbench = buildAssessmentContentWorkbench();
  const analysisWorkbench = buildAnalysisWorkbenchCatalog(contentWorkbench.draftBlueprints);
  const migrationLedger = buildAssessmentSchemaMigrationLedger(contentWorkbench.draftBlueprints, analysisWorkbench.impactMatrix);

  return response({
    spaceId: 'benyuan',
    sectionId: 'schema',
    title: 'Benyuan Schema',
    summary: '直接复用 assessment/schema/native 事实来源，把版本矩阵和迁移 ledger 放进统一 workspace section。',
    panels: [
      panel('summary', 'Schema matrix', [
        record('Definition snapshots', `${snapshots.length} snapshots`, `${modes.length} modes`),
        record('Draft blueprints', `${contentWorkbench.draftBlueprints.length} content drafts`, `${analysisWorkbench.impactMatrix.length} analysis impacts`),
        record('Migration ledger', `${migrationLedger.length} rows`, migrationLedger[0]?.draftId ?? 'No migration rows yet.'),
      ]),
      panel(
        'versions',
        'Versions by mode',
        modes.flatMap((mode) =>
          listAssessmentVersions(mode)
            .slice(0, 3)
            .map((versionInfo) =>
              record(`${mode} · ${versionInfo.version}`, versionInfo.title, versionInfo.isDefault ? 'default version' : versionInfo.description),
            ),
        ),
      ),
    ],
    links: [
      link('Schema matrix API', '/api/internal/schema-matrix', '旧 schema 矩阵接口。', 'api'),
      link('Native handoff API', '/api/internal/native-handoff', '旧 native contract 接口。', 'api'),
    ],
    compatibility: [
      link('Legacy schema panel', '/lab/schema', '旧题库结构面板。', 'compatibility'),
      link('Legacy content panel', '/lab/content', '旧内容预览台。', 'compatibility'),
    ],
  });
}

async function buildBenyuanRuntimeSection() {
  const [runtimeSessions, runtimeDrafts] = await Promise.all([
    listSessionRuntimeSummaries(6),
    listDraftSessionsForRoute('/lab/runtime'),
  ]);
  const liteRuntime = getAnalysisRuntimeStatus('lite');
  const deepRuntime = getAnalysisRuntimeStatus('deep');

  return response({
    spaceId: 'benyuan',
    sectionId: 'runtime',
    title: 'Benyuan Runtime',
    summary: '把 analysis runtime、fallback 状态和最近 session 快照接进 workspace。',
    panels: [
      panel('presets', 'Runtime presets', [
        record('lite runtime', `${liteRuntime.engineLabel} / ${liteRuntime.providerId}`, `${liteRuntime.effectiveRuntime} · fallback ${liteRuntime.fallbackActive ? 'on' : 'off'}`),
        record('deep runtime', `${deepRuntime.engineLabel} / ${deepRuntime.providerId}`, `${deepRuntime.effectiveRuntime} · fallback ${deepRuntime.fallbackActive ? 'on' : 'off'}`),
        record('Prompt + report variants', `${listAnalysisPromptTemplates().length} prompts / ${listAnalysisReportSchemas().length} schemas`, '来自现有 analysis 内核模块'),
      ]),
      panel(
        'sessions',
        'Recent sessions',
        runtimeSessions.length
          ? runtimeSessions.map((session) => record(session.sessionId, `${session.mode} · ${session.lifecycleStatus}`, session.currentStageKey ?? session.latestJobStatus ?? 'idle'))
          : fallbackRecords('No recent sessions', '当前 store 里还没有分析 runtime session。', '可以先跑一轮 `/test -> /processing -> /report`。'),
      ),
      panel(
        'drafts',
        'Runtime-linked drafts',
        runtimeDrafts.length
          ? runtimeDrafts.slice(0, 5).map((item) => record(item.draft.title, item.workflow.nextAction, `${item.workflow.deliveryStatus} · ${item.workflow.reviewPriority}`))
          : fallbackRecords('No linked drafts', '当前还没有挂到 `/lab/runtime` 的 draft workflow。'),
      ),
    ],
    links: [
      link('Analysis runtime API', '/api/analysis/runtime', '旧 runtime 预览接口。', 'api'),
      link('Kernel workbench API', '/api/internal/kernel-workbench', '现有 runtime/kernel 聚合事实来源。', 'api'),
    ],
    compatibility: [
      link('Legacy runtime panel', '/lab/runtime', '旧 Runtime 面板。', 'compatibility'),
      link('Legacy kernel', '/lab/kernel', '旧 kernel 工作台。', 'compatibility'),
    ],
  });
}

async function buildBenyuanAgentsSection() {
  return response({
    spaceId: 'benyuan',
    sectionId: 'agents',
    title: 'Benyuan Agents',
    summary: '把 director / analyst 的 prompt、输出结构和兼容 agent 页面收拢到平台化工作区。',
    panels: [
      panel('director', 'Director agent', [
        record('System prompt excerpt', trimPrompt(DIRECTOR_SYSTEM_PROMPT), 'source: benyuan-v3-prompts.ts'),
        ...directorOutputs.map((output, index) => record(`Output ${index + 1}`, output)),
      ]),
      panel('analyst', 'Analyst agent', [
        record('System prompt excerpt', trimPrompt(ANALYST_SYSTEM_PROMPT), 'source: benyuan-v3-prompts.ts'),
        ...analystSteps.map((step) => record(step, '仍复用当前 Benyuan 项目侧分析步骤定义。')),
      ]),
    ],
    links: [
      link('Director agent page', '/agent/director', '旧导演 agent 页。', 'legacy'),
      link('Analyst agent page', '/agent/analyst', '旧分析师 agent 页。', 'legacy'),
    ],
    compatibility: [
      link('Director compatibility page', '/agent/director', '旧导演 agent 页。', 'compatibility'),
      link('Analyst compatibility page', '/agent/analyst', '旧分析师 agent 页。', 'compatibility'),
    ],
  });
}

async function buildBenyuanNativeSection() {
  const acceptance = await readBenyuanIosRealDeviceAcceptance();

  return response({
    spaceId: 'benyuan',
    sectionId: 'native',
    title: 'Benyuan Native Handoff',
    summary: '继续复用 native handoff、real-device 验收与 shell 迁移事实来源，但统一进入 workspace section。',
    panels: [
      panel(
        'acceptance',
        'Real-device acceptance',
        acceptance
          ? [
              record('Checklist progress', `${acceptance.completedChecks}/${acceptance.totalChecks} completed`, acceptance.ready ? 'ready for pilot handoff' : `${acceptance.pendingChecks} checks pending`),
              ...acceptance.pendingItems.slice(0, 4).map((item) => record(item.label, item.target, item.route)),
            ]
          : fallbackRecords('No acceptance board', '当前没有读到 iOS 真机验收板。', '检查 `docs/benyuan-ios-camera-acceptance-board.md`。'),
      ),
      panel('facts', 'Native fact sources', [
        record('Native handoff API', '继续复用 native blueprint / migration ledger 接口。', '/api/internal/native-handoff', '/api/internal/native-handoff'),
        record('Smoke routes', '相机 / 相册 smoke 仍保留旧入口。', '/lab/native-handoff/smoke?autorun=1', '/lab/native-handoff/smoke?autorun=1'),
      ]),
    ],
    links: [
      link('Native handoff API', '/api/internal/native-handoff', '原生交接事实来源。', 'api'),
      link('Acceptance board', '/lab/native-handoff', '旧原生交接页。', 'legacy'),
    ],
    compatibility: [link('Legacy native handoff', '/lab/native-handoff', '旧原生交接面板。', 'compatibility')],
  });
}

async function buildBenyuanDeliverySection() {
  const deliverySnapshot = await getDraftDeliverySnapshot();

  return response({
    spaceId: 'benyuan',
    sectionId: 'delivery',
    title: 'Benyuan Delivery',
    summary: '直接复用 draft workflow 与统一 delivery lane 的只读事实来源，在 workspace 内展示 release/golden/rollback 节奏。',
    panels: [
      panel('buckets', 'Delivery buckets', [
        record('Freeze candidate', `${deliverySnapshot.buckets.freezeCandidate.length} drafts`, 'pre-apply checks still pending'),
        record('Apply queue', `${deliverySnapshot.buckets.applyQueue.length} drafts`, 'ready for apply window'),
        record('Archived', `${deliverySnapshot.buckets.archived.length} drafts`, 'kept for rollback and audit'),
      ]),
      panel(
        'route-load',
        'Route load',
        deliverySnapshot.routeLoad.length
          ? deliverySnapshot.routeLoad.slice(0, 5).map((route) => record(route.title, `${route.linkedDrafts} linked drafts`, `${route.freezeCandidateCount} freeze · ${route.applyQueueCount} apply · readiness ${route.averageReadiness}`))
          : fallbackRecords('No route load yet', '当前还没有 route load 数据。'),
      ),
      panel(
        'next-actions',
        'Action pool',
        deliverySnapshot.nextActions.length
          ? deliverySnapshot.nextActions
              .slice(0, 6)
              .map((action) => record(action.action, `${action.count} drafts`, `${action.freezeCandidateCount} freeze · ${action.applyQueueCount} apply`))
          : fallbackRecords('No queued next action', '当前还没有 next action 进入队列。'),
      ),
    ],
    links: [
      link('Release chain API', '/api/internal/release-chain', '统一发布链路快照。', 'api'),
      link('Golden panel', '/lab/golden', '旧 golden 面板。', 'legacy'),
    ],
    compatibility: [
      link('Legacy release chain', '/lab/release-chain', '旧发布链路台。', 'compatibility'),
      link('Legacy delivery lane', '/lab/delivery', '旧交付调度台。', 'compatibility'),
      link('Legacy golden', '/lab/golden', '旧 golden 面板。', 'compatibility'),
    ],
  });
}

async function buildTradeWiseOverviewSection() {
  const reviewProvider = resolveTradeWiseReviewProvider();
  const researchProvider = resolveTradeWiseResearchProvider();
  const deliverySnapshot = await getDraftDeliverySnapshot();

  return response({
    spaceId: 'tradewise',
    sectionId: 'overview',
    title: 'TradeWise Workspace',
    summary: '先把 review、research、handoff、delivery 的事实来源收编成平台 workspace，再逐步补齐独立产品页。',
    panels: [
      panel('posture', 'Current posture', [
        record('Review provider', reviewProvider, 'daily review contract'),
        record('Research provider', researchProvider, 'market feed source'),
        record('Shared delivery lane', `${deliverySnapshot.buckets.applyQueue.length} queued drafts`, 'TradeWise 暂时复用统一 delivery spine'),
      ]),
      ...overviewPanels('tradewise'),
    ],
    links: [
      link('Review API', '/api/tradewise/review/generate', 'TradeWise review generation route.', 'api'),
      link('Research feed API', '/api/tradewise/research/feed', 'TradeWise research feed route.', 'api'),
    ],
    compatibility: [
      link('Legacy native handoff', '/lab/native-handoff', '现阶段继续复用共用 handoff 页面。', 'compatibility'),
      link('Legacy release chain', '/lab/release-chain', '现阶段继续复用共用 delivery 页面。', 'compatibility'),
    ],
  });
}

async function buildTradeWiseReviewSection() {
  const provider = resolveTradeWiseReviewProvider();
  const codexDefaults = readCodexProviderDefaults();
  const model =
    provider === 'anthropic'
      ? process.env.TRADEWISE_ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'
      : codexDefaults.model ?? 'gpt-5.4';
  const status =
    provider === 'mock'
      ? 'fixture mode'
      : provider === 'anthropic'
        ? process.env.ANTHROPIC_API_KEY
          ? 'ready'
          : 'missing_api_key'
        : codexDefaults.apiKey
          ? 'ready'
          : 'fallback_to_mock';
  const baseUrl = provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : codexDefaults.baseUrl ?? 'https://api.openai.com/v1';

  return response({
    spaceId: 'tradewise',
    sectionId: 'review',
    title: 'TradeWise Review',
    summary: '复盘 section 保持围绕现有 review contract、provider 状态和 generate API，不在本阶段重写底层 provider 逻辑。',
    panels: [
      panel('provider', 'Provider status', [
        record('Provider', provider, status),
        record('Model', model, baseUrl),
        record('Wire API', codexDefaults.wireApi ?? 'responses', provider === 'crs' ? 'Codex runtime defaults' : 'provider-owned transport'),
      ]),
      panel('contract', 'Review contract', [
        record('Required request fields', 'reviewDate / trades / userProfile / watchSectors / recentReviews', 'source: tradewise/review-contract.ts'),
        record('Scoring dimensions', REVIEW_SCORE_KEYS.join(' / '), 'six scoring axes remain project-owned'),
        record('Response contract', 'summary / scores / tradingPattern / strengthSectors / profitMetrics / tomorrowPlan', 'generatorVersion stays in payload'),
      ]),
      panel('routes', 'Runtime entrypoints', [
        record('Generate route', 'POST /api/tradewise/review/generate', 'returns validated review payload', '/api/tradewise/review/generate'),
        record('Workspace lane', 'workspace/tradewise/review', 'new platform-first review shell'),
      ]),
    ],
    links: [link('Generate review API', '/api/tradewise/review/generate', 'TradeWise review route.', 'api')],
    compatibility: [link('Review API compatibility route', '/api/tradewise/review/generate', '旧合同入口继续保留。', 'compatibility')],
  });
}

async function buildTradeWiseResearchSection() {
  const provider = resolveTradeWiseResearchProvider();
  const feed = await loadTradeWiseResearchFeed({ limit: 4 }).catch(() => null);
  const status = provider === 'remote' ? (process.env.TRADEWISE_RESEARCH_REMOTE_URL ? 'ready' : 'missing_remote_url') : 'fixture mode';

  return response({
    spaceId: 'tradewise',
    sectionId: 'research',
    title: 'TradeWise Research',
    summary: '直接消费现有 research contract 与 feed provider，把 mock/live 区分显式落到 workspace。',
    panels: [
      panel('provider', 'Feed provider', [
        record('Provider', provider, status),
        record('Feed version', feed?.version ?? 'unavailable', `${feed?.items.length ?? 0} items loaded`),
      ]),
      panel(
        'items',
        'Latest feed items',
        feed?.items.length
          ? feed.items.map((item) => record(item.title, item.summary, `${item.market} · ${item.sector} · ${item.source}`))
          : fallbackRecords('No feed items', '当前没有加载到 research feed。', '检查 provider 配置或 fixture。'),
      ),
    ],
    links: [link('Research feed API', '/api/tradewise/research/feed', 'TradeWise research route.', 'api')],
    compatibility: [link('Research feed compatibility route', '/api/tradewise/research/feed', '旧 research feed 合同入口。', 'compatibility')],
  });
}

async function buildTradeWiseHandoffSection() {
  const acceptance = await readBenyuanIosRealDeviceAcceptance();

  return response({
    spaceId: 'tradewise',
    sectionId: 'handoff',
    title: 'TradeWise Handoff',
    summary: 'TradeWise 目前先复用 shared native handoff 事实来源，把移动交付与原生校验明确标成兼容策略。',
    panels: [
      panel('shared', 'Shared handoff lane', [
        record('Compatibility strategy', 'TradeWise handoff 继续复用 `/lab/native-handoff` 和 shared iOS acceptance board。', 'phase-2 compatibility boundary'),
        record('Acceptance board', acceptance ? `${acceptance.completedChecks}/${acceptance.totalChecks} checks completed` : 'No acceptance board available', acceptance?.latestCompletedItem?.label ?? 'shared handoff facts only'),
      ]),
    ],
    links: [link('Legacy native handoff', '/lab/native-handoff', 'shared native handoff page', 'legacy')],
    compatibility: [link('Shared native handoff', '/lab/native-handoff', 'TradeWise handoff 先复用这一兼容入口。', 'compatibility')],
  });
}

async function buildTradeWiseDeliverySection() {
  const deliverySnapshot = await getDraftDeliverySnapshot();

  return response({
    spaceId: 'tradewise',
    sectionId: 'delivery',
    title: 'TradeWise Delivery',
    summary: 'TradeWise 先挂到统一 delivery spine，页面只读展示 release/delivery lane，不拆底层存储。',
    panels: [
      panel('buckets', 'Shared delivery lane', [
        record('Freeze candidate', `${deliverySnapshot.buckets.freezeCandidate.length} drafts`, 'shared platform delivery spine'),
        record('Apply queue', `${deliverySnapshot.buckets.applyQueue.length} drafts`, 'shared platform delivery spine'),
        record('Archived', `${deliverySnapshot.buckets.archived.length} drafts`, 'shared platform delivery spine'),
      ]),
      panel(
        'next',
        'Next actions',
        deliverySnapshot.nextActions.length
          ? deliverySnapshot.nextActions
              .slice(0, 5)
              .map((action) => record(action.action, `${action.count} drafts`, `${action.freezeCandidateCount} freeze · ${action.applyQueueCount} apply`))
          : fallbackRecords('No queued action', '当前还没有 TradeWise 共享 delivery action。'),
      ),
    ],
    links: [link('Release chain API', '/api/internal/release-chain', '共享 release chain route', 'api')],
    compatibility: [
      link('Shared release chain', '/lab/release-chain', 'TradeWise 暂时复用 shared release chain。', 'compatibility'),
      link('Shared delivery lane', '/lab/delivery', 'TradeWise 暂时复用 shared delivery lane。', 'compatibility'),
    ],
  });
}

export async function getWorkspaceSectionResponse(spaceId: string, sectionId: string) {
  const manifest = getProjectSpaceManifest(spaceId);
  if (!manifest) return null;

  const availableSectionIds = new Set(manifest.workbenches.map((workbench) => workbench.sectionId));
  if (!availableSectionIds.has(sectionId as WorkspaceSectionResponse['sectionId'])) {
    return null;
  }

  if (spaceId === 'codex' && sectionId === 'overview') return buildCodexOverviewSection();
  if (spaceId === 'embryo' && sectionId === 'overview') return buildEmbryoOverviewSection();

  if (spaceId === 'benyuan') {
    if (sectionId === 'overview') return buildBenyuanOverviewSection();
    if (sectionId === 'schema') return buildBenyuanSchemaSection();
    if (sectionId === 'runtime') return buildBenyuanRuntimeSection();
    if (sectionId === 'agents') return buildBenyuanAgentsSection();
    if (sectionId === 'native') return buildBenyuanNativeSection();
    if (sectionId === 'delivery') return buildBenyuanDeliverySection();
  }

  if (spaceId === 'tradewise') {
    if (sectionId === 'overview') return buildTradeWiseOverviewSection();
    if (sectionId === 'review') return buildTradeWiseReviewSection();
    if (sectionId === 'research') return buildTradeWiseResearchSection();
    if (sectionId === 'handoff') return buildTradeWiseHandoffSection();
    if (sectionId === 'delivery') return buildTradeWiseDeliverySection();
  }

  return null;
}
