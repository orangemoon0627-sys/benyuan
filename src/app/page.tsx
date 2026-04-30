import { OriginLanding } from "@/components/origin-landing";
import { CodexPlatformEntry } from "@/components/codex-platform-entry";
import { resolveCodexPlatformConfig, resolveHomeExperience } from "@/lib/codex-platform/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const experience = resolveHomeExperience(resolveCodexPlatformConfig());

  if (experience === "codex") {
    return <CodexPlatformEntry focusSpaceId="codex" mode="takeover" />;
  }

  return <OriginLanding />;
}
