import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';
import assert from 'node:assert';
import { test } from 'node:test';
import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';
import { setProcessServices } from '@/infrastructure/server/processServices';
import type { ProcgenServices } from '@/infrastructure/server/procgenServices';

export function routeHandlerTests(): void {
  test('persistent resources validate JSON and enforce ETag revisions', async () => {
    let data: unknown = [{ id: 1 }];
    let revision = 0;
    const changed: string[] = [];
    const docs = {
      read: () => data,
      revision: () => String(revision),
      stamp: () => String(revision),
      write: (_name: string, next: unknown) => {
        data = next;
        revision += 1;
      },
      writeIfCurrent: (_name: string, expected: string, next: unknown) => {
        if (expected !== String(revision)) return null;
        data = next;
        revision += 1;
        return String(revision);
      },
    };
    setProcessServices({
      docs,
      documentChanged: (name: PersistedDocumentName) => {
        changed.push(name);
      },
    } as unknown as ProcgenServices);
    const route = persistedDocumentRoute('tiles');

    const initial = route.GET();
    assert.equal(initial.status, 200);
    assert.equal(initial.headers.get('etag'), '"0"');

    const missingRevision = await route.PUT(jsonRequest([{ id: 2 }]));
    assert.equal(missingRevision.status, 428);

    const malformed = await route.PUT(new Request('http://local', {
      method: 'PUT',
      headers: { 'If-Match': '"0"', 'Content-Type': 'application/json' },
      body: '{',
    }));
    assert.equal(malformed.status, 400);

    const wrongShape = await route.PUT(jsonRequest({ id: 2 }, '"0"'));
    assert.equal(wrongShape.status, 422);

    const updated = await route.PUT(jsonRequest([{ id: 2 }], '"0"'));
    assert.equal(updated.status, 200);
    assert.equal(updated.headers.get('etag'), '"1"');
    assert.deepEqual(changed, ['tiles']);

    const stale = await route.PUT(jsonRequest([{ id: 3 }], '"0"'));
    assert.equal(stale.status, 412);
    assert.deepEqual(data, [{ id: 2 }]);
  });
}

function jsonRequest(body: unknown, revision?: string): Request {
  return new Request('http://local', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(revision ? { 'If-Match': revision } : {}),
    },
    body: JSON.stringify(body),
  });
}
