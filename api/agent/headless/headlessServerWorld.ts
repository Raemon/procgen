import { assembleServerWorld, freshWorldState, type ServerWorld } from '../serverWorld';
import { serverWorldAssetsFromStoredJson, type StoredWorldJson } from '../serverWorldAssets';

const HEADLESS_STAMP = 'headless';

export function headlessServerWorld(read: StoredWorldJson): ServerWorld {
  return assembleServerWorld(HEADLESS_STAMP, serverWorldAssetsFromStoredJson(read), freshWorldState());
}
