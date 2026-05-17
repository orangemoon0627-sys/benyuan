"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";

const HOLD_DURATION_MS = 2000;
const CIRCLE_SIZE = 132;
const STROKE_WIDTH = 2;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const dimensions = [
  {
    label: "01 / aesthetic grammar",
    title: "你被什么打动，往往比你如何自我介绍，更接近真实。",
    description:
      "我们不先问你外向还是内向，而是先问：你会被怎样的夜色、怎样的句子、怎样的空房间击中。因为审美不是装饰，它更像你灵魂留下的指纹。",
  },
  {
    label: "02 / emotional climate",
    title: "情绪不是噪音，而是一种内部天气。",
    description:
      "有的人像骤雨，有的人像海潮，有的人像雾。你如何感受、如何命名、如何让情绪退去，本身就构成了你与世界接触的方式。",
  },
  {
    label: "03 / temporal philosophy",
    title: "你与过去、此刻、未来的关系，决定你如何安放自己。",
    description:
      "有些人被未来牵引，有些人总在回望，而有些人努力守住正在发生的这一秒。本源想整理的，不是答案，而是这些时间线索之间的张力。",
  },
];

const reportFragments = [
  "一段足够像你的精神地形总览",
  "三组连续谱维度解读，而不是僵硬标签",
  "两组内在张力，让复杂性被看见",
  "一个可保存的精神原型名称",
];

