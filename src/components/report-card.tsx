import type { ReactNode } from "react";

export function ReportCard({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.013))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl md:p-9">
      <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(185,215,246,0.1),transparent_70%)] blur-3xl" />
      {eyebrow ? <p className="relative mb-3 text-[11px] tracking-[0.42em] text-stone-500 uppercase">{eyebrow}</p> : null}
      <h2 className="relative mb-5 max-w-3xl text-2xl leading-[1.32] text-stone-100 md:text-3xl">{title}</h2>
      <div className="relative space-y-4 text-base leading-8 text-stone-300/82">{children}</div>
    </section>
  );
}
