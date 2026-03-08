import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(8,8,10,0.72)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="text-sm tracking-[0.38em] text-stone-200/92 uppercase transition hover:text-white">
          本源
        </Link>
        <nav className="flex items-center gap-5 text-sm text-stone-400/88">
          <Link href="/about" className="transition hover:text-stone-100">
            方法边界
          </Link>
          <Link href="/test" className="rounded-full bg-white/[0.03] px-4 py-2 text-stone-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_rgba(216,232,255,0.16)]">
            开始体验
          </Link>
        </nav>
      </div>
    </header>
  );
}
