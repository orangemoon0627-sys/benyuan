import type { ProjectBoundary, ProjectSpaceManifest, ProjectWorkbench, WorkspaceSectionId } from './types';

function createWorkbench(config: {
  id: string;
  title: string;
  href: string;
  detail: string;
  capability: string;
  kind: ProjectWorkbench['kind'];
  sectionId: WorkspaceSectionId;
  compatibilityHref?: string;
  status: ProjectWorkbench['status'];
}): ProjectWorkbench {
  return {
    id: config.id,
    title: config.title,
    href: config.href,
    detail: config.detail,
    capability: config.capability,
    kind: config.kind,
    sectionId: config.sectionId,
    compatibilityHref: config.compatibilityHref,
    status: config.status,
  };
}

function codexWorkbenches(): ProjectWorkbench[] {
  return [
    createWorkbench({
      id: 'codex.workspace.overview',
      title: 'Codex Overview',
      href: '/workspace/codex',
      detail: '平台 overview 继续聚合 session、agent、tool、permission、memory 与 companion 状态。',
      capability: 'platform-shell',
      kind: 'board',
      sectionId: 'overview',
      compatibilityHref: '/codex',
      status: 'active',
    }),
  ];
}

function benyuanWorkbenches(): ProjectWorkbench[] {
  return [
    createWorkbench({
      id: 'benyuan.workspace.overview',
      title: 'Benyuan Workspace',
      href: '/workspace/benyuan',
      detail: '以平台视角聚合 Benyuan 主链路、项目边界、兼容入口与当前交付信号。',
      capability: 'workspace-overview',
      kind: 'board',
      sectionId: 'overview',
      compatibilityHref: '/collect',
      status: 'active',
    }),
    createWorkbench({
      id: 'benyuan.workspace.schema',
      title: 'Schema',
      href: '/workspace/benyuan/schema',
      detail: '统一查看 assessment、schema matrix、native contract 与版本迁移信号。',
      capability: 'schema-design',
      kind: 'schema',
      sectionId: 'schema',
      compatibilityHref: '/lab/schema',
      status: 'active',
    }),
    createWorkbench({
      id: 'benyuan.workspace.runtime',
      title: 'Runtime',
      href: '/workspace/benyuan/runtime',
      detail: '统一查看分析 runtime、最近 session、fallback 与 prompt/schema 组合。',
      capability: 'runtime-ops',
      kind: 'runtime',
      sectionId: 'runtime',
      compatibilityHref: '/lab/runtime',
      status: 'active',
    }),
    createWorkbench({
      id: 'benyuan.workspace.agents',
      title: 'Agents',
      href: '/workspace/benyuan/agents',
      detail: '把 director / analyst prompt、输出结构和兼容 agent 入口收拢到同一工作区。',
      capability: 'agent-ops',
      kind: 'agent',
      sectionId: 'agents',
      compatibilityHref: '/agent/director',
      status: 'active',
    }),
    createWorkbench({
      id: 'benyuan.workspace.native',
      title: 'Native',
      href: '/workspace/benyuan/native',
      detail: '汇总 native handoff、real-device 验收与当前 shell 迁移事实来源。',
      capability: 'native-handoff',
      kind: 'native',
      sectionId: 'native',
      compatibilityHref: '/lab/native-handoff',
      status: 'active',
    }),
    createWorkbench({
      id: 'benyuan.workspace.delivery',
      title: 'Delivery',
      href: '/workspace/benyuan/delivery',
      detail: '汇总 release chain、golden、draft workflow 与回退窗口。',
      capability: 'delivery-chain',
      kind: 'delivery',
      sectionId: 'delivery',
      compatibilityHref: '/lab/release-chain',
      status: 'active',
    }),
  ];
}

