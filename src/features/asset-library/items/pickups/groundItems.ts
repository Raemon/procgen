import type { ItemSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { DROPPED_ITEM_TAG, type DroppedItemSpawns } from './droppedItemSpawns';
import type { TakenItemSpawns } from './takenItemSpawns';

export interface GroundItems {
  at(x: number, y: number): ItemSpawn[];
  take(spawn: ItemSpawn): void;
}

export const NO_GROUND_ITEMS: GroundItems = { at: () => [], take: () => undefined };

export function groundItemsOf(
  sampler: WorldSampler,
  taken: TakenItemSpawns,
  dropped?: DroppedItemSpawns,
): GroundItems {
  return {
    at: (x, y) => sampler.itemSpawnsIn(x, y, x, y),
    take: (spawn) => {
      if (spawn.tag === DROPPED_ITEM_TAG && dropped?.takeOne(spawn.x, spawn.y, spawn.itemId)) return;
      taken.take(spawn);
    },
  };
}
