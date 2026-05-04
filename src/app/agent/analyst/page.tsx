import { FrameworkPage, GlassPanel, MetaPill, PrimaryLink, SecondaryLink, SectionTitle } from "@/components/framework-primitives";
import { ANALYST_SYSTEM_PROMPT } from "@/lib/benyuan-v3-prompts";
import { analystSteps } from "@/lib/benyuan-framework";

const outputs = [
  "精神原型识别 + visual_prompt",
  "七维雷达图数据与解释文本",
  "700-900 字 narrative_overview",
  "1-2 个核心张力 + growth_direction",
  "3-5 条成长建议",
  "书籍 / 电影 / 音乐推荐",
];

export default function AnalystAgentPage() {
  return (
    <FrameworkPage
      eyebrow="AI Agent 2 · 精神分析师"
      title="Agent 2 现在也已经接上 prompt、runtime_override 和 constellation 生成接口。"
      description="它会整合 Part 1、Part 2 和行为元数据，按你文档里的 7 步分析流，输出 psyche_constellation。"
      actions={
        <>
          <PrimaryLink href="/constellation">进入 Part 3 呈现</PrimaryLink>
          <SecondaryLink href="/api/constellation/generate">查看生成接口</SecondaryLink>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr]">
        <GlassPanel>
          <SectionTitle label="Input" title="输入结构" description="Agent 2 输入的是完整上下文，而不是单一问卷答案。" />
          <div className="flex flex-wrap gap-2">
            <MetaPill>part1_data</MetaPill>
            <MetaPill>act2_choices</MetaPill>
            <MetaPill>act3_mirror_responses</MetaPill>
            <MetaPill>hesitation_patterns</MetaPill>
            <MetaPill>device</MetaPill>
            <MetaPill>total_time</MetaPill>
          </div>
          <div className="mt-6 space-y-3 text-sm leading-7 text-stone-300/84">
            {outputs.map((output) => (
              <div key={output} className="rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3">
                {output}
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionTitle label="Pipeline" title="7 步分析流" description="把 prompt 里的推理链拆成可实现的分析层，方便后续继续增强。" />
          <ul className="space-y-3 text-sm leading-7 text-stone-300/84">
            {analystSteps.map((step) => (
              <li key={step} className="rounded-2xl border border-white/6 bg-black/10 px-4 py-3">
                {step}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <MetaPill>POST /api/constellation/generate</MetaPill>
            <MetaPill>GET /api/constellation/[id]</MetaPill>
            <MetaPill>runtime_override</MetaPill>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <SectionTitle label="Prompt" title="精神分析师 Prompt 已接入代码" description="这里展示当前系统 prompt 的核心约束；实际完整 prompt 在 benyuan-v3-prompts.ts 中。" />
        <pre className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-xs leading-6 text-stone-300/88">{ANALYST_SYSTEM_PROMPT.slice(0, 2200)}</pre>
      </GlassPanel>

      <GlassPanel className="border-dashed">
        <SectionTitle label="Schema" title="psyche_constellation 骨架" description="Part 3 直接消费这个结构。" />
        <pre className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-xs leading-6 text-stone-300/88">{`{
  "psyche_constellation": {
    "user_id": "usr_xxx",
    "generated_at": "2026-03-09T19:50:00Z",
    "archetype": { ... },
    "seven_dimensions": { ... },
    "narrative_overview": "...",
    "core_tensions": [ ... ],
    "growth_suggestions": [ ... ],
    "recommendations": { ... }
  }
}`}</pre>
      </GlassPanel>
    </FrameworkPage>
  );
}
