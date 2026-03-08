"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";

type ReadingPathItem = {
  id: string;
  label: string;
};

export function ReportReadingPath({ items, mode = "immersive" }: { items: ReadingPathItem[]; mode?: "immersive" | "evidence" }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    const sections = itemIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visibleEntries[0]?.target instanceof HTMLElement) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -58% 0px",
        threshold: [0.15, 0.3, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [itemIds]);

  return (
    <>
      <p className="text-[11px] tracking-[0.42em] text-stone-500 uppercase">reading path</p>
      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const active = item.id === activeId;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={`group flex min-h-11 items-center justify-between rounded-full px-4 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100/40 ${
                active
                  ? mode === "evidence"
                    ? "bg-[linear-gradient(135deg,rgba(216,235,255,0.22),rgba(189,218,255,0.14))] text-sky-100 translate-x-1 shadow-[0_0_0_1px_rgba(189,218,255,0.22)]"
                    : "bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(192,220,249,0.84))] text-[#0b0d14] translate-x-1"
                  : "bg-white/[0.025] text-stone-400 hover:bg-white/[0.06] hover:text-stone-100 hover:translate-x-1"
              }`}
            >
              <span>{item.label}</span>
              <ArrowUpRight
                className={`h-4 w-4 -rotate-45 transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                strokeWidth={1.4}
              />
            </a>
          );
        })}
      </nav>
      <div className="mt-10 h-px w-24 bg-gradient-to-r from-sky-100/50 to-white/0" />
      <p className="mt-8 max-w-xs text-sm leading-7 text-stone-500">
        {mode === "evidence"
          ? "当前高亮会跟随你的滚动位置更新。证据模式默认把推理链条放到前景，方便你核对每一段判断的来源。"
          : "这份结果把结论、线索和边界说明都放在一起。你可以把它当成一条阅读河流，而不是一组一次看完就结束的卡片。"}
      </p>
    </>
  );
}