export function LandingSequence() {
  const router = useRouter();
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const progress = useMotionValue(0);
  const easedProgress = useSpring(progress, { stiffness: 120, damping: 24, mass: 0.7 });
  const ringOffset = useTransform(easedProgress, (value) => CIRCUMFERENCE * (1 - value));
  const mistScale = useTransform(easedProgress, [0, 1], [1, 1.45]);
  const mistOpacity = useTransform(easedProgress, [0, 1], [0.28, 0.58]);
  const textBlur = useTransform(easedProgress, [0, 1], [0, 8]);
  const subtitleOpacity = useTransform(easedProgress, [0, 1], [0.84, 0.34]);
  const textBlurFilter = useMotionTemplate`blur(${textBlur}px)`;

  useEffect(() => {
    if (!hasCompleted) return;

    const timer = window.setTimeout(() => {
      router.push("/collect");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [hasCompleted, router]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function stopLoop() {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
  }

  function resetHold() {
    stopLoop();
    setIsHolding(false);
    progress.set(0);
  }

  function runFrame(timestamp: number) {
    if (startRef.current === null) {
      startRef.current = timestamp;
    }

    const elapsed = timestamp - startRef.current;
    const next = Math.min(elapsed / HOLD_DURATION_MS, 1);
    progress.set(next);

    if (next >= 1) {
      stopLoop();
      setIsHolding(false);
      setHasCompleted(true);
      return;
    }

    rafRef.current = window.requestAnimationFrame(runFrame);
  }

  function beginHold() {
    if (hasCompleted) return;
    stopLoop();
    setIsHolding(true);
    startRef.current = null;
    rafRef.current = window.requestAnimationFrame(runFrame);
  }

  function releaseHold() {
    if (hasCompleted) return;
    resetHold();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080a] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(83,111,171,0.14),transparent_22%),radial-gradient(circle_at_50%_54%,rgba(206,237,255,0.06),transparent_35%),radial-gradient(circle_at_78%_72%,rgba(86,115,176,0.08),transparent_26%)]" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-35" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(173,212,255,0.28)_0%,rgba(76,109,165,0.18)_28%,rgba(8,8,10,0)_72%)] blur-3xl"
        animate={{ opacity: [0.24, 0.36, 0.24] }}
        transition={{ duration: 6.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
        style={{ scale: mistScale, opacity: mistOpacity }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035] blur-2xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 8, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      <AnimatePresence>
        {hasCompleted ? (
          <motion.div
            key="success"
            className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,246,255,0.78),rgba(159,198,255,0.18)_28%,rgba(8,8,10,0)_62%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.18] }}
              transition={{ duration: 1.2, times: [0, 0.18, 1], ease: "easeOut" }}
            />
            <motion.div
              className="relative text-center"
              initial={{ y: 16, filter: "blur(12px)" }}
              animate={{ y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[11px] tracking-[0.65em] text-sky-100/70 uppercase">transition</p>
              <h1 className="mt-5 text-4xl tracking-[0.18em] text-white/92 md:text-6xl">正在潜入...</h1>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          style={{ filter: textBlurFilter }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <motion.p
            className="mx-auto max-w-4xl text-4xl leading-[1.35] text-stone-100/92 md:text-6xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            你不是被定义的，而是被理解的。
          </motion.p>
          <motion.div
            className="mt-5 flex items-center justify-center gap-3 text-[11px] tracking-[0.44em] text-stone-300/80 uppercase md:text-xs"
            style={{ opacity: subtitleOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 1.1 }}
          >
            <ArrowDown className="h-4 w-4" strokeWidth={1.2} />
            <span>长按以进入你的内在荒野</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            aria-label="长按进入本源"
            className="group relative flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-100/50 focus-visible:ring-offset-0"
            onPointerDown={beginHold}
            onPointerUp={releaseHold}
            onPointerLeave={releaseHold}
            onPointerCancel={releaseHold}
          >
            <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="overflow-visible">
              <circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="rgba(255,255,255,0.015)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={STROKE_WIDTH}
              />
              <motion.circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="transparent"
                stroke="rgba(214,235,255,0.95)"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                style={{ strokeDashoffset: ringOffset }}
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
            </svg>

            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-[26px] rounded-full bg-[radial-gradient(circle,rgba(188,221,255,0.18),rgba(188,221,255,0.02)_62%,transparent_80%)] blur-xl"
              animate={{ opacity: isHolding ? 0.95 : 0.42, scale: isHolding ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.4em] text-stone-200/70 uppercase">
              Hold
            </div>
          </button>

          <motion.p
            className="mt-5 text-[10px] tracking-[0.55em] text-stone-400/80 uppercase"
            animate={{ opacity: isHolding ? 0.12 : 0.8 }}
            transition={{ duration: 0.35 }}
          >
            按住 2 秒，让雾为你打开一条缝
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-stone-400/70"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 1.1 }}
        >
          <div className="text-[10px] tracking-[0.48em] uppercase">or drift downward</div>
          <div className="h-10 w-px bg-gradient-to-b from-white/0 via-white/25 to-white/0" />
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:pb-28 md:pt-20">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] tracking-[0.42em] text-stone-400/70 uppercase">what benyuan reads</p>
          <h2 className="mt-4 text-3xl leading-[1.35] text-stone-100/92 md:text-5xl">
            它不先问你像谁，
            <br className="hidden md:block" />
            而先问你会被什么光、什么句子、什么回声叫住。
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-stone-300/78 md:text-lg">
            本源不是人格分类器，而是一套更安静的阅读方法。它把你的审美、情绪与时间感当作三条发亮的线索，慢慢缝成一张精神地图。
          </p>
        </motion.div>

        <div className="mt-20 grid gap-16 md:gap-20">
          {dimensions.map((item, index) => (
            <motion.div
              key={item.label}
              className="grid gap-6 md:grid-cols-[0.42fr_0.58fr] md:gap-12"
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: 0.95, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <p className="text-[11px] tracking-[0.42em] text-stone-500 uppercase">{item.label}</p>
              </div>
              <div>
                <h3 className="max-w-2xl text-2xl leading-[1.45] text-stone-100/92 md:text-4xl">{item.title}</h3>
                <p className="mt-5 max-w-2xl text-base leading-8 text-stone-300/76 md:text-lg">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-28">
        <motion.div
          className="relative overflow-hidden rounded-[48px] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-7 py-10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl md:px-12 md:py-14"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pointer-events-none absolute inset-y-0 right-[-6%] w-[42%] bg-[radial-gradient(circle_at_center,rgba(189,218,255,0.12),transparent_64%)] blur-3xl" />
          <p className="relative text-[11px] tracking-[0.42em] text-stone-400/75 uppercase">what returns to you</p>
          <div className="relative mt-6 grid gap-7 md:grid-cols-[0.56fr_0.44fr] md:gap-10">
            <div>
              <h2 className="max-w-3xl text-3xl leading-[1.35] text-stone-100/92 md:text-5xl">
                你最终拿到的，不是一张类型卡，
                <br className="hidden md:block" />
                而是一份可以被保存的精神肖像初稿。
              </h2>
            </div>
            <div className="space-y-4 pt-1">
              {reportFragments.map((fragment) => (
                <div key={fragment} className="flex items-start gap-3 text-stone-300/80">
                  <div className="mt-3 h-px w-8 shrink-0 bg-gradient-to-r from-sky-100/70 to-white/0" />
                  <p className="text-base leading-8">{fragment}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-10 text-center md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] tracking-[0.42em] text-stone-500 uppercase">entry</p>
          <h2 className="mt-4 text-3xl leading-[1.38] text-stone-100/92 md:text-5xl">
            如果你愿意，
            <br className="hidden md:block" />
            现在就让它先读你一小段。
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-stone-300/74 md:text-lg">
            首次体验大约 10 分钟。你会经过完整测试，然后进入一份更像阅读而不是被评分的结果页。
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/collect"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(233,242,255,0.95),rgba(185,215,246,0.9))] px-7 py-3 text-sm tracking-[0.16em] text-[#0b0d14] uppercase transition hover:scale-[1.01]"
            >
              开始体验
            </Link>
            <Link
              href="/report/sess_sample_001"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-[0.16em] text-stone-300/88 uppercase transition hover:text-stone-100"
            >
              查看样例结果
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          </div>
          <p className="mt-8 text-sm leading-7 text-stone-500">
            本源是一种理解性镜像，不构成心理或医学诊断。
          </p>
        </motion.div>
      </section>
    </main>
  );
}
