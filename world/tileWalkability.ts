import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { Tileset } from '../library/tiles/tileset';

export function isWalkableTile(tileset: Tileset, tileId: number): boolean {
  if (tileId === EMPTY_TILE) return true;
  return tileset.byId(tileId)?.walkable ?? true;
}
