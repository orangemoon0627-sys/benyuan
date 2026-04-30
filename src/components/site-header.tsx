"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { benyuanUiRecipes } from "@/config/benyuan-ui-recipes";
import { getBenyuanShellInfo } from "@/lib/benyuan-native-shell";

const productLinks = [
  { href: "/collect", label: "显影" },
  { href: "/theater", label: "剧场" },
  { href: "/constellation", label: "星图" },
];

const routeMeta = [
  {
    test: (pathname: string) => pathname.startsWith("/collect"),
    title: "显影",
    subtitle: "先只面对一个问题，再进入下一扇门。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/processing/benyuan"),
    title: "显影中",
    subtitle: "等待不是停住，而是结果尚未显形。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/theater"),
    title: "剧场",
    subtitle: "每个场景都源自你的线索，每次选择都会留下回声。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/constellation"),
    title: "星图",
    subtitle: "原型、结构、张力与回响在这里收束。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/lab/native-handoff"),
    title: "原生交接",
    subtitle: "iOS shell、桥接能力与真机验收都在这里对齐。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/lab/status"),
    title: "项目状态",
    subtitle: "freeze、回归、真机与 pilot readiness 的唯一事实来源。",
  },
  {
    test: (pathname: string) => pathname.startsWith("/lab"),
    title: "内部面板",
    subtitle: "调试入口、状态映射与交付材料集中在这里。",
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const shellInfo = getBenyuanShellInfo();

  const activeRouteMeta = routeMeta.find((item) => item.test(pathname)) ?? {
    title: "本源",
    subtitle: "当前是一套共享的正式 beta 界面，由 Web 主流程与 iOS shell 共同承接。",
  };
  const shellPlatform = shellInfo?.platform ?? null;
  const inShell = Boolean(shellPlatform);
  const labLink =
    pathname.startsWith("/lab/native-handoff")
      ? { href: "/lab/native-handoff", label: "交接" }
      : pathname.startsWith("/lab")
        ? { href: "/lab/status", label: "状态" }
        : null;
  const primaryLinks = labLink ? [...productLinks, labLink] : productLinks;
  const showShellMeta = Boolean(inShell && labLink);

  if (inShell) {
    return (
      <header className={benyuanUiRecipes.shellHeader}>
        <div className={benyuanUiRecipes.shellHeaderWrap}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={benyuanUiRecipes.shellHeaderEyebrow}>本源</p>
              <p className="mt-2 text-[var(--text-primary)]">
                <span className={benyuanUiRecipes.shellHeaderTitle}>{activeRouteMeta.title}</span>
              </p>
              <p className={benyuanUiRecipes.shellHeaderSubtitle}>{activeRouteMeta.subtitle}</p>
            </div>
            {showShellMeta ? <span className={benyuanUiRecipes.shellHeaderMeta}>{shellPlatform}</span> : null}
          </div>
          <nav className={benyuanUiRecipes.shellSegmentedNav(primaryLinks.length)}>
            {primaryLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/collect" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={benyuanUiRecipes.shellSegmentLink(active)} data-benyuan-pressable="true">
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={benyuanUiRecipes.header}>
      <div className={benyuanUiRecipes.headerWrap}>
        <Link href="/legacy" className={benyuanUiRecipes.headerBrand}>
          本源 v3
        </Link>
        <nav className={benyuanUiRecipes.headerNav}>
          {primaryLinks.map((link) => {
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
