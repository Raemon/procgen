import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { storedTileHeight } from '@/features/asset-library/tiles/tileHeight';
import { EMPTY_TILE } from '../values/chunkValues';
import { cellKey } from './cellGrid';
import type { TileIdProbe } from './worldProbes';

export const EYE_LEVEL_TILE_HEIGHT = 1.5;

export type OpaqueProbe = (x: number, y: number) => boolean;

export function opaqueProbeFrom(tileIdAt: TileIdProbe, tileAssets: TileAssets): OpaqueProbe {
  const cache = new Map<string, boolean>();
  return (x, y) => {
    const key = cellKey(x, y);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const opaque = tileBlocksSight(tileIdAt(x, y), tileAssets);
    cache.set(key, opaque);
    return opaque;
  };
}

function tileBlocksSight(tileId: number, tileAssets: TileAssets): boolean {
  if (tileId === EMPTY_TILE) return false;
  const tile = tileAssets.byId(tileId);
  if (!tile) return false;
  return storedTileHeight(tile) > EYE_LEVEL_TILE_HEIGHT;
}
