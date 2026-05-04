import { Suspense } from "react";
import { GlassPanel, SectionTitle } from "@/components/framework-primitives";
import { NativeHandoffSmoke } from "@/components/native-handoff-smoke";

function SmokeFallback() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
      <GlassPanel>
        <SectionTitle label="Native Handoff Smoke" title="正在准备模拟器 smoke 页面..." />
      </GlassPanel>
    </div>
  );
}

export default function NativeHandoffSmokePage() {
  return (
    <Suspense fallback={<SmokeFallback />}>
      <NativeHandoffSmoke />
    </Suspense>
  );
}
