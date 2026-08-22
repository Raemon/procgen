import type { TileId } from '@/features/asset-library/asset';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { isWalkableTile } from '@/features/game/tileWalkability';
import { cellKey } from './explorationTrace';

export type TileIdProbe = (x: number, y: number) => TileId;
export type WalkableProbe = (x: number, y: number) => boolean;

export function cachedTileIdProbe(sampler: WorldSampler): TileIdProbe {
  const cache = new Map<string, TileId>();
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
