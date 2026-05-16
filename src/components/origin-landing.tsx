"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/framework-primitives";
import { ensureBenyuanWebAuthState } from "@/lib/benyuan-v3-client-session";

const TRANSITION_MS = 780;

export function OriginLanding() {
  const router = useRouter();
  const [awakening, setAwakening] = useState(false);
  const [entryLabel, setEntryLabel] = useState("开始探索");

  async function enterWebTest() {
    if (awakening) return;
    setAwakening(true);
    setEntryLabel("正在进入");

    try {
      await ensureBenyuanWebAuthState();
      window.setTimeout(() => router.push("/collect"), TRANSITION_MS);
    } catch {
      setEntryLabel("访客预览");
      window.setTimeout(() => router.push("/collect"), TRANSITION_MS);
    }
  }

  return (
    <main className="generative-page postmodern-landing benyuan-web-home benyuan-mainflow relative min-h-screen min-h-dvh overflow-hidden px-6 text-[var(--text-primary)]">
      <div className="postmodern-cosmic-field pointer-events-none absolute inset-0" />
      <div className="postmodern-landing__ghost" aria-hidden>
        本源
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[calc(100vw_-_3rem)] flex-col justify-between pb-[calc(1.25rem_+_env(safe-area-inset-bottom))] pt-[calc(1.15rem_+_env(safe-area-inset-top))] md:max-w-[34rem]">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(246,247,252,0.68)]">
          <span>本源</span>
          <span className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.055)] px-3 py-2 backdrop-blur-[24px]">Web 测试</span>
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
              <h1 className="mt-4 flex flex-col text-[5.65rem] font-black leading-[0.88] tracking-[0em] text-[var(--text-primary)] md:text-[7rem]">
                <span>本</span>
                <span>源</span>
              </h1>
            </div>
            <div className="postmodern-home-orbit-label" aria-hidden>
              <span />
            </div>
          </div>

          <p className="mt-8 max-w-[21rem] whitespace-pre-line text-[1.18rem] font-semibold leading-9 text-[rgba(250,250,255,0.9)]">
            其实在宇宙大爆炸的那一瞬间，{"\n"}你就已经诞生了
          </p>
        </motion.div>

        <div className="benyuan-home-dock grid gap-3">
          <PrimaryButton type="button" onClick={() => void enterWebTest()} disabled={awakening} className="w-full justify-center pr-16">
            {awakening ? entryLabel : "开始探索"}
          </PrimaryButton>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void enterWebTest()} disabled={awakening} className="benyuan-web-auth-pill">
              访客预览
            </button>
            <button type="button" onClick={() => void enterWebTest()} disabled={awakening} className="benyuan-web-auth-pill">
              网页测试
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
