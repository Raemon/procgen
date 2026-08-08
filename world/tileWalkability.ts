import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { TileAssets } from '../assets/tiles/tileAssets';

export function isWalkableTile(tileAssets: TileAssets, tileId: number): boolean {
  if (tileId === EMPTY_TILE) return true;
  return tileAssets.byId(tileId)?.walkable ?? true;
}
