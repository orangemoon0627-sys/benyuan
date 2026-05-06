import Link from "next/link";
import type { ReactNode } from "react";

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
    <main className="relative min-h-screen overflow-hidden px-5 py-8 text-[var(--text-primary)] md:px-8 md:py-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.09),transparent_24%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
        <section className="border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.005))] px-6 py-8 md:px-10 md:py-12">
          <div className="h-px w-16 bg-[var(--accent-gold)]" />
          <p className="mt-6 text-[11px] uppercase tracking-[0.38em] text-[var(--text-tertiary)]">{eyebrow}</p>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-[2.5rem] leading-[1.08] text-[var(--text-primary)] md:text-[3.6rem] lg:text-[4.4rem]">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}

export function GlassPanel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`border border-[var(--border)] bg-[rgba(255,255,255,0.012)] px-5 py-6 md:px-7 md:py-7 ${className}`}>{children}</section>;
}

export function SectionTitle({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--text-tertiary)]">{label}</p>
      <h2 className="text-[1.9rem] leading-[1.16] text-[var(--text-primary)] md:text-[2.6rem]">{title}</h2>
      {description ? <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">{description}</p> : null}
    </div>
  );
}

export function MetaPill({ children }: { children: ReactNode }) {
  return <span className="border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-xs text-[var(--text-secondary)]">{children}</span>;
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center border border-[var(--accent-gold)] bg-[var(--accent-gold)] px-5 py-3 text-sm font-medium text-black transition hover:shadow-[0_0_24px_var(--glow)] hover:brightness-105"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center border border-[var(--border)] bg-transparent px-5 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent-gold-dim)] hover:bg-[rgba(212,175,55,0.06)] hover:text-[var(--text-primary)]"
    >
      {children}
    </Link>
  );
}
