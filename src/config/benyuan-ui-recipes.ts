export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const benyuanUiRecipes = {
  pageShell:
    "generative-page relative min-h-dvh overflow-hidden bg-[var(--void-black)] px-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-[calc(0.7rem+env(safe-area-inset-top))] text-[var(--text-primary)] sm:px-6 md:px-8",
  pageAura:
    "cosmic-field pointer-events-none absolute inset-0",
  pageContent: "relative mx-auto flex w-full max-w-[31rem] flex-col gap-3 md:max-w-[38rem] md:gap-4",
  heroPanel:
    "relative overflow-hidden rounded-[2.6rem] border border-[rgba(255,255,255,0.09)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-7 shadow-[0_34px_110px_rgba(0,0,0,0.48),0_0_42px_rgba(212,175,55,0.08)] backdrop-blur-[34px] md:px-8 md:py-9",
  heroSplit: "grid gap-6 xl:grid-cols-[1.06fr_0.94fr] xl:items-end",
  heroSummaryCard:
    "rounded-[1.75rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-6",
  glassPanel:
    "relative overflow-hidden rounded-[2.15rem] border border-[rgba(247,244,236,0.13)] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(20,16,30,0.48)_46%,rgba(0,0,0,0.3))] px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.5),0_0_42px_rgba(127,106,168,0.1),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[34px] md:px-7 md:py-7",
  sectionPanel:
    "rounded-[2rem] border border-[rgba(247,244,236,0.12)] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(21,17,31,0.38)_58%,rgba(0,0,0,0.2))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_52px_rgba(0,0,0,0.3)] backdrop-blur-[28px]",
  accentPanel:
    "rounded-[2rem] border border-[rgba(231,194,122,0.22)] bg-[linear-gradient(145deg,rgba(231,194,122,0.12),rgba(183,173,216,0.08)_44%,rgba(255,255,255,0.035))] shadow-[0_28px_90px_rgba(0,0,0,0.42),0_0_34px_rgba(231,194,122,0.12)] backdrop-blur-[28px]",
  heroAccentPanel:
    "overflow-hidden rounded-[2.7rem] border border-[rgba(247,244,236,0.12)] bg-[radial-gradient(circle_at_50%_8%,rgba(216,204,255,0.18),transparent_24%),radial-gradient(circle_at_50%_78%,rgba(231,194,122,0.2),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(20,16,30,0.34)_46%,rgba(0,0,0,0.82)_100%)] shadow-[0_42px_120px_rgba(0,0,0,0.62),0_0_64px_rgba(127,106,168,0.14),inset_0_1px_0_rgba(255,255,255,0.13)] backdrop-blur-[36px]",
  stagePanel:
    "overflow-hidden rounded-[2.45rem] border border-[rgba(247,244,236,0.12)] bg-[linear-gradient(150deg,rgba(255,255,255,0.065),rgba(21,17,31,0.44)_52%,rgba(0,0,0,0.46))] shadow-[0_30px_96px_rgba(0,0,0,0.48),0_0_42px_rgba(127,106,168,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[34px]",
  sectionEyebrow: "text-[11px] uppercase tracking-[0.32em] text-[var(--text-tertiary)]",
  sectionTitle: "text-[1.7rem] leading-[1.06] text-[var(--text-primary)] md:text-[2.5rem]",
  bodyCopy: "text-sm leading-7 text-[var(--text-secondary)] md:text-base",
  metaPill:
    "inline-flex min-h-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)] backdrop-blur-xl",
  primaryLink:
    "inline-flex min-h-[3.8rem] select-none items-center justify-center gap-2 rounded-full border border-[rgba(255,255,255,0.72)] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.82),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(232,228,217,0.94)_45%,rgba(231,194,122,0.86))] px-8 py-4 text-[15px] font-black tracking-[-0.02em] text-black shadow-[0_18px_44px_rgba(247,244,236,0.2),0_0_42px_rgba(231,194,122,0.26),inset_0_1px_0_rgba(255,255,255,0.78)] transition duration-150 will-change-transform hover:shadow-[0_22px_52px_rgba(247,244,236,0.24),0_0_50px_rgba(231,194,122,0.3)] hover:brightness-105 active:translate-y-px active:scale-[0.982]",
  secondaryLink:
    "inline-flex min-h-[3.75rem] select-none items-center justify-center gap-2 rounded-full border border-[rgba(247,244,236,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(21,17,31,0.34))] px-6 py-4 text-[15px] tracking-[0.01em] text-[var(--text-primary)] shadow-[0_16px_34px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-150 will-change-transform hover:border-[rgba(216,204,255,0.24)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(127,106,168,0.08))] hover:text-[var(--text-primary)] active:translate-y-px active:scale-[0.985] backdrop-blur-[28px]",
  input:
    "min-h-12 rounded-[1.35rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] backdrop-blur-[22px]",
  header: "sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(0,0,0,0.92)] backdrop-blur-xl",
  headerWrap: "mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8",
  headerBrand: "text-sm uppercase tracking-[0.45em] text-[var(--text-primary)] transition hover:text-[var(--accent-gold)]",
  headerNav: "flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] md:justify-end",
  shellHeader:
    "sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.94)] backdrop-blur-2xl benyuan-safe-top benyuan-safe-inset",
  shellHeaderWrap: "mx-auto flex max-w-6xl flex-col gap-4 pb-3 pt-3",
  shellHeaderEyebrow: "text-[11px] uppercase tracking-[0.36em] text-[var(--accent-gold)]",
  shellHeaderTitle: "text-lg font-medium tracking-[-0.03em] text-[var(--text-primary)] md:text-xl",
  shellHeaderSubtitle: "text-xs leading-6 text-[var(--text-secondary)] md:text-sm",
  shellHeaderMeta:
    "inline-flex min-h-8 items-center justify-center rounded-full border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--accent-gold)]",
  shellSegmentedNav: (columns: number) =>
    cx(
      "grid min-h-12 gap-2 rounded-[1.25rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
      columns <= 3 ? "grid-cols-3" : columns === 4 ? "grid-cols-4" : "grid-cols-5",
    ),
  shellSegmentLink: (active: boolean) =>
    cx(
      "inline-flex min-h-11 select-none items-center justify-center rounded-[1rem] px-3 py-2 text-sm uppercase tracking-[0.08em] transition duration-150 will-change-transform active:translate-y-px active:scale-[0.985]",
      active
        ? "border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.12)] text-[var(--text-primary)] shadow-[0_0_18px_rgba(212,175,55,0.08)]"
        : "border border-transparent text-[var(--text-secondary)] hover:border-[rgba(212,175,55,0.16)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]",
    ),
  progressTrack: "h-[2px] overflow-hidden rounded-full bg-[rgba(247,244,236,0.16)] shadow-[0_0_18px_rgba(247,244,236,0.08)]",
  progressFill: "h-full rounded-full bg-[linear-gradient(90deg,rgba(231,194,122,0.76),rgba(247,244,236,0.96),rgba(231,194,122,0.92))] shadow-[0_0_18px_rgba(247,244,236,0.46)]",
  immersiveFlow: "mx-auto flex w-full max-w-[42rem] flex-col gap-4 md:gap-5",
  immersiveFlowNarrow: "mx-auto flex w-full max-w-[32rem] flex-col gap-4 md:max-w-[36rem] md:gap-5",
  immersiveFocusFrame:
    "rounded-[2.55rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.02))] px-5 py-7 shadow-[0_28px_96px_rgba(0,0,0,0.42),0_0_36px_rgba(212,175,55,0.08)] backdrop-blur-[30px] md:px-8 md:py-9",
  passiveStateFrame: "relative mx-auto flex min-h-[74vh] max-w-[24rem] flex-col items-center justify-center text-center md:max-w-[30rem]",
  passiveStateEyebrow: "text-[10px] uppercase tracking-[0.28em] text-[var(--text-tertiary)]",
  passiveStateTitle: "mt-8 text-[3.35rem] font-black leading-[0.9] tracking-[-0.08em] text-[var(--text-primary)] drop-shadow-[0_0_24px_rgba(247,244,236,0.14)] md:text-[5rem]",
  passiveStateBody: "mt-4 max-w-[30rem] text-[1rem] leading-7 text-[var(--text-secondary)] md:text-[1.05rem] md:leading-8",
  passiveStateMeter:
    "mt-10 w-full max-w-[21rem] text-center md:max-w-[23rem]",
  passiveStateActions: "mt-10 flex flex-wrap items-center justify-center gap-3",
  microSwitchRail:
    "mx-auto inline-flex min-h-9 items-center gap-1 rounded-full border border-[rgba(247,244,236,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(21,17,31,0.38))] p-1 shadow-[0_8px_22px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[24px]",
  microSwitchButton: (tone: "idle" | "active" | "done" = "idle") =>
    cx(
      "inline-flex min-h-6 min-w-[2.1rem] items-center justify-center rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] transition duration-150 will-change-transform active:translate-y-px active:scale-[0.985]",
      tone === "active"
        ? "bg-[linear-gradient(180deg,rgba(247,244,236,0.18),rgba(231,194,122,0.11))] text-[var(--text-primary)] shadow-[0_0_18px_rgba(247,244,236,0.12)]"
        : tone === "done"
          ? "bg-[rgba(255,255,255,0.05)] text-[var(--accent-gold)]"
          : "text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]",
    ),
  thumbnailRail: "flex gap-3 overflow-x-auto pb-1 benyuan-safe-inset",
  thumbnailCard:
    "w-[7.25rem] shrink-0 overflow-hidden rounded-[1.55rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-2.5 backdrop-blur-xl",
  stickySubnav:
    "sticky top-[calc(var(--space-3)+env(safe-area-inset-top))] z-10 overflow-hidden rounded-[1.4rem] border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.82)] backdrop-blur-2xl",
  anchorRail: "overflow-x-auto benyuan-safe-inset benyuan-safe-bottom",
  anchorRailWrap: "flex min-w-max items-center gap-3 pr-2 text-sm text-[var(--text-secondary)]",
  anchorLink:
    "inline-flex min-h-11 select-none items-center justify-center rounded-full border border-transparent px-3 py-2 text-sm tracking-[0.04em] text-[var(--text-secondary)] transition duration-150 will-change-transform hover:border-[rgba(212,175,55,0.24)] hover:bg-[rgba(212,175,55,0.06)] hover:text-[var(--text-primary)] active:translate-y-px active:scale-[0.985]",
  detailCard: "rounded-[1.6rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-xl",
  subtleCard: "rounded-[1.4rem] border border-[rgba(255,255,255,0.08)] bg-black/18 p-4 backdrop-blur-xl",
  accentCard: "rounded-[1.6rem] border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.06)] p-5 backdrop-blur-xl",
  ritualMeter:
    "grid gap-3 rounded-[1.6rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-xl md:grid-cols-3",
  ritualMeterItem: "flex flex-col gap-2 border-l border-[rgba(255,255,255,0.08)] pl-4 first:border-l-0 first:pl-0",
  stepRail: "flex flex-wrap gap-2",
  stepChip: (tone: "idle" | "active" | "done" = "idle") =>
    cx(
      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-[11px] tracking-[0.16em] transition duration-150",
      tone === "done"
        ? "border-[rgba(212,175,55,0.26)] bg-[rgba(212,175,55,0.08)] text-[var(--text-primary)]"
        : tone === "active"
          ? "border-[rgba(212,175,55,0.4)] bg-[rgba(212,175,55,0.12)] text-[var(--text-primary)] shadow-[0_0_18px_rgba(212,175,55,0.08)]"
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)]",
    ),
  bottomDock:
    "benyuan-safe-bottom sticky bottom-1 z-20 px-0 py-2 md:px-1",
  bottomDockLayout: "grid gap-4 md:grid-cols-[1fr_auto] md:items-center",
  bottomDockCompact: "grid gap-3 md:grid-cols-[1fr_auto] md:items-center",
  bottomDockMeta: "flex flex-wrap gap-2",
  statCard: (tone: "default" | "accent" | "active" = "default") =>
    cx(
      "rounded-[1.75rem] border px-4 py-4 backdrop-blur-[24px]",
      tone === "accent"
        ? "border-[rgba(212,175,55,0.18)] bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.02))] shadow-[0_0_28px_rgba(212,175,55,0.1)]"
        : tone === "active"
          ? "border-[var(--accent-gold)] bg-[rgba(212,175,55,0.1)] shadow-[0_0_24px_rgba(212,175,55,0.12)]"
          : "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    ),
  interactiveCard: (active = false, tone: "default" | "accent" = "default") =>
    cx(
      "w-full rounded-[2rem] border px-5 py-5 text-left shadow-[0_18px_42px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition duration-150 will-change-transform active:translate-y-[1px] active:scale-[0.986] backdrop-blur-[32px]",
      active
        ? "border-[rgba(231,194,122,0.72)] bg-[linear-gradient(135deg,rgba(247,244,236,0.14),rgba(231,194,122,0.18)_44%,rgba(20,16,30,0.42))] shadow-[0_0_48px_rgba(247,244,236,0.14),0_0_46px_rgba(231,194,122,0.2)]"
        : tone === "accent"
          ? "border-[rgba(247,244,236,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(21,17,31,0.42)_58%,rgba(0,0,0,0.22))] hover:border-[rgba(216,204,255,0.24)] hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(127,106,168,0.1))] hover:shadow-[0_0_30px_rgba(127,106,168,0.12)]"
          : "border-[var(--border)] bg-[rgba(255,255,255,0.05)] hover:border-[rgba(216,204,255,0.22)] hover:bg-[rgba(255,255,255,0.07)] hover:shadow-[0_0_26px_rgba(127,106,168,0.1)]",
    ),
  labelBadge: (tone: "idle" | "progress" | "done" = "idle") =>
    cx(
      "rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
      tone === "done"
        ? "border-[rgba(212,175,55,0.36)] text-[var(--accent-gold)]"
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
    "sticky top-0 z-30 flex items-center gap-3 px-0 py-1.5 benyuan-safe-inset",
  immersiveBackLink:
    "inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-primary)] drop-shadow-[0_0_10px_rgba(247,244,236,0.2)] transition duration-150 active:translate-y-px active:scale-[0.985]",
  immersiveTopMeta: "min-w-0 flex-1 pb-1",
  immersiveTopLabel: "text-[9px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]",
  immersiveTopTitle: "mb-1 text-[11px] font-medium tracking-[0.01em] text-[var(--text-secondary)] md:text-[12px]",
  immersiveTopProgressText: "text-[10px] tracking-[0.14em] text-[var(--text-secondary)]",
  collapsiblePanel:
    "overflow-hidden rounded-[2.4rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-[28px]",
} as const;
