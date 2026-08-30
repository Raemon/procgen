import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { defaultCreatures } from '../creatures/defaultCreatures';
import { defaultTiles } from '../tiles/defaultTiles';
import {
  SHIPPED_COLLECTION_NAMES,
  shippedAssets,
  withMissingShippedAssets,
} from '../shippedAssets';

const GAUNT_ONE_NAME = 'gaunt one';

export function checkShippedAssets(check: CheckReporter): void {
  check(
    'every shipped collection comes from the app itself, with assets in it',
    SHIPPED_COLLECTION_NAMES.every((name) => shippedAssets(name).length > 0),
  );
  check(
    'the creatures the app ships include the gaunt one the labyrinths hunt you with',
    named(shippedAssets('creatures')).includes(GAUNT_ONE_NAME) &&
      defaultCreatures().some((creature) => creature.name === GAUNT_ONE_NAME),
  );
  checkADatabaseIsCaughtUp(check);
  checkWhatTheAppHoldsIsLeftAlone(check);
}

function checkADatabaseIsCaughtUp(check: CheckReporter): void {
  const fresh = withMissingShippedAssets('creatures', null);
  check(
    'a database holding nothing is given every asset the app ships',
    fresh.added === shippedAssets('creatures').length &&
      named(fresh.stored).includes(GAUNT_ONE_NAME),
  );
  const stale = shippedAssets('creatures').filter((creature) => nameOf(creature) !== GAUNT_ONE_NAME);
  const caught = withMissingShippedAssets('creatures', stale);
  check(
    'a database stored before an asset existed is handed it without losing what it holds',
    caught.added === 1 &&
      named(caught.stored).includes(GAUNT_ONE_NAME) &&
      stale.every((creature) => named(caught.stored).includes(nameOf(creature))),
  );
  check(
    'a database already holding everything shipped is left exactly as it is',
    withMissingShippedAssets('tiles', shippedAssets('tiles')).added === 0 &&
      shippedAssets('tiles').length === defaultTiles().length,
  );
}

function checkWhatTheAppHoldsIsLeftAlone(check: CheckReporter): void {
  const renamed = shippedAssets('tiles').map((tile) => ({ ...tile, name: `my ${nameOf(tile)}` }));
  const synced = withMissingShippedAssets('tiles', renamed);
  check(
    'assets edited in the app are never overwritten: an id already held is left as it stands',
    synced.added === 0 && named(synced.stored).every((name) => name.startsWith('my ')),
  );
}

function nameOf(asset: unknown): string {
  return (asset as { name?: string }).name ?? '';
}

function named(assets: readonly unknown[]): string[] {
  return assets.map(nameOf);
}
