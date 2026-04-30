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
      description="结果一旦返回，原型会直接出现。"
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
