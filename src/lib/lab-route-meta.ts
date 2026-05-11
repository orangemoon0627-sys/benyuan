export type LabRouteMeta = {
  href: string;
  title: string;
  detail: string;
};

export const labRouteMeta: LabRouteMeta[] = [
  {
    href: "/lab/board",
    title: "研发看板",
    detail: "看 draft workflow、route 覆盖、runtime、golden 和阶段推进。",
  },
  {
    href: "/lab/content",
    title: "内容预览台",
    detail: "看题库版本、manifest、source file、差异和只读编辑视图。",
  },
  {
    href: "/lab/kernel",
    title: "内核工作台",
    detail: "看 runtime 组合、prompt/schema diff、pipeline 与 session 实况。",
  },
  {
    href: "/lab/kernel-admin",
    title: "内核管理台",
    detail: "看配置源、默认组合和后续可编辑化的入口。",
  },
  {
    href: "/lab/drafts",
    title: "草稿会话库",
    detail: "看稳定 draft id、关联关系，以及 apply simulation。",
  },
  {
    href: "/lab/delivery",
    title: "交付调度台",
    detail: "看 freeze/apply/archive 队列、动作池和路由压力。",
  },
  {
    href: "/lab/feedback",
    title: "反馈清单",
    detail: "看 TestFlight 与本地测试反馈、阶段、设备上下文和用户链路。",
  },
  {
    href: "/lab/test-plan",
    title: "测试任务清单",
    detail: "看 App 测试项、验证方式、关联反馈和当前推进状态。",
  },
  {
    href: "/lab/release-chain",
    title: "发布链路台",
    detail: "看 content、schema、native、analysis、delivery 的统一发布链。",
  },
  {
    href: "/lab/schema",
    title: "题库结构面板",
    detail: "看 mode/version/phase/flow contract 与结构差异。",
  },
  {
    href: "/lab/runtime",
    title: "Runtime 面板",
    detail: "看 engine/provider/prompt/schema 组合与运行态。",
  },
  {
    href: "/lab/status",
    title: "状态面板",
    detail: "看 benyuan 当前 provider、latest benchmark、fallback 链和最近成功结果。",
  },
  {
    href: "/lab/native-handoff",
    title: "原生交接面板",
    detail: "看 iOS/RN blueprint、screen sequence 和迁移 checklist。",
  },
  {
    href: "/lab/golden",
    title: "Golden 面板",
    detail: "看回归样本、冻结基线和 reviewer audit。",
  },
];

export function getLabRouteMeta(route: string) {
  return labRouteMeta.find((item) => item.href === route) ?? null;
}
