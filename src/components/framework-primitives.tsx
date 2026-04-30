import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { benyuanUiRecipes, cx } from "@/config/benyuan-ui-recipes";

export function FrameworkPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={benyuanUiRecipes.pageShell}>
      <div className={benyuanUiRecipes.pageAura} />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className={benyuanUiRecipes.pageContent}>
        <section className={benyuanUiRecipes.heroPanel}>
          <div className="h-px w-20 bg-[var(--accent-gold)]" />
          <p className={cx("mt-6", benyuanUiRecipes.sectionEyebrow)}>{eyebrow}</p>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-[2.5rem] leading-[1.04] text-[var(--text-primary)] md:text-[3.6rem] lg:text-[4.6rem]">{title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}

export function PageScaffold({ children, phase = "collect" }: { children: ReactNode; phase?: "collect" | "processing" | "theater" | "constellation" }) {
  return (
    <main className={cx(benyuanUiRecipes.pageShell, "benyuan-mainflow", `benyuan-phase-${phase}`)}>
      <div className={cx(benyuanUiRecipes.pageAura, `cosmic-field--${phase}`)} />
      <div className="cosmic-arc" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className={benyuanUiRecipes.pageContent}>{children}</div>
    </main>
  );
}

export function GlassPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={cx(benyuanUiRecipes.glassPanel, className)}>{children}</section>;
}

export function ImmersiveSigil({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "h-16 w-16" : size === "lg" ? "h-36 w-36" : "h-24 w-24";

  return (
    <div className={cx("relative mx-auto", sizeClass, className)} aria-hidden>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(247,244,236,0.26),rgba(127,106,168,0.12)_34%,rgba(0,0,0,0.78)_58%,transparent_76%)] blur-[2px]" />
      <div className="absolute inset-[4%] rounded-full border border-[rgba(247,244,236,0.18)] shadow-[0_0_24px_rgba(127,106,168,0.14)]" />
      <div className="absolute inset-[18%] rounded-full border border-[rgba(216,204,255,0.14)]" />
      <div className="absolute inset-[32%] rounded-full border border-[rgba(231,194,122,0.22)] bg-[rgba(0,0,0,0.62)] shadow-[0_0_34px_rgba(247,244,236,0.16)]" />
      <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(247,244,236,0.9)] shadow-[0_0_22px_rgba(247,244,236,0.42)]" />
    </div>
  );
}

export function ImmersiveTopBar({
  backHref,
  backLabel = "返回",
  label,
  title,
  progressValue,
  progressText,
  trailing,
}: {
  backHref?: string;
  backLabel?: string;
  label?: ReactNode;
  title?: ReactNode;
  progressValue?: number;
  progressText?: string;
  trailing?: ReactNode;
}) {
  const hasMeta = Boolean(label) || Boolean(title);

  return (
    <div className={benyuanUiRecipes.immersiveTopBar}>
      {backHref ? (
        <Link href={backHref} aria-label={backLabel} className={benyuanUiRecipes.immersiveBackLink} data-benyuan-pressable="true">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <div className="h-11 w-11" aria-hidden />
      )}
      <div className={benyuanUiRecipes.immersiveTopMeta}>
        {label ? <p className={benyuanUiRecipes.immersiveTopLabel}>{label}</p> : null}
        {title ? <p className={benyuanUiRecipes.immersiveTopTitle}>{title}</p> : null}
        {typeof progressValue === "number" ? <ProgressRail value={progressValue} className={hasMeta ? "mt-1.5" : "mt-3"} /> : null}
      </div>
      <div className={cx("flex min-w-[2.5rem] flex-col items-end gap-1.5", trailing ? "max-w-[10rem]" : "")}>
        {progressText ? <span className={benyuanUiRecipes.immersiveTopProgressText}>{progressText}</span> : null}
        {trailing}
      </div>
    </div>
  );
}

