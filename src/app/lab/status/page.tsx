import { InternalLabNav } from "@/components/internal-lab-nav";
import { DetailCard, GlassPanel, SectionTitle } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import { benyuanBetaFreezeCurrent } from "@/lib/benyuan-beta-freeze";
import { getBenyuanStatusSnapshot } from "@/lib/benyuan-status";
import { getLatestBenyuanDemoLinks } from "@/lib/benyuan-v3-demo-links-server";

export const dynamic = "force-dynamic";

function toneClass(ok: boolean) {
  return ok
    ? "border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.06)] text-[var(--text-primary)]"
    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)]";
}

function readinessTitle(status: string) {
  if (status === "ready") return "pilot ready";
  if (status === "pending_real_device") return "pending real device";
  return "blocked";
}

function phaseLabel(phase: string) {
  if (phase === "guided_pilot") return "guided pilot";
  if (phase === "part3_candidate") return "part 3 candidate";
  if (phase === "real_device_closeout") return "real device closeout";
  return "technical closeout";
}

export default async function LabStatusPage() {
  const [snapshot, demoLinks] = await Promise.all([getBenyuanStatusSnapshot(), getLatestBenyuanDemoLinks()]);
  const latestBenchmark = snapshot.latestFullBaseline ?? snapshot.latestBenchmark;
  const latestConstellation = snapshot.latestConstellation;

  return (
    <main className={benyuanUiRecipes.pageShell}>
      <div className={benyuanUiRecipes.pageAura} />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className={benyuanUiRecipes.pageContent}>
        <section className={benyuanUiRecipes.heroPanel}>
          <div className="h-px w-20 bg-[var(--accent-gold)]" />
          <p className={cx("mt-6", benyuanUiRecipes.sectionEyebrow)}>lab / status</p>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-[2.5rem] leading-[1.04] text-[var(--text-primary)] md:text-[3.6rem] lg:text-[4.4rem]">当前 beta 的唯一状态源。</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
                这里收口 freeze、benchmark、golden、iOS shell 与 pilot execution。主产品页已经不再常驻测试包、demo 与 runtime 信息；这些入口统一收回到内部页，保持产品与工具态分层。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
              <span className={cx("px-4 py-3", benyuanUiRecipes.metaPill)}>{readinessTitle(snapshot.pilotReadiness.status)}</span>
              <span className={cx("px-4 py-3", benyuanUiRecipes.metaPill)}>{phaseLabel(snapshot.currentStage.phase)}</span>
            </div>
          </div>
          <InternalLabNav current="/lab/status" className="mt-8" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard label="pilot readiness" title={readinessTitle(snapshot.pilotReadiness.status)} description={snapshot.pilotReadiness.summary} tone="accent" />
          <DetailCard label="current phase" title={phaseLabel(snapshot.currentStage.phase)} description={snapshot.currentStage.nextAction} />
          <DetailCard
            label="benchmark"
            title={latestBenchmark?.fileName ?? "--"}
            description={latestBenchmark ? `${latestBenchmark.results.length} packs · avg ${snapshot.latestFullBaselineHealth?.averageDuration ?? snapshot.latestBenchmarkHealth?.averageDuration ?? "--"}s` : "尚未读取到 benchmark 输出"}
          />
          <DetailCard
            label="latest constellation"
            title={latestConstellation?.archetype ?? "--"}
            description={latestConstellation ? `${latestConstellation.topDimension} · ${latestConstellation.firstTension}` : "尚未读取到最新星图结果"}
          />
        </section>

        <GlassPanel>
          <SectionTitle label="freeze" title="当前可信基线与状态链" description="继续使用既有 freeze，不再生成新的 freeze 文档。" />
          <div className="grid gap-4 xl:grid-cols-2">
            <DetailCard
              label="baseline"
              title={benyuanBetaFreezeCurrent.freezeId}
              description={`freeze doc: ${benyuanBetaFreezeCurrent.docs.freezeDoc}`}
              tone="accent"
            >
              <div className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                <p>benchmark snapshot：{benyuanBetaFreezeCurrent.benchmarkSnapshot}</p>
                <p>archive：{benyuanBetaFreezeCurrent.archiveFolder}</p>
                <p>shell config：{benyuanBetaFreezeCurrent.shell.config}</p>
              </div>
            </DetailCard>
            <DetailCard
              label="status docs"
              title="handoff / summary / feedback"
              description="本轮 pilot 只认 handoff、summary、feedback 与真机验收板。"
            >
              <div className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                <p>{snapshot.pilotExecution.docs.handoffPath}</p>
                <p>{snapshot.pilotExecution.docs.summaryPath}</p>
                <p>{snapshot.pilotExecution.docs.feedbackLogPath}</p>
                <p>{snapshot.ios.manualRealDevice?.boardPath ?? "尚未读取到 acceptance board"}</p>
              </div>
            </DetailCard>
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTitle label="automation" title="自动化护栏" description="只显示对 pilot / handoff 真正重要的通过状态。" />
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {snapshot.pilotReadiness.checklist.map((item) => (
              <div key={item.label} className={cx("border p-5", toneClass(item.ok))}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">check</p>
                <p className="mt-3 text-base text-[var(--text-primary)]">{item.label}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <DetailCard
              label="golden"
              title={snapshot.regression.goldenAudit ? `${snapshot.regression.goldenAudit.passed}/${snapshot.regression.goldenAudit.total} passed` : "--"}
              description={snapshot.regression.goldenRegression?.baseline?.resolvedVersion ?? "未找到 golden regression 输出"}
            />
            <DetailCard
              label="ios shell"
              title={snapshot.ios.regression ? `${snapshot.ios.regression.passed}/${snapshot.ios.regression.total} passed` : "--"}
              description={snapshot.ios.regression?.baseUrl ?? "未找到 iOS shell regression 输出"}
            />
            <DetailCard
              label="native smoke"
              title={snapshot.ios.nativeSmoke?.deviceName ?? "--"}
              description={snapshot.ios.nativeSmoke?.baseUrl ?? "未找到 native smoke 输出"}
            />
          </div>
        </GlassPanel>

        <section id="debug-routes" className="scroll-mt-28">
          <GlassPanel>
            <SectionTitle label="debug entry" title="主流程移出的入口都在这里。" description="测试素材包、freeze demo、collect 调试入口统一放回 lab，不再占用产品页。" />
            <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <div className={cx("p-5", benyuanUiRecipes.sectionPanel)}>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">collect debug</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href="/collect?debug=1" className={benyuanUiRecipes.secondaryLink}>/collect?debug=1</a>
                    <a href="/collect/a?debug=1" className={benyuanUiRecipes.secondaryLink}>/collect/a?debug=1</a>
                    <a href="/collect/b?debug=1" className={benyuanUiRecipes.secondaryLink}>/collect/b?debug=1</a>
                    <a href="/collect/c?debug=1" className={benyuanUiRecipes.secondaryLink}>/collect/c?debug=1</a>
                  </div>
                </div>
                <div className={cx("p-5", benyuanUiRecipes.sectionPanel)}>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">freeze demo routes</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {demoLinks.map((item) => (
                      <div key={item.pack} className="border border-[var(--border)] bg-[rgba(255,255,255,0.012)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">pack {item.pack}</p>
                        <p className="mt-3 text-base text-[var(--text-primary)]">{item.name}</p>
                        <p className="mt-2 text-sm text-[var(--accent-gold)]">{item.archetype}</p>
                        <div className="mt-4 flex gap-3">
                          <a href={item.theaterHref} className={benyuanUiRecipes.secondaryLink}>剧场</a>
                          <a href={item.constellationHref} className={benyuanUiRecipes.primaryLink}>星图</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={cx("p-5", benyuanUiRecipes.sectionPanel)}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">status sync</p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
                  <p>pilot execution：{snapshot.pilotExecution.status}</p>
                  <p>effective sessions：{snapshot.pilotExecution.effectiveSessions} / {snapshot.pilotExecution.requiredEffectiveSessions}</p>
                  <p>freeze aligned：{snapshot.freezeReference.benchmarkAligned ? "yes" : "no"}</p>
                  {snapshot.recentFallback ? (
                    <div className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                      <p className="text-[var(--text-primary)]">最近一次 fallback</p>
                      <p className="mt-2">{snapshot.recentFallback.pack} · {snapshot.recentFallback.stageLabel}</p>
                      <p>{snapshot.recentFallback.error ?? "--"}</p>
                    </div>
                  ) : (
                    <div className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
                      <p className="text-[var(--text-primary)]">最近没有 fallback</p>
                      <p className="mt-2">当前 benchmark 输出没有暴露新的 fallback 或 error。</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassPanel>
        </section>

        <GlassPanel>
          <SectionTitle label="guided pilot" title="session 与结论" description="pilot execution 仍以真实 session、feedback log 与 summary 为准。" />
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {snapshot.pilotExecution.sessions.map((session) => (
                <div key={session.sessionId} className={cx("border p-5", toneClass(session.status === "completed"))}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">{session.sessionId}</p>
                      <p className="mt-3 text-base text-[var(--text-primary)]">{session.participant ?? "pending"}</p>
                    </div>
                    <span className={cx("px-3 py-2", benyuanUiRecipes.metaPill)}>{session.conclusion ?? session.currentStatus ?? session.status}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                    <p>环境：{session.environment ?? "--"}</p>
                    <p>base URL：{session.baseUrl ?? "--"}</p>
                    <p>更新：{session.updatedAt}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <DetailCard
                label="summary"
                title={snapshot.pilotExecution.status}
                description={snapshot.pilotExecution.reason ?? "summary 中尚未写入原因"}
                tone="accent"
              >
                <ul className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {snapshot.pilotExecution.nextSteps.map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ul>
              </DetailCard>
              <DetailCard
                label="feedback log"
                title={`blocker ${snapshot.pilotExecution.feedback?.blocker ?? "--"} · major ${snapshot.pilotExecution.feedback?.major ?? "--"}`}
                description={`minor ${snapshot.pilotExecution.feedback?.minor ?? "--"} · nice-to-have ${snapshot.pilotExecution.feedback?.niceToHave ?? "--"}`}
              />
            </div>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
