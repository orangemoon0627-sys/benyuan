import Link from "next/link";
import { labRouteMeta } from "@/lib/lab-route-meta";

const defaultLabLinks = [
  { href: "/lab", label: "overview" },
  ...labRouteMeta.map((item) => ({
    href: item.href,
    label: item.href === "/lab/board" ? "board" : item.href.replace("/lab/", ""),
  })),
] as const;

export function InternalLabNav({
  current,
  className = "",
}: {
  current: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">lab routes</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {defaultLabLinks.map((link) => {
          const active = current === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                active
                  ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.17),rgba(167,193,228,0.11))] text-stone-100 shadow-[0_0_0_1px_rgba(216,232,255,0.18)]"
                  : "bg-white/[0.03] text-stone-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-white/[0.05] hover:text-stone-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
