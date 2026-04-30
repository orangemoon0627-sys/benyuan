import { NextResponse } from 'next/server';

import { getWorkspaceSectionResponse } from '@/lib/codex-platform/project-space-adapters';

export const dynamic = 'force-dynamic';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ spaceId: string; sectionId: string }> },
) {
  const { spaceId, sectionId } = await params;
  const response = await getWorkspaceSectionResponse(spaceId, sectionId);

  if (!response) {
    return NextResponse.json({ error: 'workspace_section_not_found' }, { status: 404 });
  }

  return NextResponse.json(response);
}
