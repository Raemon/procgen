import type { WorldSampler } from '../../procgen/worldSampler';
import type { TileAssets } from '../../assets/tiles/tileAssets';
import { isWalkableTile } from '../../world/tileWalkability';
import { cellKey } from '../../world/cellPoint';

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

export function walkableProbeFrom(tileIdAt: TileIdProbe, tileAssets: TileAssets): WalkableProbe {
  return (x, y) => isWalkableTile(tileAssets, tileIdAt(x, y));
}
