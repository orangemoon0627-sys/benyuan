import { BenyuanPart1Workflow } from "@/components/benyuan-part1-workflow";
import { PageScaffold, SecondaryLink } from "@/components/framework-primitives";
import { getLatestBenyuanDemoLinks } from "@/lib/benyuan-v3-demo-links-server";

type CollectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectPage({ searchParams }: CollectPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const showAuxiliaryPanels = resolvedSearchParams.debug === "1";
  const demoLinks = showAuxiliaryPanels ? await getLatestBenyuanDemoLinks() : undefined;

  return (
    <PageScaffold phase="collect">
      {showAuxiliaryPanels ? (
        <div className="flex justify-end">
          <SecondaryLink href="/lab/status#debug-routes">返回调试入口</SecondaryLink>
        </div>
      ) : null}
      <BenyuanPart1Workflow demoLinks={demoLinks} showAuxiliaryPanels={showAuxiliaryPanels} />
    </PageScaffold>
  );
}
