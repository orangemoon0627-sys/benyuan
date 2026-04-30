import { buildCodexPlatformBootstrap } from "@/lib/codex-platform/bootstrap";
import { CodexPlatformShell } from "@/components/codex-platform-shell";

type CodexPlatformEntryProps = {
  focusSpaceId?: string;
  mode: "shadow" | "takeover";
};

export async function CodexPlatformEntry({ focusSpaceId = "codex", mode }: CodexPlatformEntryProps) {
  const bootstrap = await buildCodexPlatformBootstrap();

  return <CodexPlatformShell bootstrap={bootstrap} focusSpaceId={focusSpaceId} mode={mode} />;
}
