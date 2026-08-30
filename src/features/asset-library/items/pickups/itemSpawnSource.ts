import type { ItemSpawn } from '@/features/asset-library/worlds/worldSampler';

export interface ItemSpawnSource {
  itemSpawnsIn(minX: number, minY: number, maxX: number, maxY: number): ItemSpawn[];
  takeSpawn(spawn: ItemSpawn): boolean;
}

export const NO_ITEM_SPAWNS: ItemSpawnSource = {
  itemSpawnsIn: () => [],
  takeSpawn: () => false,
};
