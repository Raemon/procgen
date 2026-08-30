import assert from 'node:assert';
import { test } from 'node:test';
import {
  preloadPersistedDocuments,
  readPersistedDocument,
} from '@/features/app-shell/persistence/persistedDocumentStore';
import { persistedDocumentIsValid } from '@/features/app-shell/api/persistedDocumentValidation';

export function bootstrapPersistenceTests(): void {
  test('a server restart during bootstrap is retried instead of hanging', async () => {
    const originalFetch = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;
      if (attempts < 2) throw new TypeError('server restarting');
      return Response.json({ data: { seed: 42 }, revision: '7' }, { headers: { ETag: '"7"' } });
    };
    try {
      await preloadPersistedDocuments(['pipeline']);
      assert.equal(attempts, 2);
      assert.deepEqual(readPersistedDocument('pipeline'), { seed: 42 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  test('the world seed library is accepted as the envelope the browser writes and as the bare array older databases hold', () => {
    assert.ok(persistedDocumentIsValid('worldSeeds', { presets: [], hiddenExamples: [] }));
    assert.ok(persistedDocumentIsValid('worldSeeds', []));
    assert.ok(persistedDocumentIsValid('templates', { templates: [], hiddenBuiltIns: [] }));
    assert.ok(!persistedDocumentIsValid('worldSeeds', 'islands'));
    assert.ok(!persistedDocumentIsValid('tiles', { presets: [] }));
  });
}
