import { CodexPlatformEntry } from "@/components/codex-platform-entry";

export const dynamic = "force-dynamic";

export default async function CodexPage() {
  return <CodexPlatformEntry focusSpaceId="codex" mode="shadow" />;
}
