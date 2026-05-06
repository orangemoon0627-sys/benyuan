"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/framework-primitives";

const TRANSITION_MS = 780;

export function OriginLanding() {
  const router = useRouter();
  const [awakening, setAwakening] = useState(false);

  useEffect(() => {
    if (!awakening) return;
    const timer = window.setTimeout(() => router.push("/collect"), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [awakening, router]);

  return (
    <main className="generative-page postmodern-landing benyuan-mainflow relative min-h-screen min-h-dvh overflow-hidden px-6 text-[var(--text-primary)]">
      <div className="postmodern-cosmic-field pointer-events-none absolute inset-0" />
      <div className="postmodern-landing__ghost" aria-hidden>
        本源
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[calc(100vw_-_3rem)] flex-col justify-between pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] pt-[calc(1.15rem_+_env(safe-area-inset-top))] md:max-w-[34rem]">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(246,247,252,0.72)]">
          <span>BENYUAN</span>
          <span className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.055)] px-3 py-2 backdrop-blur-[24px]">ORIGIN</span>
        </div>
        <motion.div
          animate={awakening ? { opacity: 0, y: -16, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-1 flex-col justify-center py-5"
        >
          <div className="pointer-events-none absolute left-1/2 top-[42%] -z-10 flex w-[118vw] -translate-x-1/2 justify-center" aria-hidden>
            <div className="postmodern-landing__moon" />
          </div>

          <div className="mt-8 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">心理自我探索应用</p>
              <h1 className="mt-4 flex flex-col text-[5.65rem] font-black leading-[0.88] tracking-[0em] text-[var(--text-primary)] md:text-[7rem]">
                <span>本</span>
                <span>源</span>
              </h1>
            </div>
            <p className="mt-12 max-w-[5.4rem] text-right text-[0.82rem] font-semibold leading-6 tracking-[0.08em] text-[rgba(246,247,252,0.72)] [writing-mode:vertical-rl]">
              回到本源 探索内在宇宙
            </p>
          </div>

          <p className="mt-8 max-w-[18rem] text-[1.06rem] font-semibold leading-8 text-[rgba(250,250,255,0.86)]">
            让问题、审美与选择在同一片黑月场里显影。
          </p>
          <div className="mt-6 grid max-w-[18rem] gap-2 text-[0.78rem] font-semibold leading-5 tracking-[0.08em] text-[rgba(246,247,252,0.52)]">
            <span>内在宇宙</span>
            <span>心理剧场</span>
            <span>星象映射</span>
          </div>
        </motion.div>

        <div className="grid gap-4">
          <PrimaryButton type="button" onClick={() => setAwakening(true)} disabled={awakening} className="w-full justify-center pr-16">
            {awakening ? "正在进入" : "开始探索"}
          </PrimaryButton>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(246,247,252,0.38)]">generative psyche interface</p>
        </div>
      </div>
    </main>
  );
}
