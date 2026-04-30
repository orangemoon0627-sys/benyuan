import { BenyuanPart1Workflow } from "@/components/benyuan-part1-workflow";
import { PageScaffold, SecondaryLink } from "@/components/framework-primitives";

type CollectModulePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectCPage({ searchParams }: CollectModulePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  return (
    <PageScaffold>
      <div className="flex justify-end">
        <SecondaryLink href="/lab/status#debug-routes">返回调试入口</SecondaryLink>
      </div>
      <BenyuanPart1Workflow moduleFilter="C" showAuxiliaryPanels={resolvedSearchParams.debug === "1"} />
    </PageScaffold>
  );
}
