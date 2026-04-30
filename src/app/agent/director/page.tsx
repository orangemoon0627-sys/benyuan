import { FrameworkPage, GlassPanel, MetaPill, PrimaryLink, SecondaryLink, SectionTitle } from "@/components/framework-primitives";
import { DIRECTOR_SYSTEM_PROMPT } from "@/lib/benyuan-v3-prompts";
import { directorOutputs } from "@/lib/benyuan-framework";

export default function DirectorAgentPage() {
  return (
    <FrameworkPage
      eyebrow="AI Agent 1 · 剧场导演"
      title="Agent 1 不再只是概念说明，而是已经接上 prompt、runtime_override 和生成接口。"
      description="剧场导演 Agent 会吃掉 Part 1 完整数据与多模态结果，输出 theater_script。当前页同步说明已接入的 prompt、输出结构与 live 运行方式。"
      actions={
        <>
          <PrimaryLink href="/theater">进入 Part 2 框架</PrimaryLink>
          <SecondaryLink href="/api/theater/generate">查看生成接口</SecondaryLink>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel>
          <SectionTitle label="Input" title="输入" description="Agent 1 的输入必须是 Part 1 完整数据，而不是零散答案。" />
          <div className="flex flex-wrap gap-2">
            <MetaPill>part1_data</MetaPill>
            <MetaPill>aggregated_traits</MetaPill>
            <MetaPill>music_analysis</MetaPill>
            <MetaPill>social_posts_analysis</MetaPill>
            <MetaPill>precious_photo_analysis</MetaPill>
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionTitle label="Runtime" title="运行机制" description="支持 runtime_override，可直接传 api_key / base_url / model / provider_name / reasoning_effort。" />
          <div className="flex flex-wrap gap-2">
            <MetaPill>POST /api/theater/generate</MetaPill>
            <MetaPill>runtime_override.live</MetaPill>
            <MetaPill>provider=crs</MetaPill>
            <MetaPill>model=gpt-5.4</MetaPill>
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionTitle label="Output" title="输出" description="输出结构化 JSON，让前端严格按场景与节点渲染。" />
          <ul className="space-y-3 text-sm leading-7 text-stone-300/84">
            {directorOutputs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel>
        <SectionTitle label="Prompt" title="剧场导演 Prompt 已接入代码" description="这里展示当前系统 prompt 的核心约束；实际完整 prompt 在 benyuan-v3-prompts.ts 中。" />
        <pre className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-xs leading-6 text-stone-300/88">{DIRECTOR_SYSTEM_PROMPT.slice(0, 1800)}</pre>
      </GlassPanel>

      <GlassPanel className="border-dashed">
        <SectionTitle label="Schema" title="theater_script 骨架" description="现在这个结构已经由 API 和 deterministic fallback 共用。" />
        <pre className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-xs leading-6 text-stone-300/88">{`{
  "theater_script": {
    "user_id": "usr_xxx",
    "generated_at": "2026-03-09T19:30:00Z",
    "personalization_summary": { ... },
    "act1": { ... },
    "act2": { "choices": [ ... ] },
    "act3": { "mirror_questions": [ ... ] },
    "epilogue": { ... }
  }
}`}</pre>
      </GlassPanel>
    </FrameworkPage>
  );
}
