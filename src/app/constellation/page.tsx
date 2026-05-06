import { Suspense } from "react";
import { BenyuanConstellationView } from "@/components/benyuan-constellation-view";
import { ImmersivePassiveState, PageScaffold } from "@/components/framework-primitives";

function ConstellationFallback() {
  return (
    <ImmersivePassiveState
      backHref="/theater"
      topProgressValue={84}
      eyebrow="星图装载"
      title="星图显形"
      description="原型一旦显形，就直接抵达这一页。"
    />
  );
}

export default function ConstellationPage() {
  return (
    <PageScaffold phase="constellation">
      <Suspense fallback={<ConstellationFallback />}>
        <BenyuanConstellationView />
      </Suspense>
    </PageScaffold>
  );
}
