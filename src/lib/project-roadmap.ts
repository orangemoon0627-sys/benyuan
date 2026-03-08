export type ProjectBoardStatus = "done" | "in_progress" | "review_ready" | "planned";

export type ProjectBoardStep = {
  id: string;
  title: string;
  purpose: string;
  action: string;
  status: ProjectBoardStatus;
  owners: string[];
};

export type ProjectBoardLane = {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: ProjectBoardStatus;
  steps: ProjectBoardStep[];
};

export type FrameworkLayer = {
  id: string;
  title: string;
  progress: number;
  status: ProjectBoardStatus;
  scope: string;
  artifacts: string[];
};

export type ProjectBoardData = {
  snapshotDate: string;
  currentFocus: string;
  currentObjective: string;
  nextObjective: string;
  lanes: ProjectBoardLane[];
  frameworkLayers: FrameworkLayer[];
  worktrees: Array<{
    name: string;
    path: string;
    branch: string;
    role: string;
  }>;
  validation: string[];
};

export const projectRoadmapBoard: ProjectBoardData = {
  snapshotDate: "2026-03-08",
  currentFocus: "把测试端 client contract 与内部项目看板做成可视化控制台",
  currentObjective: "让题库版本、测试节奏、分析边界、项目推进状态都可以在 web 内部面板直接查看",
  nextObjective: "把多版本 schema 对比、phase diff 和 iOS 复用 contract 再往前推一层",
  lanes: [
    {
      id: "kernel",
      title: "Assessment Kernel",
      description: "题库、题型、mode/version、映射层与校验规则",
      progress: 86,
      status: "in_progress",
      steps: [
        {
          id: "question-types",
          title: "题型注册表",
          purpose: "保证后续能替换题型而不改页面骨架",
          action: "抽离 question type registry 和 schema serialization",
          status: "done",
          owners: ["assessment", "frontend"],
        },
        {
          id: "content-mapping-split",
          title: "内容/映射拆层",
          purpose: "换题不伤分析，改映射不碰文案",
          action: "拆出 question content / analysis mapping / feature space",
          status: "done",
          owners: ["assessment", "backend"],
        },
        {
          id: "versioned-schema",
          title: "版本化 schema",
          purpose: "支持 lite.v2 / deep.v2 并保留旧 session 可复现性",
          action: "把 version 贯穿 schema / submit / session / analysis input",
          status: "done",
          owners: ["assessment", "backend"],
        },
        {
          id: "client-contract",
          title: "测试端节奏 contract",
          purpose: "让 web / iOS 共享同一套 phase/pacing/review 规则",
          action: "抽离 assessment client contract 并接回 /test",
          status: "in_progress",
          owners: ["frontend"],
        },
      ],
    },
    {
      id: "analysis",
      title: "Analysis Engine",
      description: "deterministic baseline、hybrid fallback、provider seams、runtime observability",
      progress: 80,
      status: "in_progress",
      steps: [
        {
          id: "analysis-input",
          title: "analysis input contract",
          purpose: "让 deterministic 和 LLM 共享统一输入",
          action: "把 registry/question contract 透传到 analysis layer",
          status: "done",
          owners: ["backend"],
        },
        {
          id: "prompt-template",
          title: "prompt 模板版本化",
          purpose: "未来改 prompt 不伤 baseline engine",
          action: "拆出 prompt template registry / merge seam / runtime metadata",
          status: "done",
          owners: ["backend"],
        },
        {
          id: "provider-adapter",
          title: "provider adapter 边界",
          purpose: "默认 stub，显式开启 live，保证产品流安全",
          action: "新增 provider-adapters + BENYUAN_LLM_LIVE gate",
          status: "done",
          owners: ["backend"],
        },
        {
          id: "provider-output",
          title: "真实 provider 增强输出",
          purpose: "让外部模型真正增强 narrative，而不是只挂 metadata",
          action: "补 provider response parsing / safeguards / compare lab",
          status: "planned",
          owners: ["backend", "prompt"],
        },
      ],
    },
    {
      id: "visibility",
      title: "Visibility & Ops",
      description: "lab 页面、回归验证、看板、文档同步",
      progress: 78,
      status: "in_progress",
      steps: [
        {
          id: "golden-runtime",
          title: "runtime + golden 实验面板",
          purpose: "知道当前运行时、样本回归和 baseline 漂移",
          action: "完成 /lab/runtime、/lab/golden、/lab/golden/audit",
          status: "done",
          owners: ["ops", "backend"],
        },
        {
          id: "project-board",
          title: "结构化项目看板",
          purpose: "让你随时看到动作、目的、框架进度和下一步",
          action: "新增 web 控制台和 JSON 数据源",
          status: "in_progress",
          owners: ["ops", "frontend"],
        },
        {
          id: "diff-tools",
          title: "版本差异面板",
          purpose: "直接对比不同 schema / prompt / report 版本",
          action: "下一步补 schema diff 与 version matrix",
          status: "planned",
          owners: ["ops", "frontend", "backend"],
        },
      ],
    },
  ],
  frameworkLayers: [
    {
      id: "ui-shell",
      title: "UI Shell",
      progress: 72,
      status: "in_progress",
      scope: "landing / test / processing / report / internal labs",
      artifacts: ["/test", "/processing/[sessionId]", "/report/[sessionId]", "/lab/runtime", "/lab/golden"],
    },
    {
      id: "assessment-contract",
      title: "Assessment Contract",
      progress: 88,
      status: "in_progress",
      scope: "question bank, question types, mode/version registry, schema API",
      artifacts: ["src/features/assessment/", "/api/test/schema", "src/lib/assessment-schema.ts"],
    },
    {
      id: "analysis-runtime",
      title: "Analysis Runtime",
      progress: 76,
      status: "in_progress",
      scope: "deterministic engine, hybrid fallback, provider adapters, prompt shaping",
      artifacts: ["src/lib/analysis/", "/api/analysis/runtime", "/lab/runtime"],
    },
    {
      id: "qa-observability",
      title: "QA & Observability",
      progress: 82,
      status: "review_ready",
      scope: "golden samples, smoke scripts, audit workflow, project board",
      artifacts: ["scripts/smoke-flow.mjs", "src/lib/golden-*", "/lab/golden", "/lab/roadmap"],
    },
  ],
  worktrees: [
    {
      name: "main orchestrator",
      path: "/Users/fanhao/Documents/Playground",
      branch: "main",
      role: "integration / smoke / orchestration",
    },
    {
      name: "frontend worktree",
      path: "/Users/fanhao/Documents/Playground-fe",
      branch: "codex/frontend-ui",
      role: "test flow / report UI / internal labs",
    },
    {
      name: "backend worktree",
      path: "/Users/fanhao/Documents/Playground-be",
      branch: "codex/backend-analysis",
      role: "analysis runtime / store / provider seams / contracts",
    },
  ],
  validation: [
    "npm run lint",
    "npm run build",
    "npm run smoke:runtime:page",
    "npm run smoke:runtime:hybrid",
    "BENYUAN_BASE_URL=http://localhost:3000 npm run smoke:flow:all",
    "BENYUAN_BASE_URL=http://localhost:3000 BENYUAN_ANALYSIS_ENGINE=hybrid npm run smoke:flow:deep",
  ],
};
