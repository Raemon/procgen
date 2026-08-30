import type { ItemSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { NO_ITEM_SPAWNS, type ItemSpawnSource } from './itemSpawnSource';
import type { TakenItemSpawns } from './takenItemSpawns';

export interface GroundItems {
  at(x: number, y: number): ItemSpawn[];
  take(spawn: ItemSpawn): void;
}

export const NO_GROUND_ITEMS: GroundItems = { at: () => [], take: () => undefined };

export function groundItemsOf(
  sampler: WorldSampler,
  taken: TakenItemSpawns,
  extra: ItemSpawnSource = NO_ITEM_SPAWNS,
): GroundItems {
  return {
    at: (x, y) => sampler.itemSpawnsIn(x, y, x, y),
    take: (spawn) => {
      if (!extra.takeSpawn(spawn)) taken.take(spawn);
    },
  };
}
