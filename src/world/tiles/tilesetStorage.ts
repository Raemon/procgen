import { readPersistedFile, writePersistedFile } from '../../persistence/repoFileStore';
import { upgradeStoredFaceArt } from './legacyFaceArt';
import type { TileDef } from './tileDef';

const FILE_NAME = 'tileset';

export function loadStoredTiles(): TileDef[] | null {
  return tilesFromStoredJson(readPersistedFile<unknown>(FILE_NAME));
}

export function tilesFromStoredJson(parsed: unknown): TileDef[] | null {
  if (!Array.isArray(parsed)) return null;
  const tiles = parsed.filter(isTileDef).map(withValidatedFaceArt);
  return tiles.length > 0 ? tiles : null;
}

function withValidatedFaceArt(tile: TileDef): TileDef {
  return { ...tile, faceArt: upgradeStoredFaceArt(tile.faceArt) };
}

export function storeTiles(tiles: readonly TileDef[]): void {
  writePersistedFile(FILE_NAME, tiles);
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
