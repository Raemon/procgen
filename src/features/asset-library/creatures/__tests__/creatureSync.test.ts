import { readFileSync } from 'node:fs';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { creaturesFromStoredJson } from '../creatureStorage';
import { syncMissingCreatures } from '../creatureSync';

const GAUNT_ONE_NAME = 'gaunt one';

function shippedCreatures(): unknown {
  return JSON.parse(readFileSync('data/creatures.json', 'utf8'));
}

function namesOf(stored: unknown): string[] {
  return (creaturesFromStoredJson(stored) ?? []).map((creature) => creature.name);
}

export function checkCreatureSync(check: CheckReporter): void {
  const shipped = shippedCreatures();
  check(
    'the repo ships the gaunt one, so a library synced from it can bind a world to one',
    namesOf(shipped).includes(GAUNT_ONE_NAME),
  );
  const fresh = syncMissingCreatures(null, shipped);
  check(
    'a database holding no creatures at all is given every creature the repo ships',
    fresh.added === namesOf(shipped).length && namesOf(fresh.stored).includes(GAUNT_ONE_NAME),
  );
  const stale = (creaturesFromStoredJson(shipped) ?? []).filter(
    (creature) => creature.name !== GAUNT_ONE_NAME,
  );
  const caught = syncMissingCreatures(stale, shipped);
  check(
    'a library seeded before the gaunt one existed is handed it without losing what it holds',
    caught.added === 1 &&
      namesOf(caught.stored).includes(GAUNT_ONE_NAME) &&
      stale.every((creature) => namesOf(caught.stored).includes(creature.name)),
  );
  const renamed = (creaturesFromStoredJson(shipped) ?? []).map((creature) => ({
    ...creature,
    name: `my ${creature.name}`,
  }));
  const untouched = syncMissingCreatures(renamed, shipped);
  check(
    'creatures edited in the app are left alone: an id the library already holds is never overwritten',
    untouched.added === 0 && namesOf(untouched.stored).every((name) => name.startsWith('my ')),
  );
}
