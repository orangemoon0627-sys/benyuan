import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "本源 | 深度精神探索系统 v3",
  description: "一个以审美、叙事、剧场与精神星图为主线的深度精神探索系统。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
