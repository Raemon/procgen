import '@/features/asset-library/worlds/nodes';
import { initStore } from '@/infrastructure/server/persistence/db';
import { saveDoc } from '@/infrastructure/server/persistence/docsRepo';
import { exampleWorldSeeds } from '@/features/asset-library/worlds/seeds/exampleWorldSeeds';

const wanted = process.env.WORLD_SEED ?? '';
const store = await initStore(process.env.DATABASE_URL ?? null);
const held = await readWorldSeeds();
const yours = storedSeeds(held);
const hidden = hiddenExamples(held);
const shipped = exampleWorldSeeds().map((world) => world.name);

if (wanted === '') {
  console.log('Name the world to restore, as in: WORLD_SEED="sunken labyrinth" npm run worldseed:restore');
  console.log(`  worlds that ship with the editor: ${shipped.join(', ')}`);
  console.log(`  ones your library has written over: ${listed(shipped.filter(isYours))}`);
  console.log(`  ones your library has taken off the shelf: ${listed(shipped.filter(isHidden))}`);
} else if (!shipped.includes(wanted)) {
  console.log(`'${wanted}' is not a world that ships with the editor, so there is nothing to restore it to.`);
  console.log(`  the shipped worlds are: ${shipped.join(', ')}`);
} else if (!isYours(wanted) && !isHidden(wanted)) {
  console.log(`'${wanted}' is already on the shelf as it ships — nothing to put back.`);
} else {
  await saveDoc(store, 'worldSeeds', {
    seeds: yours.filter((seed) => nameOf(seed) !== wanted),
    hiddenExamples: hidden.filter((name) => name !== wanted),
  });
  console.log(`Dropped your '${wanted}' and put the shipped one back on the shelf.`);
  console.log('  Saved worlds grown from it are untouched — each keeps its own copy of the pipeline.');
}

await store.disconnect();

function isYours(name: string): boolean {
  return yours.some((seed) => nameOf(seed) === name);
}

function isHidden(name: string): boolean {
  return hidden.includes(name);
}

async function readWorldSeeds(): Promise<unknown> {
  const rows = (await store.prisma?.doc.findMany()) ?? [];
  return rows.find((row) => row.name === 'worldSeeds')?.json ?? null;
}

function storedSeeds(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const held = (raw ?? {}) as { seeds?: unknown; presets?: unknown };
  if (Array.isArray(held.seeds)) return held.seeds;
  return Array.isArray(held.presets) ? held.presets : [];
}

function hiddenExamples(raw: unknown): string[] {
  const held = (raw ?? {}) as { hiddenExamples?: unknown };
  if (!Array.isArray(held.hiddenExamples)) return [];
  return held.hiddenExamples.filter((name): name is string => typeof name === 'string');
}

function nameOf(seed: unknown): string | undefined {
  if (typeof seed !== 'object' || seed === null) return undefined;
  const named = (seed as { name?: unknown }).name;
  return typeof named === 'string' ? named : undefined;
}

function listed(names: readonly string[]): string {
  return names.length === 0 ? 'none' : names.join(', ');
}
