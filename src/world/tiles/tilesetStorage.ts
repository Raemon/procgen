import { readJson, writeJson } from '../../persistence/localJsonStore';
import type { TileDef } from './tileDef';

const STORAGE_KEY = 'procgen.tileset.v1';

export function loadStoredTiles(): TileDef[] | null {
  const parsed = readJson<unknown>(STORAGE_KEY);
  if (!Array.isArray(parsed)) return null;
  const tiles = parsed.filter(isTileDef);
  return tiles.length > 0 ? tiles : null;
}

export function storeTiles(tiles: readonly TileDef[]): void {
  writeJson(STORAGE_KEY, tiles);
}

function isTileDef(value: unknown): value is TileDef {
  if (typeof value !== 'object' || value === null) return false;
  const tile = value as Partial<TileDef>;
  return (
    typeof tile.id === 'number' &&
    typeof tile.name === 'string' &&
    typeof tile.symbol === 'string' &&
    typeof tile.color === 'string' &&
    typeof tile.walkable === 'boolean'
  );
}
