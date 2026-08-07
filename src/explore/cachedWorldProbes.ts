import type { WorldSampler } from '../procgen/worldSampler';
import type { Tileset } from '../world/tiles/tileset';
import { isWalkableTile } from '../world/tileWalkability';
import { cellKey } from './explorationTrace';

export type TileIdProbe = (x: number, y: number) => number;
export type WalkableProbe = (x: number, y: number) => boolean;

export function cachedTileIdProbe(sampler: WorldSampler): TileIdProbe {
  const cache = new Map<string, number>();
  return (x, y) => {
    const key = cellKey(x, y);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const tileId = sampler.tileAt(x, y);
    cache.set(key, tileId);
    return tileId;
  };
}

export function walkableProbeFrom(tileIdAt: TileIdProbe, tileset: Tileset): WalkableProbe {
  return (x, y) => isWalkableTile(tileset, tileIdAt(x, y));
}