function tradewiseWorkbenches(): ProjectWorkbench[] {
  return [
    createWorkbench({
      id: 'tradewise.workspace.overview',
      title: 'TradeWise Workspace',
      href: '/workspace/tradewise',
      detail: '以平台视角查看 review、research、handoff 与 delivery lane 的当前状态。',
      capability: 'workspace-overview',
      kind: 'board',
      sectionId: 'overview',
      compatibilityHref: '/api/tradewise',
      status: 'active',
    }),
    createWorkbench({
      id: 'tradewise.workspace.review',
      title: 'Review',
      href: '/workspace/tradewise/review',
      detail: '查看复盘合同、provider 状态与 review generate API 入口。',
      capability: 'review-runtime',
      kind: 'runtime',
      sectionId: 'review',
      compatibilityHref: '/api/tradewise/review/generate',
      status: 'active',
    }),
    createWorkbench({
      id: 'tradewise.workspace.research',
      title: 'Research',
      href: '/workspace/tradewise/research',
      detail: '查看 research feed 合同、provider 模式与最新市场 feed。',
      capability: 'research-feed',
      kind: 'research',
      sectionId: 'research',
      compatibilityHref: '/api/tradewise/research/feed',
      status: 'active',
    }),
    createWorkbench({
      id: 'tradewise.workspace.handoff',
      title: 'Handoff',
      href: '/workspace/tradewise/handoff',
      detail: '复用当前 native handoff 与移动交付事实来源，作为项目专属 handoff 视图。',
      capability: 'mobile-handoff',
      kind: 'native',
      sectionId: 'handoff',
      compatibilityHref: '/lab/native-handoff',
      status: 'active',
    }),
    createWorkbench({
      id: 'tradewise.workspace.delivery',
      title: 'Delivery',
      href: '/workspace/tradewise/delivery',
      detail: '先挂统一 release / delivery lane，再逐步补齐 TradeWise 专属交付节奏。',
      capability: 'release-chain',
      kind: 'delivery',
      sectionId: 'delivery',
      compatibilityHref: '/lab/release-chain',
      status: 'active',
    }),
  ];
}

function embryoWorkbenches(): ProjectWorkbench[] {
  return [
    createWorkbench({
      id: 'embryo.workspace.overview',
      title: 'Embryo Workspace',
      href: '/workspace/embryo',
      detail: '保持为未来项目模板，展示 manifest、边界和下一阶段里程碑。',
      capability: 'incubation',
      kind: 'board',
      sectionId: 'overview',
      status: 'stub',
    }),
  ];
}

function platformBoundaries(): ProjectBoundary[] {
  return [
    {
      id: 'platform.session.core',
      title: 'Session / Agent / Tool Runtime',
      type: 'runtime',
      owner: 'platform',
      detail: '会话、agent、tool、权限、流式执行和 companion 通信全部归平台内核所有。',
      references: ['src/lib/codex-platform/runtime-service.ts', 'src/lib/codex-platform/local-store.ts'],
    },
    {
      id: 'platform.memory.core',
      title: 'Profile / Active / Project Memory',
      type: 'memory',
      owner: 'platform',
      detail: '全局 memory 与 skills 装载逻辑保持平台统一，项目只提供补充上下文。',
      references: ['src/lib/codex-platform/bootstrap.ts', 'AGENTS.md'],
    },
    {
      id: 'platform.delivery.chain',
      title: 'Unified Delivery / Release Chain',
      type: 'delivery',
      owner: 'platform',
      detail: 'release、delivery、golden、audit 等护栏先抽到平台能力，再由项目声明使用方式。',
      references: ['src/app/lab/release-chain/page.tsx', 'src/lib/release-chain.ts'],
    },
  ];
}

