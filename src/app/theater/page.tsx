import { Suspense } from "react";
import { BenyuanTheaterExperience } from "@/components/benyuan-theater-experience";
import { ImmersivePassiveState, PageScaffold } from "@/components/framework-primitives";

function TheaterFallback() {
  return (
    <ImmersivePassiveState
      backHref="/collect"
      topProgressValue={24}
      eyebrow="剧场装载"
      title="剧场就位"
      description="场景一旦抵达，就直接进入第一幕。"
    />
  );
}

export default function TheaterPage() {
  return (
    <PageScaffold phase="theater">
      <Suspense fallback={<TheaterFallback />}>
        <BenyuanTheaterExperience />
      </Suspense>
    </PageScaffold>
  );
}
