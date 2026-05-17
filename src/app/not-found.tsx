import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.3em] text-amber-200/70 uppercase">not found</p>
      <h1 className="mt-4 text-5xl text-stone-100">这份画像还没有准备好</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-stone-300">你可以回到官网，或者重新进入完整测试流程。</p>
      <div className="mt-8 flex gap-4">
        <Link href="/" className="rounded-full bg-[linear-gradient(135deg,#d9b98d,#b28763)] px-5 py-3 text-stone-950">
          回到官网
        </Link>
        <Link href="/collect" className="rounded-full border border-white/10 px-5 py-3 text-stone-100">
          完整测试
        </Link>
      </div>
    </main>
  );
}
