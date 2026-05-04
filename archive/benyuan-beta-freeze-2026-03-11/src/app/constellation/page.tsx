import { Suspense } from "react";
import { BenyuanConstellationView } from "@/components/benyuan-constellation-view";
import { FrameworkPage, GlassPanel, PrimaryLink, SecondaryLink, SectionTitle } from "@/components/framework-primitives";

function ConstellationFallback() {
  return (
    <GlassPanel>
      <SectionTitle label="星图装载" title="精神星图正在展开。" description="剧场结束后，这里会接住分析师 Agent 沿同一条链路送回的结果。" />
    </GlassPanel>
  );
}

export default function ConstellationPage() {
  return (
    <FrameworkPage
      eyebrow="Part 3 · 精神星图呈现"
      title="让原型、维度、张力与建议，在同一张星图里慢慢显影。"
      description="你在前两幕交出的所有线索，都会在这里沿着同一条分析链路折叠成精神原型、叙事总览、七维星图与后续建议。"
      actions={
        <>
          <PrimaryLink href="/collect">开始新的旅程</PrimaryLink>
          <SecondaryLink href="/theater">回到剧场</SecondaryLink>
        </>
      }
    >
      <Suspense fallback={<ConstellationFallback />}>
        <BenyuanConstellationView />
      </Suspense>
    </FrameworkPage>
  );
}
