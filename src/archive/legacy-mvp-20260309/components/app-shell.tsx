"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/";

  return (
    <>
      {showHeader ? <SiteHeader /> : null}
      {children}
    </>
  );
}
