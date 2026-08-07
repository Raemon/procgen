import type { ItemSpawn, WorldSampler } from '../../procgen/worldSampler';
import type { TakenItemSpawns } from './takenItemSpawns';

export interface GroundItems {
  at(x: number, y: number): ItemSpawn[];
  take(spawn: ItemSpawn): void;
}

export const NO_GROUND_ITEMS: GroundItems = { at: () => [], take: () => undefined };

export function groundItemsOf(sampler: WorldSampler, taken: TakenItemSpawns): GroundItems {
  return {
    at: (x, y) => sampler.itemSpawnsIn(x, y, x, y),
    take: (spawn) => taken.take(spawn),
  };
}
