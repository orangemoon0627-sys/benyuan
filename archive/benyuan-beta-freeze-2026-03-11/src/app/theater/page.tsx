import { Suspense } from "react";
import { BenyuanTheaterExperience } from "@/components/benyuan-theater-experience";
import { FrameworkPage, GlassPanel, PrimaryLink, SecondaryLink, SectionTitle } from "@/components/framework-primitives";

function TheaterFallback() {
  return (
    <GlassPanel>
      <SectionTitle label="剧场装载" title="导演脚本正在调入。" description="如果上一幕已经完成，专属脚本会在这里接住你。" />
    </GlassPanel>
  );
}

export default function TheaterPage() {
  return (
    <FrameworkPage
      eyebrow="Part 2 · 剧场模式体验"
      title="让每一次选择都像一次对话，而不是一次提交。"
      description="剧场会直接读取导演 Agent 生成的三幕脚本，记录你的行动、犹豫与镜像回答，并把这些轨迹继续送回同一条分析链路。"
      actions={
        <>
          <PrimaryLink href="/collect">重新开始 Part 1</PrimaryLink>
          <SecondaryLink href="/constellation">查看 Part 3</SecondaryLink>
        </>
      }
    >
      <Suspense fallback={<TheaterFallback />}>
        <BenyuanTheaterExperience />
      </Suspense>
    </FrameworkPage>
  );
}
