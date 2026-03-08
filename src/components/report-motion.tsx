"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MotionRevealProps = {
  children?: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: number;
  duration?: number;
};

export function MotionReveal({
  children,
  className,
  delay = 0,
  y = 24,
  blur = 10,
  duration = 0.7,
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

type MotionFloatProps = {
  children?: ReactNode;
  className?: string;
  delay?: number;
};

export function MotionFloat({ children, className, delay = 0 }: MotionFloatProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 7.5, delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
