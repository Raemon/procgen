import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';

export function isWalkableTile(tileAssets: TileAssets, tileId: number): boolean {
  if (tileId === EMPTY_TILE) return true;
  return tileAssets.byId(tileId)?.walkable ?? true;
}
