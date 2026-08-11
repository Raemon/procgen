import assert from 'node:assert';
import { test } from 'node:test';
import {
  preloadPersistedFiles,
  readPersistedFile,
} from '@/features/app-shell/persistence/repoFileStore';

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
      await preloadPersistedFiles(['pipeline']);
      assert.equal(attempts, 2);
      assert.deepEqual(readPersistedFile('pipeline'), { seed: 42 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
