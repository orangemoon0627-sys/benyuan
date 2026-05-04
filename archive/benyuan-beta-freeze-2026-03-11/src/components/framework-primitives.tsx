import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
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
          <div className="h-px w-16 bg-[var(--accent-gold)]" />
          <p className={cx("mt-6", benyuanUiRecipes.sectionEyebrow)}>{eyebrow}</p>
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
  return <section className={cx(benyuanUiRecipes.glassPanel, className)}>{children}</section>;
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

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={benyuanUiRecipes.primaryLink}>
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={benyuanUiRecipes.secondaryLink}>
      {children}
    </Link>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cx(benyuanUiRecipes.primaryLink, className)}>
      {children}
    </button>
  );
}

export function SecondaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button {...props} className={cx(benyuanUiRecipes.secondaryLink, className)}>
      {children}
    </button>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(benyuanUiRecipes.input, props.className)} />;
}
