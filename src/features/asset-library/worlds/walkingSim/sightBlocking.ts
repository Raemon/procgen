import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { storedTileHeight, WALKABLE_TILE_HEIGHT } from '@/features/asset-library/tiles/tileHeight';
import { EMPTY_TILE } from '../values/chunkValues';
import { cellKey } from './cellGrid';
import type { TileIdProbe } from './worldProbes';

export const SIGHT_BLOCKING_TILE_HEIGHT = WALKABLE_TILE_HEIGHT * 2;

export type SightAssets = Pick<TileAssets, 'byId'>;

export type OpaqueProbe = (x: number, y: number) => boolean;

export function opaqueProbeFrom(tileIdAt: TileIdProbe, tileAssets: SightAssets): OpaqueProbe {
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

function tileBlocksSight(tileId: number, tileAssets: SightAssets): boolean {
  if (tileId === EMPTY_TILE) return false;
  const tile = tileAssets.byId(tileId);
  if (!tile) return false;
  return storedTileHeight(tile) >= SIGHT_BLOCKING_TILE_HEIGHT;
}
