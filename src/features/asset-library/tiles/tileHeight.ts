import type { TileDef } from './tileDef';

export const WALKABLE_TILE_HEIGHT = 1;
export const MIN_BLOCKING_TILE_HEIGHT = 1.5;
export const BLOCKING_TILE_HEIGHT = 2;

export function defaultHeightForTile(tile: Pick<TileDef, 'walkable'>): number {
  return tile.walkable ? WALKABLE_TILE_HEIGHT : BLOCKING_TILE_HEIGHT;
}

export function storedTileHeight(tile: Pick<TileDef, 'walkable' | 'height'>): number {
  const height = tile.height;
  const stored = typeof height === 'number' && height > 0 ? height : defaultHeightForTile(tile);
  return tile.walkable ? stored : Math.max(stored, MIN_BLOCKING_TILE_HEIGHT);
}

export function blockLayersOfTile(tile: TileDef): number {
  return Math.max(1, Math.round(storedTileHeight(tile)));
}
