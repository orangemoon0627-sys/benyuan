export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const benyuanUiRecipes = {
  pageShell:
    "generative-page postmodern-page relative min-h-screen min-h-dvh overflow-x-hidden bg-[var(--void-black)] px-5 pb-[calc(6.25rem_+_env(safe-area-inset-bottom))] pt-[calc(0.72rem_+_env(safe-area-inset-top))] text-[var(--text-primary)] sm:px-6 md:px-8",
  pageAura:
    "postmodern-cosmic-field pointer-events-none absolute inset-0",
  pageContent: "relative z-10 mx-auto flex w-full max-w-[calc(100vw_-_2.5rem)] flex-col gap-3 md:max-w-[30rem] md:gap-4",
  heroPanel:
    "relative overflow-hidden rounded-[2.2rem] border border-[var(--border)] bg-[var(--surface-glass)] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[24px] md:px-8 md:py-9",
  heroSplit: "grid gap-6 xl:grid-cols-[1.06fr_0.94fr] xl:items-end",
  heroSummaryCard:
    "rounded-[1.85rem] border border-[var(--border)] bg-[var(--surface-glass)] p-5 backdrop-blur-xl md:p-6",
  glassPanel:
    "relative overflow-hidden rounded-[2.35rem] border border-[var(--lunar-border)] bg-[var(--surface-glass)] px-5 py-6 shadow-[0_18px_58px_rgba(3,4,13,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[28px] md:px-7 md:py-7",
  sectionPanel:
    "rounded-[2rem] border border-[var(--lunar-border)] bg-[var(--surface-glass)] shadow-[0_14px_48px_rgba(3,4,13,0.12),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-[26px]",
  accentPanel:
    "rounded-[2rem] border border-[var(--lunar-border)] bg-[var(--surface-glass-strong)] shadow-[0_16px_54px_rgba(3,4,13,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[26px]",
  heroAccentPanel:
    "overflow-hidden rounded-[2.55rem] border border-[var(--lunar-border)] bg-[var(--surface-glass)] shadow-[0_24px_76px_rgba(3,4,13,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[28px]",
  stagePanel:
    "overflow-hidden rounded-[2.45rem] border border-[var(--lunar-border)] bg-[var(--surface-glass)] shadow-[0_24px_76px_rgba(3,4,13,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[28px]",
  sectionEyebrow: "text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]",
  sectionTitle: "text-[1.7rem] leading-[1.06] text-[var(--text-primary)] md:text-[2.5rem]",
  bodyCopy: "text-sm leading-7 text-[var(--text-secondary)] md:text-base",
  metaPill:
    "inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)] backdrop-blur-xl",
  primaryLink:
    "postmodern-primary-action relative inline-flex min-h-[3.55rem] select-none items-center justify-center gap-2 overflow-hidden rounded-full border border-[rgba(240,232,207,0.22)] bg-[linear-gradient(180deg,rgba(38,36,48,0.84),rgba(7,8,18,0.86))] py-3.5 pl-7 pr-16 text-[15px] font-semibold tracking-[0em] text-[var(--text-primary)] shadow-[0_18px_52px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.11)] transition duration-150 will-change-transform hover:border-[rgba(196,177,122,0.42)] hover:brightness-110 active:translate-y-px active:scale-[0.982] backdrop-blur-[28px]",
  secondaryLink:
    "inline-flex min-h-[3.35rem] select-none items-center justify-center gap-2 rounded-full border border-[rgba(225,230,255,0.13)] bg-[rgba(231,235,255,0.055)] px-5 py-3 text-[14px] font-semibold tracking-[0em] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-150 will-change-transform hover:border-[rgba(196,177,122,0.28)] hover:bg-[rgba(255,255,255,0.075)] hover:text-[var(--text-primary)] active:translate-y-px active:scale-[0.985] backdrop-blur-[28px]",
  input:
    "min-h-12 rounded-[1.35rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] backdrop-blur-[22px]",
  header: "sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(0,0,0,0.92)] pt-[var(--safe-top)] backdrop-blur-xl",
  headerWrap: "mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8",
  headerBrand: "text-sm uppercase tracking-[0.45em] text-[var(--text-primary)] transition hover:text-[var(--accent-gold)]",
  headerNav: "flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] md:justify-end",
  shellHeader:
    "sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.94)] backdrop-blur-2xl benyuan-safe-top benyuan-safe-inset",
  shellHeaderWrap: "mx-auto flex max-w-6xl flex-col gap-4 pb-3 pt-3",
  shellHeaderEyebrow: "text-[11px] uppercase tracking-[0.36em] text-[var(--accent-gold)]",
  shellHeaderTitle: "text-lg font-medium tracking-[0em] text-[var(--text-primary)] md:text-xl",
  shellHeaderSubtitle: "text-xs leading-6 text-[var(--text-secondary)] md:text-sm",
  shellHeaderMeta:
    "inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]",
  shellSegmentedNav: (columns: number) =>
    cx(
      "grid min-h-12 gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(9,10,22,0.58)] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[28px]",
      columns <= 3 ? "grid-cols-3" : columns === 4 ? "grid-cols-4" : "grid-cols-5",
    ),
  shellSegmentLink: (active: boolean) =>
    cx(
      "inline-flex min-h-11 select-none items-center justify-center rounded-[1rem] px-3 py-2 text-sm uppercase tracking-[0.08em] transition duration-150 will-change-transform active:translate-y-px active:scale-[0.985]",
      active
        ? "border border-[rgba(240,238,244,0.18)] bg-[rgba(240,238,244,0.07)] text-[var(--text-primary)] shadow-[0_0_14px_rgba(215,211,222,0.06)]"
        : "border border-transparent text-[var(--text-secondary)] hover:border-[rgba(215,211,222,0.14)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]",
    ),
  progressTrack: "h-[2px] overflow-hidden rounded-full bg-[rgba(225,229,255,0.16)]",
  progressFill: "h-full rounded-full bg-[linear-gradient(90deg,rgba(176,158,104,0.62),rgba(248,247,239,0.88))] shadow-[0_0_14px_rgba(196,177,122,0.18)]",
  immersiveFlow: "mx-auto flex w-full max-w-[calc(100vw_-_2.5rem)] flex-col gap-3.5 md:max-w-[30rem] md:gap-4",
  immersiveFlowNarrow: "mx-auto flex w-full max-w-[calc(100vw_-_2.5rem)] flex-col gap-3.5 md:max-w-[29rem] md:gap-4",
  immersiveFocusFrame:
    "rounded-[2.25rem] border border-[var(--border)] bg-[var(--surface-glass)] px-5 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] backdrop-blur-[22px] md:px-8 md:py-9",
  passiveStateFrame: "relative mx-auto flex min-h-[67vh] max-w-[22.5rem] flex-col items-center justify-center text-center md:max-w-[26rem]",
  passiveStateEyebrow: "text-[10px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]",
  passiveStateTitle: "mt-7 text-[2.75rem] font-black leading-[0.94] tracking-[0em] text-[var(--text-primary)] drop-shadow-[0_0_18px_rgba(196,177,122,0.08)] md:text-[4.25rem]",
  passiveStateBody: "mt-4 max-w-[21rem] text-[0.96rem] leading-7 text-[var(--text-secondary)] md:text-[1rem] md:leading-8",
  passiveStateMeter:
    "mt-8 w-full max-w-[21rem] text-center md:max-w-[23rem]",
  passiveStateActions: "mt-10 flex flex-wrap items-center justify-center gap-3",
  microSwitchRail:
    "postmodern-switch-rail mx-auto inline-flex min-h-10 items-center gap-1 rounded-full border border-[rgba(225,230,255,0.12)] bg-[rgba(9,10,22,0.54)] p-1 shadow-[0_14px_44px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[28px]",
  microSwitchButton: (tone: "idle" | "active" | "done" = "idle") =>
    cx(
      "inline-flex min-h-7 min-w-[2.3rem] items-center justify-center rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] transition duration-150 will-change-transform active:translate-y-px active:scale-[0.985]",
      tone === "active"
        ? "bg-[rgba(246,248,255,0.13)] text-[var(--text-primary)] shadow-[0_0_14px_rgba(196,177,122,0.14)]"
        : tone === "done"
          ? "bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)]"
          : "text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[var(--text-primary)]",
    ),
  thumbnailRail: "flex gap-3 overflow-x-auto pb-1 benyuan-safe-inset",
  thumbnailCard:
    "w-[7.25rem] shrink-0 overflow-hidden rounded-[1.55rem] border border-[var(--border)] bg-[rgba(255,255,255,0.035)] p-2.5 backdrop-blur-xl",
  stickySubnav:
    "sticky top-[calc(var(--space-3)_+_env(safe-area-inset-top))] z-10 overflow-hidden rounded-[1.4rem] border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.82)] backdrop-blur-2xl",
  anchorRail: "overflow-x-auto benyuan-safe-inset benyuan-safe-bottom",
  anchorRailWrap: "flex min-w-max items-center gap-3 pr-2 text-sm text-[var(--text-secondary)]",
  anchorLink:
    "inline-flex min-h-11 select-none items-center justify-center rounded-full border border-transparent px-3 py-2 text-sm tracking-[0.04em] text-[var(--text-secondary)] transition duration-150 will-change-transform hover:border-[rgba(215,211,222,0.18)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] active:translate-y-px active:scale-[0.985]",
  detailCard: "rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-glass)] p-5 backdrop-blur-xl",
  subtleCard: "rounded-[1.4rem] border border-[var(--border)] bg-black/18 p-4 backdrop-blur-xl",
  accentCard: "rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-glass)] p-5 backdrop-blur-xl",
  ritualMeter:
    "grid gap-3 rounded-[1.6rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-xl md:grid-cols-3",
  ritualMeterItem: "flex flex-col gap-2 border-l border-[rgba(255,255,255,0.08)] pl-4 first:border-l-0 first:pl-0",
  stepRail: "flex flex-wrap gap-2",
  stepChip: (tone: "idle" | "active" | "done" = "idle") =>
    cx(
      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[11px] tracking-[0.16em] transition duration-150",
      tone === "done"
        ? "border-[rgba(240,238,244,0.14)] bg-[rgba(240,238,244,0.045)] text-[var(--text-primary)]"
        : tone === "active"
          ? "border-[rgba(240,238,244,0.22)] bg-[rgba(240,238,244,0.07)] text-[var(--text-primary)] shadow-[0_0_14px_rgba(215,211,222,0.06)]"
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)]",
    ),
  bottomDock:
    "benyuan-safe-bottom fixed inset-x-0 bottom-0 z-40 px-5 py-3 md:px-6",
  bottomDockLayout: "grid gap-4 md:grid-cols-[1fr_auto] md:items-center",
  bottomDockCompact: "grid gap-3 md:grid-cols-[1fr_auto] md:items-center",
  bottomDockMeta: "flex flex-wrap gap-2",
  statCard: (tone: "default" | "accent" | "active" = "default") =>
    cx(
      "rounded-[1.75rem] border px-4 py-4 backdrop-blur-[22px]",
      tone === "accent"
        ? "border-[rgba(240,238,244,0.14)] bg-[var(--surface-glass)]"
        : tone === "active"
          ? "border-[rgba(240,238,244,0.22)] bg-[rgba(240,238,244,0.07)] shadow-[0_0_18px_rgba(215,211,222,0.08)]"
          : "border-[var(--border)] bg-[var(--surface-glass)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    ),
  interactiveCard: (active = false, tone: "default" | "accent" = "default") =>
    cx(
      "postmodern-choice-card w-full rounded-full border px-[1.125rem] py-4 text-left shadow-[0_16px_42px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-150 will-change-transform active:translate-y-[1px] active:scale-[0.986] backdrop-blur-[28px]",
      active
        ? "border-[rgba(196,177,122,0.48)] bg-[linear-gradient(180deg,rgba(232,228,208,0.15),rgba(42,34,28,0.15)_45%,rgba(7,8,18,0.55))] shadow-[0_0_24px_rgba(196,177,122,0.13),0_18px_48px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.14)]"
        : tone === "accent"
          ? "border-[rgba(225,230,255,0.12)] bg-[linear-gradient(180deg,rgba(238,241,255,0.075),rgba(20,20,34,0.42))] hover:border-[rgba(196,177,122,0.3)] hover:bg-[rgba(238,241,255,0.095)]"
          : "border-[rgba(225,230,255,0.12)] bg-[linear-gradient(180deg,rgba(238,241,255,0.075),rgba(20,20,34,0.42))] hover:border-[rgba(196,177,122,0.3)] hover:bg-[rgba(238,241,255,0.095)]",
    ),
  labelBadge: (tone: "idle" | "progress" | "done" = "idle") =>
    cx(
      "rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
      tone === "done"
        ? "border-[rgba(240,238,244,0.22)] text-[var(--text-primary)]"
        : tone === "progress"
          ? "border-[rgba(255,255,255,0.18)] text-[var(--text-primary)]"
          : "border-[rgba(255,255,255,0.08)] text-[var(--text-tertiary)]",
    ),
  headerNavLink: (active: boolean) =>
    cx(
      "border-b px-0 pb-1 pt-1 transition",
      active
        ? "border-[var(--accent-gold)] text-[var(--text-primary)]"
        : "border-transparent hover:border-[var(--accent-gold-dim)] hover:text-[var(--text-primary)]",
    ),
  immersiveTopBar:
    "postmodern-topbar sticky top-0 z-30 flex items-center gap-2.5 px-0 py-1 benyuan-safe-inset",
  immersiveBackLink:
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(225,230,255,0.13)] bg-[rgba(9,10,22,0.54)] text-[var(--text-primary)] shadow-[0_14px_42px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[28px] transition duration-150 active:translate-y-px active:scale-[0.985]",
  immersiveTopMeta: "min-w-0 flex-1 pb-1",
  immersiveTopLabel: "text-[9px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]",
  immersiveTopTitle: "mb-1 text-[11px] font-medium tracking-[0.01em] text-[var(--text-secondary)] md:text-[12px]",
  immersiveTopProgressText: "text-[10px] tracking-[0.14em] text-[var(--text-secondary)]",
  collapsiblePanel:
    "overflow-hidden rounded-[2.1rem] border border-[var(--border)] bg-[var(--surface-glass)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-[22px]",
} as const;
