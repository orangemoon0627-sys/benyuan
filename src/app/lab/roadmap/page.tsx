import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDotDashed, Clock3, KanbanSquare } from "lucide-react";
import { ReportCard } from "@/components/report-card";
import { projectRoadmapBoard, type ProjectBoardStatus } from "@/lib/project-roadmap";

const statusTone: Record<ProjectBoardStatus, string> = {
  done: "bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]",
  in_progress: "bg-sky-400/10 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]",
  review_ready: "bg-amber-400/10 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]",
  planned: "bg-white/[0.04] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
};

const statusLabel: Record<ProjectBoardStatus, string> = {
  done: "done",
  in_progress: "in progress",
  review_ready: "review ready",
  planned: "planned",
};

function StatusPill({ status }: { status: ProjectBoardStatus }) {
  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.24em] ${statusTone[status]}`}>{statusLabel[status]}</span>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(196,220,255,0.88),rgba(144,186,255,0.72))]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function RoadmapLabPage() {
  const board = projectRoadmapBoard;
  const completedSteps = board.lanes.flatMap((lane) => lane.steps).filter((step) => step.status === "done").length;
  const totalSteps = board.lanes.flatMap((lane) => lane.steps).length;

  return (
    <main className="relative overflow-hidden bg-[#08080a] px-6 pb-20 pt-10 text-stone-100 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(189,218,255,0.12),transparent_22%),radial-gradient(circle_at_84%_16%,rgba(112,84,132,0.12),transparent_26%),radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.03),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <section className="rounded-[40px] bg-[linear-gradient(135deg,rgba(126,153,183,0.16),rgba(185,215,246,0.1),rgba(255,255,255,0.02))] px-7 py-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl md:px-10 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] tracking-[0.46em] text-stone-300/65 uppercase">internal / project roadmap</p>
              <h1 className="mt-5 text-4xl leading-[1.08] text-stone-50 md:text-6xl">项目控制台</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-stone-300/82 md:text-lg">
                这里不是泛泛而谈的状态页，而是把当前动作、目的、框架拆层、worktree 分工和验证闭环放到一张持续更新的控制台里。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab/runtime" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                runtime 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
              <Link href="/lab/golden" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm tracking-[0.18em] text-stone-200 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                golden 面板
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">current focus</p>
              <p className="mt-3 text-sm leading-7 text-stone-200/90">{board.currentFocus}</p>
            </div>
            <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">current objective</p>
              <p className="mt-3 text-sm leading-7 text-stone-200/90">{board.currentObjective}</p>
            </div>
            <div className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">next objective</p>
              <p className="mt-3 text-sm leading-7 text-stone-200/90">{board.nextObjective}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em]">
            <span className="rounded-full bg-emerald-400/10 px-4 py-3 text-emerald-200 shadow-[0_0_0_1px_rgba(74,222,128,0.18)]">完成步骤 {completedSteps}</span>
            <span className="rounded-full bg-white/[0.04] px-4 py-3 text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">总步骤 {totalSteps}</span>
            <span className="rounded-full bg-sky-400/10 px-4 py-3 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.18)]">快照 {board.snapshotDate}</span>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {board.lanes.map((lane) => (
              <ReportCard key={lane.id} eyebrow={lane.title} title={lane.description}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={lane.status} />
                    <span className="text-xs uppercase tracking-[0.24em] text-stone-500">progress {lane.progress}%</span>
                  </div>
                  <ProgressBar value={lane.progress} />
                  <div className="grid gap-3">
                    {lane.steps.map((step) => (
                      <div key={step.id} className="rounded-[24px] bg-black/16 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm tracking-[0.16em] text-stone-100 uppercase">{step.title}</p>
                          <StatusPill status={step.status} />
                        </div>
                        <p className="mt-3 text-sm leading-7 text-stone-300/84">动作：{step.action}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">目的：{step.purpose}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-500">owners · {step.owners.join(" / ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ReportCard>
            ))}
          </div>

          <div className="space-y-6">
            <ReportCard eyebrow="framework progress" title="框架拆层进度">
              <div className="space-y-5">
                {board.frameworkLayers.map((layer) => (
                  <div key={layer.id} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{layer.title}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-400">{layer.scope}</p>
                      </div>
                      <StatusPill status={layer.status} />
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={layer.progress} />
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-stone-500">{layer.progress}%</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {layer.artifacts.map((artifact) => (
                        <span key={artifact} className="rounded-full bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                          {artifact}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="worktree topology" title="多 worktree 协作视图">
              <div className="space-y-3">
                {board.worktrees.map((tree) => (
                  <div key={tree.path} className="rounded-[22px] bg-black/16 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 text-stone-100">
                      <KanbanSquare className="h-4 w-4" strokeWidth={1.4} />
                      <p className="text-sm uppercase tracking-[0.18em]">{tree.name}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-300/84">{tree.role}</p>
                    <p className="mt-2 text-xs text-stone-500">{tree.branch}</p>
                    <p className="mt-1 text-xs text-stone-500">{tree.path}</p>
                  </div>
                ))}
              </div>
            </ReportCard>

            <ReportCard eyebrow="validation loop" title="当前验证闭环">
              <div className="space-y-3">
                {board.validation.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-[22px] bg-black/16 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                    {index < 2 ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" strokeWidth={1.5} /> : index < 4 ? <CircleDotDashed className="mt-0.5 h-4 w-4 text-sky-200" strokeWidth={1.5} /> : <Clock3 className="mt-0.5 h-4 w-4 text-amber-200" strokeWidth={1.5} />}
                    <p className="text-sm leading-7 text-stone-300/84">{item}</p>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
        </section>
      </div>
    </main>
  );
}
