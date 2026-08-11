import { existsSync, readFileSync } from 'node:fs';
import { initStore } from '../server/persistence/db';
import { PERSISTED_DOC_NAMES, saveDoc } from '../server/persistence/docsRepo';

const store = await initStore(process.env.DATABASE_URL ?? null);
for (const name of PERSISTED_DOC_NAMES) await seedOne(name);
await store.disconnect();

async function seedOne(name: string): Promise<void> {
  const json = dataFileContentOf(name);
  if (json === undefined) return console.log(`  skipped ${name}: no data/${name}.json in the repo`);
  await saveDoc(store, name, json);
  console.log(`  seeded ${name} from data/${name}.json`);
}

function dataFileContentOf(name: string): unknown {
  const path = `data/${name}.json`;
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8'));
}
