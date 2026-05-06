import { Suspense } from "react";
import { BenyuanProcessingRitual } from "@/components/benyuan-processing-ritual";
import { FrameworkPage, GlassPanel, PrimaryLink, SecondaryLink, SectionTitle } from "@/components/framework-primitives";

function ProcessingFallback() {
  return (
    <GlassPanel>
      <SectionTitle label="Loading" title="显影层正在接管。" description="准备承接这一轮 Part 1 或 Part 2 的真实处理任务。" />
    </GlassPanel>
  );
}

export default function BenyuanProcessingPage() {
  return (
    <FrameworkPage
      eyebrow="Processing · Ritual State"
      title="把等待变成一条可被看见的显影轨迹。"
      description="这里会真实串起保存、分析、生成、写回与跳转，而不是只给你一个静止的 loading。"
      actions={
        <>
          <PrimaryLink href="/collect">返回 Part 1</PrimaryLink>
          <SecondaryLink href="/theater">查看 Part 2</SecondaryLink>
        </>
      }
    >
      <Suspense fallback={<ProcessingFallback />}>
        <BenyuanProcessingRitual />
      </Suspense>
    </FrameworkPage>
  );
}
