import { Suspense } from "react";
import { BenyuanProcessingRitual } from "@/components/benyuan-processing-ritual";
import { ImmersivePassiveState, PageScaffold } from "@/components/framework-primitives";

type ProcessingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function ProcessingFallback({ backHref }: { backHref: string }) {
  return (
    <ImmersivePassiveState
      backHref={backHref}
      topProgressValue={18}
      eyebrow="显影中"
      title="显影中"
      description="灵感正在浮现，完整画面即将呈现。"
    />
  );
}

export default async function BenyuanProcessingPage({ searchParams }: ProcessingPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const phase = resolvedSearchParams.phase === "constellation" ? "constellation" : "part1";
  const backHref = phase === "part1" ? "/collect" : "/theater";

  return (
    <PageScaffold phase="processing">
      <Suspense fallback={<ProcessingFallback backHref={backHref} />}>
        <BenyuanProcessingRitual />
      </Suspense>
    </PageScaffold>
  );
}
