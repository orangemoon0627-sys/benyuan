import { InternalLabNav } from "@/components/internal-lab-nav";
import { DetailCard, GlassPanel, SectionTitle } from "@/components/framework-primitives";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";
import { benyuanBetaFreezeCurrent } from "@/lib/benyuan-beta-freeze";
import { getBenyuanStatusSnapshot } from "@/lib/benyuan-status";

export const dynamic = "force-dynamic";

function toneClass(ok: boolean) {
  return ok
    ? "border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.06)]"
    : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]";
}

export default async function NativeHandoffPage() {
  const snapshot = await getBenyuanStatusSnapshot();
  const shellBaseUrl = snapshot.ios.nativeSmoke?.baseUrl ?? snapshot.ios.regression?.baseUrl ?? "http://127.0.0.1:3015";
  const manual = snapshot.ios.manualRealDevice;

  return (
    <main className={benyuanUiRecipes.pageShell}>
      <div className={benyuanUiRecipes.pageAura} />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className={benyuanUiRecipes.pageContent}>
        <section className={benyuanUiRecipes.heroPanel}>
          <div className="h-px w-20 bg-[var(--accent-gold)]" />
          <p className={cx("mt-6", benyuanUiRecipes.sectionEyebrow)}>lab / native handoff</p>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-[2.5rem] leading-[1.04] text-[var(--text-primary)] md:text-[3.6rem] lg:text-[4.4rem]">iOS shell 与真机闭环。</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
                这里专门收口 shell base URL、回归脚本、native smoke、真机相机 / 相册验收，以及调试入口。主产品页已经不再展示这些交接细节，只把它们留在内部页复核。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
              <span className={cx("px-4 py-3", benyuanUiRecipes.metaPill)}>{snapshot.ios.manualRealDevicePending ? "pending real device" : "real device ready"}</span>
              <span className={cx("px-4 py-3", benyuanUiRecipes.metaPill)}>{shellBaseUrl}</span>
            </div>
          </div>
          <InternalLabNav current="/lab/native-handoff" className="mt-8" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard
            label="shell regression"
            title={snapshot.ios.regression ? `${snapshot.ios.regression.passed}/${snapshot.ios.regression.total} passed` : "--"}
            description={snapshot.ios.regression?.generatedAt ?? "未找到回归输出"}
            tone="accent"
          />
          <DetailCard
            label="native smoke"
            title={snapshot.ios.nativeSmoke?.deviceName ?? "--"}
            description={snapshot.ios.nativeSmoke?.generatedAt ?? "未找到 native smoke 输出"}
          />
          <DetailCard
            label="real device"
            title={manual ? `${manual.completedChecks}/${manual.totalChecks}` : "--"}
            description={manual ? `${manual.pendingChecks} 项待补` : "尚未读取到验收板"}
          />
          <DetailCard
            label="pilot handoff"
            title={snapshot.pilotReadiness.status}
            description={snapshot.pilotReadiness.summary}
          />
        </section>

        <GlassPanel>
          <SectionTitle label="shell environment" title="当前壳层环境与恢复入口" description="Mac / 模拟器默认走 127.0.0.1，真机需要切换到当前可达的 LAN 地址。" />
          <div className="grid gap-4 xl:grid-cols-2">
            <DetailCard label="base url" title={shellBaseUrl} description="当前 regression / native smoke 读取到的最近一条 base URL。" tone="accent">
              <div className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                <p>shell manifest：{benyuanBetaFreezeCurrent.shell.manifest}</p>
                <p>shell config：{benyuanBetaFreezeCurrent.shell.config}</p>
                <p>freeze map：{benyuanBetaFreezeCurrent.docs.iosMapDoc}</p>
              </div>
            </DetailCard>
            <DetailCard
              label="handoff routes"
              title="测试 / 状态 / 调试入口"
              description="这些入口继续保留在 lab，用于真机复测和 handoff。"
            >
              <div className="mt-2 flex flex-wrap gap-3">
                <a href="/lab/status" className={benyuanUiRecipes.secondaryLink}>状态页</a>
                <a href="/lab/native-handoff/smoke?autorun=1&source=library" className={benyuanUiRecipes.secondaryLink}>相册 smoke</a>
                <a href="/lab/native-handoff/smoke?autorun=1&source=camera" className={benyuanUiRecipes.secondaryLink}>相机 smoke</a>
                <a href="/collect?debug=1" className={benyuanUiRecipes.secondaryLink}>collect 调试入口</a>
              </div>
            </DetailCard>
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionTitle label="acceptance board" title="真机验收板" description="以验收板和对应 evidence 作为唯一手工事实来源。" />
          {manual ? (
            <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
              <div className={cx("border p-5", toneClass(manual.ready))}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">board</p>
                <p className="mt-3 text-base text-[var(--text-primary)]">{manual.boardPath}</p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                  <p>updated：{manual.boardUpdatedAt}</p>
                  <p>completed：{manual.completedChecks}</p>
                  <p>pending：{manual.pendingChecks}</p>
                </div>
              </div>
              <div className="grid gap-4">
                {manual.latestCompletedItem ? (
                  <DetailCard
                    label="latest evidence"
                    title={manual.latestCompletedItem.label}
                    description={`${manual.latestCompletedItem.route} · ${manual.latestCompletedItem.evidence}`}
                    tone="accent"
                  >
                    <div className="space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                      <p>{manual.latestCompletedItem.notes}</p>
                      <p>{manual.latestCompletedItem.filePath ?? "--"}</p>
                    </div>
                  </DetailCard>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {manual.pendingItems.map((item) => (
                    <div key={`${item.label}-${item.route}`} className={cx("border p-4", toneClass(false))}>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">pending</p>
                      <p className="mt-3 text-base text-[var(--text-primary)]">{item.label}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.route}</p>
                      <p className="text-sm leading-7 text-[var(--text-tertiary)]">{item.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={cx("border p-5", toneClass(false))}>
              <p className="text-base text-[var(--text-primary)]">尚未读取到真机验收板。</p>
            </div>
          )}
        </GlassPanel>

        <GlassPanel>
          <SectionTitle label="automation" title="iOS 护栏状态" description="这里只保留对 shell handoff 真正有用的脚本结果与说明。" />
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {snapshot.pilotReadiness.checklist
              .filter((item) => item.label.includes("iOS") || item.label.includes("真机"))
              .map((item) => (
                <div key={item.label} className={cx("border p-5", toneClass(item.ok))}>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">check</p>
                  <p className="mt-3 text-base text-[var(--text-primary)]">{item.label}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{item.detail}</p>
                </div>
              ))}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
