import assert from 'node:assert/strict';
import test from 'node:test';

import { GET as getWorkspaceSectionRoute } from '../../app/api/internal/codex/project-spaces/[spaceId]/sections/[sectionId]/route';

import { getProjectSpaceManifest } from './project-manifests';
import { getWorkspaceSectionResponse } from './project-space-adapters';

test('benyuan manifest exposes overview-first sections and compatibility links', () => {
  const manifest = getProjectSpaceManifest('benyuan');

  assert.ok(manifest);
  assert.equal(manifest?.defaultSection, 'overview');

  const schemaWorkbench = manifest?.workbenches.find((workbench) => workbench.sectionId === 'schema');
  assert.ok(schemaWorkbench);
  assert.equal(schemaWorkbench?.href, '/workspace/benyuan/schema');
  assert.equal(schemaWorkbench?.compatibilityHref, '/lab/schema');
  assert.equal(schemaWorkbench?.status, 'active');
});

test('tradewise manifest exposes review and delivery workspace sections', () => {
  const manifest = getProjectSpaceManifest('tradewise');

  assert.ok(manifest);
  assert.equal(manifest?.defaultSection, 'overview');

  const reviewWorkbench = manifest?.workbenches.find((workbench) => workbench.sectionId === 'review');
  const deliveryWorkbench = manifest?.workbenches.find((workbench) => workbench.sectionId === 'delivery');

  assert.ok(reviewWorkbench);
  assert.equal(reviewWorkbench?.href, '/workspace/tradewise/review');
  assert.equal(reviewWorkbench?.status, 'active');
  assert.ok(deliveryWorkbench);
  assert.equal(deliveryWorkbench?.compatibilityHref, '/lab/release-chain');
});

test('benyuan schema section adapter returns non-empty workspace payload', async () => {
  const response = await getWorkspaceSectionResponse('benyuan', 'schema');

  assert.ok(response);
  assert.equal(response?.spaceId, 'benyuan');
  assert.equal(response?.sectionId, 'schema');
  assert.ok(response?.panels.length);
  assert.ok(response?.compatibility.some((link) => link.href === '/lab/schema'));
});

test('tradewise review section adapter exposes contract and runtime links', async () => {
  const response = await getWorkspaceSectionResponse('tradewise', 'review');

  assert.ok(response);
  assert.equal(response?.spaceId, 'tradewise');
  assert.equal(response?.sectionId, 'review');
  assert.ok(response?.links.some((link) => link.href === '/api/tradewise/review/generate'));
  assert.ok(response?.panels.some((panel) => panel.records.length > 0));
});

test('workspace section api returns section data for valid requests', async () => {
  const response = await getWorkspaceSectionRoute(new Request('http://localhost/api/internal/codex/project-spaces/benyuan/sections/schema'), {
    params: Promise.resolve({
      spaceId: 'benyuan',
      sectionId: 'schema',
    }),
  });

  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    spaceId: string;
    sectionId: string;
    title: string;
  };

  assert.equal(payload.spaceId, 'benyuan');
  assert.equal(payload.sectionId, 'schema');
  assert.match(payload.title, /schema|题库/i);
});

test('workspace section api rejects unknown section ids', async () => {
  const response = await getWorkspaceSectionRoute(new Request('http://localhost/api/internal/codex/project-spaces/tradewise/sections/unknown'), {
    params: Promise.resolve({
      spaceId: 'tradewise',
      sectionId: 'unknown',
    }),
  });

  assert.equal(response.status, 404);
});
