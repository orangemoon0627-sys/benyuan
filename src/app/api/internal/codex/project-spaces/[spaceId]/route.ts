import { NextResponse } from "next/server";
import { getProjectSpaceManifest } from "@/lib/codex-platform/project-manifests";
import { getProjectSpaceById } from "@/lib/codex-platform/project-spaces";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const projectSpace = getProjectSpaceById(spaceId);
  const manifest = getProjectSpaceManifest(spaceId);

  if (!projectSpace || !manifest) {
    return NextResponse.json({ error: "project_space_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    projectSpace,
    manifest,
  });
}
