import { GlassPanel, MetaPill } from "@/components/framework-primitives";
import type { BenyuanQuestion } from "@/lib/benyuan-v3-types";

export function BenyuanQuestionCard({ question }: { question: BenyuanQuestion }) {
  return (
    <GlassPanel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.32em] text-stone-400 uppercase">{question.module} / {question.kind}</p>
          <h3 className="mt-2 text-xl text-stone-50">{question.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.minSelections ? <MetaPill>至少 {question.minSelections} 个</MetaPill> : null}
          {question.maxSelections ? <MetaPill>最多 {question.maxSelections} 个</MetaPill> : null}
          {question.uploadRange ? <MetaPill>{question.uploadRange.min}-{question.uploadRange.max} 张</MetaPill> : null}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-stone-300/84">{question.prompt}</p>
      {question.helperText ? <p className="mt-3 text-sm leading-7 text-stone-400/90">{question.helperText}</p> : null}

      {question.options?.length ? (
        <div className="mt-5 grid gap-3">
          {question.options.map((option) => (
            <div key={option.id} className="rounded-[1.25rem] border border-white/8 bg-black/10 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <MetaPill>{option.id}</MetaPill>
                {option.tags?.slice(0, 3).map((tag) => <MetaPill key={tag}>{tag}</MetaPill>)}
              </div>
              <p className="mt-3 text-sm leading-7 text-stone-100/92">{option.text}</p>
              {option.psychologicalSignal ? <p className="mt-2 text-sm leading-7 text-stone-400/90">{option.psychologicalSignal}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {question.distributionKeys?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {question.distributionKeys.map((item) => (
            <MetaPill key={item.key}>{item.label}</MetaPill>
          ))}
        </div>
      ) : null}

      {question.analysisDimensions?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {question.analysisDimensions.map((item) => (
            <MetaPill key={item}>{item}</MetaPill>
          ))}
        </div>
      ) : null}
    </GlassPanel>
  );
}
