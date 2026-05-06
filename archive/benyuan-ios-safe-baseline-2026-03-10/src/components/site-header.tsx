"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/collect", label: "Part 1" },
  { href: "/theater", label: "Part 2" },
  { href: "/constellation", label: "Part 3" },
  { href: "/legacy", label: "Legacy" },
  { href: "/about", label: "方法边界" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(0,0,0,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <Link href="/" className="text-sm uppercase tracking-[0.45em] text-[var(--text-primary)] transition hover:text-[var(--accent-gold)]">
          本源 v3
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] md:justify-end">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/collect" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-b px-0 pb-1 pt-1 transition ${active ? "border-[var(--accent-gold)] text-[var(--text-primary)]" : "border-transparent hover:border-[var(--accent-gold-dim)] hover:text-[var(--text-primary)]"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
