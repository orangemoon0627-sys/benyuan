import { notFound } from 'next/navigation';

import { ProjectSpaceWorkspace } from '@/components/project-space-workspace';
import { buildCodexPlatformBootstrap } from '@/lib/codex-platform/bootstrap';
import { getProjectSpaceManifest } from '@/lib/codex-platform/project-manifests';
import { getProjectSpaceById } from '@/lib/codex-platform/project-spaces';
import type { WorkspaceSectionId } from '@/lib/codex-platform/types';

export const dynamic = 'force-dynamic';

type WorkspaceSectionPageProps = {
  params: Promise<{ spaceId: string; sectionId: string }>;
};

export default async function WorkspaceSectionPage({ params }: WorkspaceSectionPageProps) {
  const { spaceId, sectionId } = await params;
  const projectSpace = getProjectSpaceById(spaceId);
  const manifest = getProjectSpaceManifest(spaceId);

  if (!projectSpace || !manifest) {
    notFound();
  }

  const sectionExists = manifest.workbenches.some((workbench) => workbench.sectionId === sectionId);
  if (!sectionExists) {
    notFound();
  }

  const bootstrap = await buildCodexPlatformBootstrap();

  return (
    <ProjectSpaceWorkspace
      projectSpace={projectSpace}
      manifest={manifest}
      sectionId={sectionId as WorkspaceSectionId}
      runtime={{
        toolCalls: bootstrap.toolCalls,
        agentRuns: bootstrap.agentRuns,
        permissions: bootstrap.permissions,
        events: bootstrap.runtimeEvents,
      }}
    />
  );
}