export function ProgressRail({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cx(benyuanUiRecipes.progressTrack, className)}>
      <div className={benyuanUiRecipes.progressFill} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function ImmersivePassiveState({
  backHref,
  backLabel = "返回",
  topLabel,
  topTitle,
  topProgressValue,
  topProgressText,
  eyebrow,
  title,
  description,
  meterLabel,
  meterValue,
  meterHint,
  actions,
  className = "",
  panelTone = "accent",
  sigilSize = "lg",
  children,
}: {
  backHref?: string;
  backLabel?: string;
  topLabel?: ReactNode;
  topTitle?: ReactNode;
  topProgressValue?: number;
  topProgressText?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meterLabel?: ReactNode;
  meterValue?: number;
  meterHint?: ReactNode;
  actions?: ReactNode;
  className?: string;
  panelTone?: "accent" | "stage";
  sigilSize?: "sm" | "md" | "lg";
  children?: ReactNode;
}) {
  return (
    <div className={benyuanUiRecipes.immersiveFlowNarrow}>
      {backHref || topLabel || topTitle || typeof topProgressValue === "number" || topProgressText ? (
        <ImmersiveTopBar
          backHref={backHref}
          backLabel={backLabel}
          label={topLabel}
          title={topTitle}
          progressValue={topProgressValue}
          progressText={topProgressText}
        />
      ) : null}

      <GlassPanel
        className={cx(
          "cosmic-passive-panel mx-auto w-full max-w-[42rem]",
          panelTone === "accent" ? benyuanUiRecipes.heroAccentPanel : benyuanUiRecipes.stagePanel,
          className,
        )}
      >
        <div className={benyuanUiRecipes.passiveStateFrame}>
          {eyebrow ? <p className={benyuanUiRecipes.passiveStateEyebrow}>{eyebrow}</p> : null}
          <ImmersiveSigil size={sigilSize} className={eyebrow ? "mt-7" : ""} />
          <h2 className={benyuanUiRecipes.passiveStateTitle}>{title}</h2>
          {description ? <p className={benyuanUiRecipes.passiveStateBody}>{description}</p> : null}

          {typeof meterValue === "number" || meterLabel || meterHint ? (
            <div className={benyuanUiRecipes.passiveStateMeter}>
              {typeof meterValue === "number" ? (
                <div className="cosmic-orbit-meter" style={{ "--meter-value": `${Math.max(0, Math.min(100, meterValue))}%` } as CSSProperties}>
                  <span>{meterValue}%</span>
                </div>
              ) : null}
              {meterHint ? <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{meterHint}</p> : null}
              {meterLabel ? <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">阶段 · <span className="text-[var(--accent-gold)]">{meterLabel}</span></p> : null}
            </div>
          ) : null}

          {children ? <div className="mt-8 w-full">{children}</div> : null}
          {actions ? <div className={benyuanUiRecipes.passiveStateActions}>{actions}</div> : null}
        </div>
      </GlassPanel>
    </div>
  );
}

export function SectionTitle({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <p className={benyuanUiRecipes.sectionEyebrow}>{label}</p>
      <h2 className={benyuanUiRecipes.sectionTitle}>{title}</h2>
      {description ? <p className={cx("max-w-3xl", benyuanUiRecipes.bodyCopy)}>{description}</p> : null}
    </div>
  );
}

export function MetaPill({ children }: { children: ReactNode }) {
  return <span className={benyuanUiRecipes.metaPill}>{children}</span>;
}

export function MicroSwitch({
  items,
}: {
  items: Array<{ id: string; label: string; tone?: "idle" | "active" | "done"; onClick?: () => void }>;
}) {
  return (
    <div className={benyuanUiRecipes.microSwitchRail}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className={benyuanUiRecipes.microSwitchButton(item.tone ?? "idle")}
          data-benyuan-pressable="true"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function StepRail({
  items,
  activeId,
  completedIds = [],
  className = "",
}: {
  items: Array<{ id: string; label: string }>;
  activeId?: string;
  completedIds?: string[];
  className?: string;
}) {
  return (
    <div className={cx(benyuanUiRecipes.stepRail, className)}>
      {items.map((item, index) => {
        const tone = completedIds.includes(item.id) ? "done" : item.id === activeId ? "active" : "idle";
        return (
          <div key={item.id} className={benyuanUiRecipes.stepChip(tone)}>
            <span>{`${index + 1}`.padStart(2, "0")}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DetailCard({
  label,
  title,
  description,
  className = "",
  tone = "default",
  children,
}: {
  label: string;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "subtle";
  children?: ReactNode;
}) {
  const toneClass =
    tone === "accent"
      ? benyuanUiRecipes.accentCard
      : tone === "subtle"
        ? benyuanUiRecipes.subtleCard
        : benyuanUiRecipes.detailCard;

  return (
    <div className={cx(toneClass, className)}>
      <p className={benyuanUiRecipes.sectionEyebrow}>{label}</p>
      {title ? <div className="mt-4 text-[1.05rem] leading-8 text-[var(--text-primary)]">{title}</div> : null}
      {description ? <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  className = "",
  tone = "default",
  children,
}: {
  label: string;
  value: ReactNode;
  detail: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "active";
  children?: ReactNode;
}) {
  return (
    <div className={cx(benyuanUiRecipes.statCard(tone), className)}>
      {children}
      <p className={benyuanUiRecipes.sectionEyebrow}>{label}</p>
      <p className="mt-4 text-xl text-[var(--text-primary)] md:text-2xl">{value}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{detail}</p>
    </div>
  );
}

export function PrimaryLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx(benyuanUiRecipes.primaryLink, className)} data-benyuan-pressable="true">
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx(benyuanUiRecipes.secondaryLink, className)} data-benyuan-pressable="true">
      {children}
    </Link>
  );
}

export function AnchorLink({
  href,
  children,
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <a href={href} className={cx(benyuanUiRecipes.anchorLink, className)} {...props}>
      {children}
    </a>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cx(benyuanUiRecipes.primaryLink, className)} data-benyuan-pressable="true">
      {children}
    </button>
  );
}

export function SecondaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cx(benyuanUiRecipes.secondaryLink, className)} data-benyuan-pressable="true">
      {children}
    </button>
  );
}

export function BottomActionBar({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={cx(benyuanUiRecipes.bottomDock, className)}>{children}</div>;
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(benyuanUiRecipes.input, props.className)} />;
}
