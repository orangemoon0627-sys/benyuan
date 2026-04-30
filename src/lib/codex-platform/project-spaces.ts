import type { ProjectSpace } from './types';

const projectSpaces: ProjectSpace[] = [
  {
    id: 'codex',
    title: 'Codex Platform',
    shortTitle: 'Codex',
    status: 'platform',
    tagline: 'Platform core, runtime bridge, and workspace shell.',
    description: 'Absorbs Claude Code style session, agent, tool, memory, permission, plugin, and MCP patterns into a stable web-first control plane.',
    primaryHref: '/codex',
    legacyRoutes: ['/codex'],
    capabilities: ['sessions', 'agents', 'tools', 'plans', 'memory', 'plugins', 'mcp'],
    surfaces: [
      { href: '/codex', label: 'Platform shell', kind: 'platform' },
      { href: '/workspace/codex', label: 'Workspace view', kind: 'workspace' },
    ],
  },
  {
    id: 'benyuan',
    title: 'Benyuan',
    shortTitle: '本源',
    status: 'live',
    tagline: 'Immersive self-inquiry chain with theater and constellation results.',
    description: 'The current primary web product line. Keep its main flow and internal lab routes alive while the new Codex shell absorbs orchestration and platform concerns.',
    primaryHref: '/workspace/benyuan',
    legacyRoutes: ['/collect', '/processing/benyuan', '/theater', '/constellation', '/lab', '/agent/director', '/agent/analyst'],
    capabilities: ['immersive-flow', 'analysis-runtime', 'lab-panels', 'native-handoff'],
    surfaces: [
      { href: '/workspace/benyuan', label: 'Workspace view', kind: 'workspace' },
      { href: '/collect', label: 'Main flow', kind: 'legacy' },
      { href: '/lab/status', label: 'Legacy lab', kind: 'legacy' },
    ],
  },
  {
    id: 'tradewise',
    title: 'TradeWise / Darwin',
    shortTitle: 'TradeWise',
    status: 'active',
    tagline: 'Mobile-first trade review, growth, and research workspace.',
    description: 'The current mobile/API line. Promote it into a first-class project space with shared platform services instead of leaving it as a sidecar subtree.',
    primaryHref: '/workspace/tradewise',
    legacyRoutes: ['/api/tradewise', '/lab/native-handoff'],
    capabilities: ['mobile-handoff', 'review-runtime', 'research-feed', 'release-chain'],
    surfaces: [
      { href: '/workspace/tradewise', label: 'Workspace view', kind: 'workspace' },
      { href: '/lab/native-handoff', label: 'Legacy handoff', kind: 'legacy' },
    ],
  },
  {
    id: 'embryo',
    title: 'Embryo',
    shortTitle: '胚胎',
    status: 'planned',
    tagline: 'Reserved incubation space for the next product line.',
    description: 'A future workspace slot kept visible in the platform so new projects enter through the same shell, permissions, memory, and delivery model.',
    primaryHref: '/workspace/embryo',
    legacyRoutes: [],
    capabilities: ['incubation', 'schema-design', 'delivery-planning'],
    surfaces: [{ href: '/workspace/embryo', label: 'Workspace view', kind: 'workspace' }],
  },
];

export function listProjectSpaces() {
  return [...projectSpaces];
}

export function getProjectSpaceById(spaceId: string) {
  return projectSpaces.find((space) => space.id === spaceId) ?? null;
}

export function resolveProjectSpaceByRoute(route: string) {
  return projectSpaces.find((space) => space.legacyRoutes.some((legacyRoute) => route === legacyRoute || route.startsWith(`${legacyRoute}/`))) ?? null;
}