export function listProjectSpaceManifests(): ProjectSpaceManifest[] {
  return [
    {
      spaceId: 'codex',
      defaultSection: 'overview',
      narrative: 'Codex 平台本身负责 session、agent、tool、permission、memory、plugin、MCP 与 companion runtime 的统一内核。',
      workbenches: codexWorkbenches(),
      boundaries: platformBoundaries(),
      nextMilestones: [
        '让 companion 承担真实流式执行与审批闭环。',
        '把 Benyuan / TradeWise 的项目工作台拆成项目空间 manifest。',
        '逐步将根入口切到 Codex 主身份并保留回退入口。',
      ],
    },
    {
      spaceId: 'benyuan',
      defaultSection: 'overview',
      narrative: 'Benyuan 继续保留主产品链路，但其 schema、prompt、delivery、native handoff 必须逐步抽离到统一 project-space manifest。',
      workbenches: benyuanWorkbenches(),
      boundaries: [
        ...platformBoundaries(),
        {
          id: 'benyuan.assessment.schema',
          title: 'Assessment / Native Schema',
          type: 'schema',
          owner: 'project',
          detail: '题库结构、assessment contract、native blueprint 仍由 Benyuan 项目拥有。',
          references: ['src/features/assessment', 'src/lib/assessment-client-contract.ts'],
        },
        {
          id: 'benyuan.theater.prompt',
          title: 'Theater / Constellation Prompts',
          type: 'prompt',
          owner: 'project',
          detail: '导演与分析师 prompt、结构化输出 schema 归 Benyuan 项目线维护。',
          references: ['src/lib/benyuan-v3-prompts.ts', 'src/lib/benyuan-framework.ts'],
        },
        {
          id: 'benyuan.native.handoff',
          title: 'Native Handoff Artifacts',
          type: 'artifact',
          owner: 'project',
          detail: 'iOS shell、真实设备验收、handoff 文档仍由 Benyuan 项目拥有，但进入统一平台调度。',
          references: ['src/app/lab/native-handoff/page.tsx', 'src/lib/benyuan-status.ts'],
        },
      ],
      nextMilestones: [
        '把 /lab、/agent 页面逐步改造成真正的 workspace 内页。',
        '拆出 Benyuan 专属 schema / prompt / native 模块，不再混入平台代码。',
        '将 collect -> processing -> theater -> constellation 链路保持兼容后逐步平台化。',
      ],
    },
    {
      spaceId: 'tradewise',
      defaultSection: 'overview',
      narrative: 'TradeWise / Darwin 先通过合同、feed、release、mobile handoff 挂入平台，再逐步拥有自己的 workspace 页面与交付节奏。',
      workbenches: tradewiseWorkbenches(),
      boundaries: [
        ...platformBoundaries(),
        {
          id: 'tradewise.review.prompt',
          title: 'Review Generation Prompt / Contract',
          type: 'prompt',
          owner: 'project',
          detail: 'TradeWise 日复盘评分、总结与 tomorrow plan 合同保持项目专属。',
          references: ['src/lib/tradewise/review-contract.ts', 'src/lib/tradewise/review-provider.ts'],
        },
        {
          id: 'tradewise.research.schema',
          title: 'Research Feed Schema',
          type: 'schema',
          owner: 'project',
          detail: 'Research feed item 结构、market / sector 语义和源数据质量要求保持项目拥有。',
          references: ['src/lib/tradewise/research-contract.ts', 'src/lib/tradewise/research-provider.ts'],
        },
        {
          id: 'tradewise.mobile.delivery',
          title: 'Mobile Delivery Lane',
          type: 'delivery',
          owner: 'project',
          detail: 'TradeWise 的 mobile handoff、review runtime、研究 feed 发布节奏归项目拥有。',
          references: ['src/app/lab/native-handoff/page.tsx', 'src/app/lab/release-chain/page.tsx'],
        },
      ],
      nextMilestones: [
        '补出 TradeWise workspace 页面与 review / research / handoff 可视化面板。',
        '把 TradeWise 合同和 provider 组合接进统一 runtime / permission / delivery 内核。',
        '将移动交付链从共用 lab 面板升级为项目空间内工作台。',
      ],
    },
    {
      spaceId: 'embryo',
      defaultSection: 'overview',
      narrative: 'Embryo 作为未来项目空间预留位，必须一开始就按平台/项目边界接入，而不是再复制一套专用工作台。',
      workbenches: embryoWorkbenches(),
      boundaries: [
        ...platformBoundaries(),
        {
          id: 'embryo.future.schema',
          title: 'Future Schema / Prompt Ownership',
          type: 'schema',
          owner: 'project',
          detail: 'Embryo 的 schema、prompt、delivery 约束将在项目启动时按 manifest 接入。',
          references: ['/workspace/embryo'],
        },
      ],
      nextMilestones: [
        '新项目启动时直接注册 project manifest。',
        '避免再出现 Benyuan 式的术语硬编码和平台/项目耦合。',
      ],
    },
  ];
}

export function getProjectSpaceManifest(spaceId: string) {
  return listProjectSpaceManifests().find((manifest) => manifest.spaceId === spaceId) ?? null;
}
