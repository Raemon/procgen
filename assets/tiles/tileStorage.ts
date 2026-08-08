import { readPersistedFile, writePersistedFile } from '../../frontend/persistence/repoFileStore';
import { defWithCompactFaceArt, faceArtFromStoredShape, type StoredArtOf } from './storage/storedFaceArt';
import { tileWithSanitizedLight, type TileDef } from './tileDef';
import { storedTileHeight } from './tileHeight';
import { DEFAULT_TILE_SHAPE, isTileShapeKind } from './tileShapeKind';

const FILE_NAME = 'tiles';

export function loadStoredTiles(): TileDef[] | null {
  return tilesFromStoredJson(readPersistedFile<unknown>(FILE_NAME));
}

export function tilesFromStoredJson(parsed: unknown): TileDef[] | null {
  if (!Array.isArray(parsed)) return null;
  const tiles = parsed.filter(isTileDef).map(withValidatedFields).map(tileWithSanitizedLight);
  return tiles.length > 0 ? tiles : null;
}

function withValidatedFields(tile: TileDef): TileDef {
  return {
    ...tile,
    height: storedTileHeight(tile),
    shape: isTileShapeKind(tile.shape) ? tile.shape : DEFAULT_TILE_SHAPE,
    faceArt: faceArtFromStoredShape(tile.faceArt),
  };
}

export function storeTiles(tiles: readonly TileDef[]): void {
  writePersistedFile(FILE_NAME, tilesAsStoredJson(tiles));
}

export function tilesAsStoredJson(tiles: readonly TileDef[]): StoredArtOf<TileDef>[] {
  return tiles.map(defWithCompactFaceArt);
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
