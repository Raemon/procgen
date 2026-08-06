import { EMPTY } from './grid';
import type { Tileset } from './tiles/tileset';

export function isWalkableTile(tileset: Tileset, tileId: number): boolean {
  if (tileId === EMPTY) return false;
  return tileset.byId(tileId)?.walkable ?? false;
}
