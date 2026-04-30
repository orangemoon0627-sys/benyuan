export type CodexHomeExperience = 'legacy' | 'codex';

export type CodexPlatformConfig = {
  platformEnabled: boolean;
  dashboardHref: string;
  legacyHomeHref: string;
  takeoverMode: 'shadow';
  companionUrl: string;
  companionProxyEnabled: boolean;
};

export type ProjectSpaceSurface = {
  href: string;
  label: string;
  kind: 'platform' | 'legacy' | 'workspace';
};

export type ProjectSpaceStatus = 'platform' | 'live' | 'active' | 'planned';

export type ProjectSpace = {
  id: string;
  title: string;
  shortTitle: string;
  status: ProjectSpaceStatus;
  tagline: string;
  description: string;
  primaryHref: string;
  legacyRoutes: string[];
  capabilities: string[];
  surfaces: ProjectSpaceSurface[];
};

export type ProjectSpaceSummary = {
  sessionCount: number;
  draftCount: number;
  health: 'healthy' | 'watch' | 'planned';
  signal: string;
};

export type CompanionStatus = {
  connected: boolean;
  mode: 'remote' | 'fallback';
  summary: string;
  bridgeHealth: 'online' | 'offline' | 'degraded';
  baseUrl: string;
  capabilities: string[];
  lastHeartbeatAt: string;
};

export type PlatformSession = {
  id: string;
  title: string;
  projectSpaceId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  recoveryHint: string;
  lastRunKind?: 'agent' | 'tool' | 'plan';
};

export type PermissionRiskLevel = 'low' | 'medium' | 'high';

export type PermissionDecisionRecord = {
  id: string;
  action: string;
  scope: string;
  riskLevel: PermissionRiskLevel;
  status: 'approved' | 'pending' | 'rejected';
  source: 'policy' | 'user' | 'fallback';
  reason: string;
  createdAt: string;
  resolvedAt?: string;
};

export type ToolCallStatus = 'queued' | 'running' | 'waiting_permission' | 'completed' | 'failed';

export type ToolCallRecord = {
  id: string;
  toolName: string;
  sessionId?: string;
  projectSpaceId?: string;
  status: ToolCallStatus;
  input: unknown;
  output: Record<string, unknown>;
  error?: string;
  permission: PermissionDecisionRecord;
  startedAt: string;
  completedAt?: string;
};

export type AgentRunRecord = {
  id: string;
  agentType: 'workspace_overview' | 'migration_guard';
  sessionId?: string;
  projectSpaceId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  stageLog: string[];
  startedAt: string;
  completedAt?: string;
};

export type PlanRunRecord = {
  id: string;
  objective: string;
  projectSpaceId: string;
  sessionId?: string;
  status: 'drafted' | 'in_progress' | 'completed';
  steps: string[];
  createdAt: string;
  updatedAt: string;
};

export type SkillSpec = {
  id: string;
  label: string;
  source: 'memory' | 'skills' | 'superpowers';
  path: string;
  status: 'loaded' | 'available' | 'missing';
  scope: 'global' | 'platform';
};

export type MemoryRecord = {
  id: string;
  title: string;
  path: string;
  preview: string;
  status: 'loaded' | 'missing';
};

export type PluginBinding = {
  id: string;
  label: string;
  provider: string;
  status: 'configured' | 'available' | 'missing';
  detail: string;
};

export type McpConnection = {
  id: string;
  label: string;
  status: 'configured' | 'available' | 'missing';
  transport: 'stdio' | 'http' | 'unknown';
  detail: string;
};

export type CodexPlatformBootstrap = {
  config: CodexPlatformConfig;
  homeExperience: CodexHomeExperience;
  companion: CompanionStatus;
  projectSpaces: Array<ProjectSpace & { summary: ProjectSpaceSummary }>;
  projectManifests: ProjectSpaceManifest[];
  sessions: PlatformSession[];
  toolCalls: ToolCallRecord[];
  agentRuns: AgentRunRecord[];
  planRuns: PlanRunRecord[];
  permissions: PermissionDecisionRecord[];
  runtimeEvents: RuntimeEventRecord[];
  memories: MemoryRecord[];
  skills: SkillSpec[];
  plugins: PluginBinding[];
  mcpConnections: McpConnection[];
};

export type CreateSessionInput = {
  title?: string;
  projectSpaceId: string;
};

export type CreateAgentRunInput = {
  agentType: AgentRunRecord['agentType'];
  projectSpaceId: string;
  sessionId?: string;
};

export type CreatePlanRunInput = {
  objective: string;
  projectSpaceId: string;
  sessionId?: string;
};

export type ToolCallInput = {
  toolName: 'project.scan' | 'project.space.read' | 'memory.read' | 'shell.exec';
  input: Record<string, unknown>;
  sessionId?: string;
  projectSpaceId?: string;
};

export type RuntimeEventKind =
  | 'requested'
  | 'permission_pending'
  | 'permission_resolved'
  | 'started'
  | 'stage'
  | 'stdout'
  | 'stderr'
  | 'completed'
  | 'failed';

export type RuntimeEventRecord = {
  id: string;
  runId: string;
  runType: 'tool' | 'agent';
  kind: RuntimeEventKind;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
};

export type PermissionResolutionInput = {
  permissionId: string;
  decision: 'approved' | 'rejected';
  reason?: string;
};

export type WorkspaceSectionId =
  | 'overview'
  | 'schema'
  | 'runtime'
  | 'agents'
  | 'native'
  | 'delivery'
  | 'review'
  | 'research'
  | 'handoff';

export type WorkspaceSectionRecordTone = 'default' | 'positive' | 'watch' | 'muted';

export type WorkspaceSectionRecord = {
  title: string;
  detail: string;
  meta?: string;
  href?: string;
  tone?: WorkspaceSectionRecordTone;
};

export type WorkspaceSectionPanel = {
  id: string;
  title: string;
  summary?: string;
  records: WorkspaceSectionRecord[];
};

export type WorkspaceSectionLink = {
  label: string;
  href: string;
  description?: string;
  kind: 'workspace' | 'compatibility' | 'api' | 'legacy' | 'doc';
};

export type WorkspaceSectionData = {
  title: string;
  summary: string;
  panels: WorkspaceSectionPanel[];
  links: WorkspaceSectionLink[];
  compatibility: WorkspaceSectionLink[];
};

export type WorkspaceSectionResponse = WorkspaceSectionData & {
  spaceId: string;
  sectionId: WorkspaceSectionId;
};

export type ProjectWorkbenchStatus = 'active' | 'compatibility' | 'planned' | 'stub';

export type ProjectWorkbench = {
  id: string;
  title: string;
  href: string;
  detail: string;
  capability: string;
  kind: 'board' | 'runtime' | 'agent' | 'schema' | 'delivery' | 'native' | 'research' | 'legacy';
  sectionId: WorkspaceSectionId;
  compatibilityHref?: string;
  status: ProjectWorkbenchStatus;
};

export type ProjectBoundary = {
  id: string;
  title: string;
  type: 'schema' | 'prompt' | 'delivery' | 'runtime' | 'artifact' | 'memory';
  owner: 'platform' | 'project';
  detail: string;
  references: string[];
};

export type ProjectSpaceManifest = {
  spaceId: string;
  defaultSection: WorkspaceSectionId;
  narrative: string;
  workbenches: ProjectWorkbench[];
  boundaries: ProjectBoundary[];
  nextMilestones: string[];
};
