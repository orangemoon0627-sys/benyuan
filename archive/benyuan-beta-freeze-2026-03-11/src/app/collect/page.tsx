import { BenyuanPart1Workflow } from "@/components/benyuan-part1-workflow";
import { FrameworkPage, PrimaryLink, SecondaryLink } from "@/components/framework-primitives";
import { getLatestBenyuanDemoLinks } from "@/lib/benyuan-v3-demo-links-server";

export default async function CollectPage() {
  const demoLinks = await getLatestBenyuanDemoLinks();

  return (
    <FrameworkPage
      eyebrow="Part 1 · 特征数据收集"
      title="先把审美、哲学与生命叙事，一题一题交给黑暗。"
      description="现在 Part 1 已经收束成单题采集流：A / B / C 三组模块逐题推进，测试包、上传与真实 API 前置链路都并到同一个入口。"
      actions={
        <>
          <PrimaryLink href="/collect/a">只看模块 A</PrimaryLink>
          <SecondaryLink href={demoLinks[0]?.constellationHref ?? "/constellation?constellation_id=const_qaub8gcl"}>直达演示星图</SecondaryLink>
        </>
      }
    >
      <BenyuanPart1Workflow demoLinks={demoLinks} />
    </FrameworkPage>
  );
}
