"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCcw, Sparkles } from "lucide-react";

const phases = [
  {
    title: "捕捉审美回声",
    body: "先从你反复停留的作品、氛围与语言里，提取那些更像精神指纹的部分。",
  },
  {
    title: "校准情绪气候",
    body: "再把那些情绪节律、停顿方式与自我保护动作放到同一张气候图里。",
  },
  {
    title: "缝合时间线索",
    body: "最后让过去、现在与未来彼此对照，拼成一张暂时可读的地形图。",
  },
] as const;

const statusLabel: Record<string, string> = {
  queued: "已进入雾面缓冲层",
  running: "正在潜入",
  done: "即将显影",
  failed: "这次潜入被打断了",
};

const statusBody: Record<string, string> = {
  queued: "分析已经排进当前序列。系统会先稳住你的线索，再开始真正的整理。",
  running: "现在不是在算分，而是在让回答之间彼此照面，看它们能否组成一张更像你的图。",
  done: "线索已经接近完成，马上会把这次潜入带回到一份可阅读的结果里。",
  failed: "你的输入没有丢失，只是这次显影过程没有顺利走完。你可以重新发起一次。",
};

export default function ProcessingPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [status, setStatus] = useState("queued");
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (error || status === "done") return;

    const timer = window.setInterval(() => {
      setActivePhase((value) => (value + 1) % phases.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [error, status]);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function start() {
      try {
        setError(null);
        setStatus("queued");
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: params.sessionId }),
        });
        const data = (await response.json()) as { jobId: string; status: string };
        if (!active) return;
        setStatus(data.status);

        timer = window.setInterval(async () => {
          const poll = await fetch(`/api/analysis/${data.jobId}`);
          const result = (await poll.json()) as { status: string };
          if (!active) return;
          setStatus(result.status);
          if (result.status === "done") {
            window.clearInterval(timer);
            router.replace(`/report/${params.sessionId}`);
          }
          if (result.status === "failed") {
            window.clearInterval(timer);
            setError("这次整理你的线索时出现了中断。我们会保留这次输入，你可以重新发起分析。");
          }
        }, 900);
      } catch {
        setError("分析流程没有成功启动，请稍后重试。");
        setStatus("failed");
      }
    }

    start();

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [params.sessionId, retryKey, router]);

  const currentStatusLabel = statusLabel[status] ?? status;
  const currentStatusBody = statusBody[status] ?? statusBody.running;
  const phaseEyebrow = useMemo(() => `phase 0${activePhase + 1}`, [activePhase]);

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#08080a] px-6 py-16 text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(190,221,255,0.16),transparent_18%),radial-gradient(circle_at_18%_62%,rgba(109,80,131,0.12),transparent_24%),radial-gradient(circle_at_82%_58%,rgba(95,118,168,0.12),transparent_28%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-30" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(185,215,246,0.22),rgba(128,154,204,0.1)_34%,transparent_70%)] blur-3xl"
        animate={{ opacity: [0.28, 0.5, 0.28], scale: [1, 1.11, 1] }}
        transition={{ duration: 6.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[28%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(139,112,169,0.16),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.22, 0.34, 0.22], y: [0, -12, 0] }}
        transition={{ duration: 8.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl flex-col items-center justify-center">
        <motion.p
          className="text-center text-[11px] tracking-[0.48em] text-stone-500 uppercase"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          processing / ritual state
        </motion.p>
        <motion.h1
          className="mt-5 max-w-4xl text-center text-4xl leading-[1.14] text-stone-100 md:text-6xl lg:text-[4.4rem]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          正在把这次回答，
          <br className="hidden md:block" />
          缓慢显影成一张可阅读的图。
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-center text-base leading-8 text-stone-300/76 md:text-lg"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          这里没有算分提示，也没有被催促的倒计时。它更像一段短暂潜水：先沉进雾里，再把你的审美、情绪与时间感轻轻带上来。
        </motion.p>

        <motion.div
          className="mt-12 w-full overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016))] p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl md:p-9"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.95, delay: 0.28 }}
        >
          <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] tracking-[0.24em] text-stone-300 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                {currentStatusLabel}
              </div>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-200/86">{currentStatusBody}</p>

              <div className="mt-8 flex items-center gap-4">
                {phases.map((phase, index) => {
                  const active = index === activePhase && !error;

                  return (
                    <div key={phase.title} className="flex items-center gap-4">
                      <motion.div
                        className={`h-2.5 w-2.5 rounded-full ${active ? "bg-sky-100" : "bg-white/20"}`}
                        animate={active ? { opacity: [0.38, 1, 0.38], scale: [0.92, 1.18, 0.92] } : { opacity: 0.3, scale: 1 }}
                        transition={{ duration: 1.8, repeat: active ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
                      />
                      {index < phases.length - 1 ? <div className="h-px w-10 bg-white/10 md:w-16" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] bg-black/18 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <p className="text-[11px] tracking-[0.28em] text-stone-500 uppercase">{phaseEyebrow}</p>
              <h2 className="mt-3 text-2xl leading-[1.24] text-stone-100">{phases[activePhase].title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300/78">{phases[activePhase].body}</p>
              <p className="mt-5 text-xs tracking-[0.28em] text-stone-500 uppercase">job status · {status}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {phases.map((phase, index) => {
              const active = index === activePhase && !error;
              return (
                <motion.div
                  key={phase.title}
                  className={`rounded-[24px] px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${active ? "bg-[linear-gradient(135deg,rgba(232,243,255,0.12),rgba(167,193,228,0.08))]" : "bg-black/16"}`}
                  animate={active ? { y: [0, -4, 0], opacity: [0.72, 1, 0.72] } : { y: 0, opacity: 0.72 }}
                  transition={{ duration: 2.4, repeat: active ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
                >
                  <p className="text-[11px] tracking-[0.22em] text-stone-500 uppercase">phase {index + 1}</p>
                  <p className="mt-2 text-base leading-7 text-stone-200/84">{phase.title}</p>
                </motion.div>
              );
            })}
          </div>

          {error ? (
            <div className="mt-8 flex flex-col gap-4 rounded-[28px] bg-[rgba(255,238,238,0.04)] p-5 shadow-[0_0_0_1px_rgba(251,113,133,0.12)] md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-rose-200/70 uppercase">fallback path</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-200/86">{error}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRetryKey((value) => value + 1)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(192,220,249,0.92))] px-5 py-3 text-sm tracking-[0.18em] text-[#0b0d14] uppercase transition hover:scale-[1.01]"
                >
                  <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />
                  重试分析
                </button>
                <Link
                  href="/test"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm tracking-[0.18em] text-stone-300 uppercase transition hover:text-stone-100"
                >
                  回到问题流
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
                </Link>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </main>
  );
}
