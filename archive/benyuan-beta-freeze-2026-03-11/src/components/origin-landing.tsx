"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const HOLD_MS = 3000;
const TRANSITION_MS = 3200;

const particles = Array.from({ length: 28 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 28;
  const radius = 34 + (index % 4) * 12;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const delay = (index % 7) * 0.08;
  return { id: index, x, y, delay };
});

export function OriginLanding() {
  const router = useRouter();
  const rafRef = useRef<number | null>(null);
  const pressStartRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "pressing" | "awakening">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== "awakening") return;
    const timer = window.setTimeout(() => router.push("/collect"), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, router]);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function stopLoop() {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function resetPress() {
    stopLoop();
    pressStartRef.current = null;
    setPhase("idle");
    setProgress(0);
  }

  function beginAwakening() {
    stopLoop();
    pressStartRef.current = null;
    setProgress(1);
    setPhase("awakening");
  }

  function tick(now: number) {
    if (pressStartRef.current === null) return;
    const next = Math.min(1, (now - pressStartRef.current) / HOLD_MS);
    setProgress(next);
    if (next >= 1) {
      beginAwakening();
      return;
    }
    rafRef.current = window.requestAnimationFrame(tick);
  }

  function handlePressStart() {
    if (phase === "awakening") return;
    stopLoop();
    const now = performance.now();
    pressStartRef.current = now;
    setPhase("pressing");
    setProgress(0);
    rafRef.current = window.requestAnimationFrame(tick);
  }

  function handlePressEnd() {
    if (phase !== "pressing") return;
    resetPress();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-void)] text-[var(--text-primary)]">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_32%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          animate={phase === "awakening" ? { opacity: 0, scale: 0.94 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col items-center"
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(212,175,55,0.24)]"
            animate={phase === "pressing" ? { scale: 1 + progress * 2.2, opacity: 0.8 - progress * 0.8 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.12, ease: "linear" }}
          />
          <div className="mb-8 h-px w-16 bg-[var(--accent-gold)]" />
          <h1 className="text-[3.5rem] font-light tracking-[0.18em] text-[var(--text-primary)] md:text-[4.6rem]">本源</h1>
          <p className="mt-4 text-[12px] tracking-[0.42em] text-[var(--text-tertiary)]">THE ORIGIN</p>

          <button
            type="button"
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onPointerCancel={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className="mt-20 min-h-11 min-w-[220px] border border-[var(--border)] px-8 py-4 text-sm tracking-[0.22em] text-[var(--text-secondary)] transition hover:border-[var(--accent-gold-dim)] hover:text-[var(--text-primary)]"
          >
            {phase === "pressing" ? `继续按住 ${Math.max(0, Math.ceil((1 - progress) * 3))}s` : "[ 长按开始探索 ]"}
          </button>

          <div className="mt-6 h-px w-[220px] overflow-hidden bg-[rgba(255,255,255,0.08)]">
            <motion.div
              className="h-full bg-[var(--accent-gold)]"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.08, ease: "linear" }}
            />
          </div>
        </motion.div>

        {phase === "awakening" ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative h-72 w-72 md:h-96 md:w-96">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--accent-gold)] shadow-[0_0_12px_var(--glow)]"
                  initial={{ x: particle.x * 5.5, y: particle.y * 5.5, opacity: 0, scale: 0.7 }}
                  animate={{ x: particle.x, y: particle.y, opacity: [0, 1, 0.9], scale: [0.7, 1.1, 1] }}
                  transition={{ duration: 2.4, delay: particle.delay, ease: [0.25, 0.1, 0.25, 1] }}
                />
              ))}
              <motion.div
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-gold)] shadow-[0_0_24px_var(--glow)]"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.2, 1], opacity: [0, 1, 0.9] }}
                transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <motion.p
              className="mt-4 text-sm tracking-[0.28em] text-[var(--text-secondary)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              正在唤醒你的星图...
            </motion.p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
