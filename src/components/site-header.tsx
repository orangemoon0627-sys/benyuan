"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { benyuanUiRecipes } from "@/config/benyuan-ui-recipes";

const links = [
  { href: "/", label: "官网" },
  { href: "/collect", label: "完整测试" },
  { href: "/constellation", label: "精神星图" },
  { href: "/about", label: "下载" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={benyuanUiRecipes.header}>
      <div className={benyuanUiRecipes.headerWrap}>
        <Link href="/" className={benyuanUiRecipes.headerBrand}>
          本源
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
