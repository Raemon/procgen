import type { TileId } from '@/features/asset-library/asset';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';

export type WalkabilityProbe = (x: number, y: number) => boolean;

export function isWalkableTile(tileAssets: TileAssets, tileId: TileId): boolean {
  if (tileId === EMPTY_TILE) return true;
  return tileAssets.byId(tileId)?.walkable ?? true;
}
