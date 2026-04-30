import { notFound } from 'next/navigation';

import { ProjectSpaceWorkspace } from '@/components/project-space-workspace';
import { buildCodexPlatformBootstrap } from '@/lib/codex-platform/bootstrap';
import { getProjectSpaceManifest } from '@/lib/codex-platform/project-manifests';
import { getProjectSpaceById } from '@/lib/codex-platform/project-spaces';

export const dynamic = 'force-dynamic';

type WorkspacePageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { spaceId } = await params;
  const projectSpace = getProjectSpaceById(spaceId);
  const manifest = getProjectSpaceManifest(spaceId);

  if (!projectSpace || !manifest) {
    notFound();
  }

  const bootstrap = await buildCodexPlatformBootstrap();

  return (
    <ProjectSpaceWorkspace
      projectSpace={projectSpace}
      manifest={manifest}
      sectionId={manifest.defaultSection}
      runtime={{
        toolCalls: bootstrap.toolCalls,
        agentRuns: bootstrap.agentRuns,
        permissions: bootstrap.permissions,
        events: bootstrap.runtimeEvents,
      }}
    />
  );
}
