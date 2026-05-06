"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { benyuanUiRecipes } from "@/config/benyuan-ui-recipes";

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
    <header className={benyuanUiRecipes.header}>
      <div className={benyuanUiRecipes.headerWrap}>
        <Link href="/" className={benyuanUiRecipes.headerBrand}>
          本源 v3
        </Link>
        <nav className={benyuanUiRecipes.headerNav}>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/collect" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={benyuanUiRecipes.headerNavLink(active)}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
