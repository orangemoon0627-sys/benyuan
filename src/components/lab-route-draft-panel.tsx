import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buildDraftDetailHref } from "@/lib/draft-routing";
import type { DraftRouteSessionSummary } from "@/lib/types";
import { ReportCard } from "@/components/report-card";

function Capsule({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      {children}
    </span>
  );
}

function SeverityCapsule({ severity }: { severity: "notice" | "warning" | "blocking" }) {
  const tone =
    severity === "blocking"
      ? "bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.2)]"
      : severity === "warning"
        ? "bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.16)]"
        : "bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.16)]";

  return <span className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${tone}`}>{severity}</span>;
}

function rankSeverity(severity: "notice" | "warning" | "blocking") {
  if (severity === "blocking") return 3;
  if (severity === "warning") return 2;
  return 1;
}

export function LabRouteDraftPanel({
  routeTitle,
  items,
}: {
  routeTitle: string;
  items: DraftRouteSessionSummary[];
}) {
  const topSeverity = items
    .flatMap((item) => item.simulation?.impactAreas ?? [])
    .sort((left, right) => rankSeverity(right.severity) - rankSeverity(left.severity))[0]?.severity ?? null;
  const primaryChecks = items.filter((item) => item.routeCheck?.priority === "primary").length;

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[0.3fr_0.7fr]">
      <ReportCard eyebrow="drafts / route scope" title={`${routeTitle} 的草稿联动`}>
        <div className="space-y-3 text-sm leading-7 text-stone-300/82">
          <p>linked drafts：{items.length}</p>
          <p>review required：{items.filter((item) => item.simulation?.status === "review_required").length}</p>
          <p>blocking impacts：{items.reduce((count, item) => count + (item.simulation?.impactAreas.filter((impact) => impact.severity === "blocking").length ?? 0), 0)}</p>
          <p>ready only：{items.filter((item) => item.simulation?.status === "ready").length}</p>
          <p>primary checks：{primaryChecks}</p>
          <p>top severity：{topSeverity ?? "-"}</p>
          <p>avg readiness：{items.length === 0 ? "-" : Math.round(items.reduce((sum, item) => sum + (item.workflow?.readinessScore ?? 0), 0) / items.length)}</p>
        </div>
      </ReportCard>

      <ReportCard eyebrow="drafts / verification queue" title="本页需要复核的草稿">
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm leading-7 text-stone-400">当前没有草稿显式依赖这个面板。</p>
          ) : (
            items.map((item) => (
              <div key={item.draft.draftId} className="rounded-[24px] bg-black/16 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-stone-100">{item.draft.title}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-400">{item.draft.draftId}</p>
                    <p className="mt-2 text-sm leading-7 text-stone-300/82">{item.draft.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Capsule>{item.draft.kind}</Capsule>
                    <Capsule>{item.simulation?.status ?? "pending"}</Capsule>
                    <Capsule>{item.routeCheck?.priority ?? "linked"}</Capsule>
                    {item.workflow ? <Capsule>{item.workflow.readinessScore}% ready</Capsule> : null}
                  </div>
                </div>

                {item.routeCheck ? (
                  <div className="mt-4 space-y-2 text-sm leading-7 text-stone-300/82">
                    <p>{item.routeCheck.reason}</p>
                    {item.routeCheck.checks.map((check) => (
                      <p key={check}>{check}</p>
                    ))}
                    {item.workflow ? <p className="text-stone-500">next：{item.workflow.nextAction}</p> : null}
                    {item.workflow ? <p className="text-stone-500">route state：{item.workflow.routeProgress.find((entry) => entry.route === item.route)?.state ?? "pending"}</p> : null}
                  </div>
                ) : null}

                {item.simulation && item.simulation.impactAreas.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.simulation.impactAreas.slice(0, 3).map((impact) => (
                      <span key={`${item.draft.draftId}-${impact.key}`} className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-2 text-[11px] tracking-[0.16em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] uppercase">
                        <SeverityCapsule severity={impact.severity} />
                        {impact.title}
                      </span>
                    ))}
                  </div>
                ) : null}

                <Link href={buildDraftDetailHref(item.draft.draftId)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.07]">
                  打开草稿详情
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                </Link>
              </div>
            ))
          )}
        </div>
      </ReportCard>
    </section>
  );
}
