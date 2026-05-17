"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

const immersiveRoutes = ["/collect", "/processing/benyuan", "/theater", "/constellation"];
const platformRoutes = ["/codex", "/workspace"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader =
    pathname !== "/" &&
    pathname !== "/about" &&
    pathname !== "/legacy" &&
    !immersiveRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) &&
    !platformRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <>
      {showHeader ? <SiteHeader /> : null}
      {children}
    </>
  );
}
