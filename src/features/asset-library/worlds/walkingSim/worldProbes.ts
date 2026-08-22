import type { TileId } from '@/features/asset-library/asset';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { climbGateFrom, type ElevationProbe } from '@/features/game/climbing';
import { isWalkableTile } from '@/features/game/tileWalkability';
import type { WorldSampler } from '../worldSampler';
import { cellKey } from './cellGrid';

export type TileIdProbe = (x: number, y: number) => TileId;
export type WalkableProbe = (x: number, y: number) => boolean;
export type StepProbe = (fromX: number, fromY: number, toX: number, toY: number) => boolean;

export function cachedElevationProbe(sampler: WorldSampler): ElevationProbe {
  const cache = new Map<string, number>();
  return (x, y) => {
    const key = cellKey(x, y);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const elevation = sampler.elevationAt(x, y);
    cache.set(key, elevation);
    return elevation;
  };
}

export function stepProbeFrom(
  isWalkableAt: WalkableProbe,
  elevationAt: ElevationProbe,
): StepProbe {
  const climbGate = climbGateFrom(elevationAt);
  return (fromX, fromY, toX, toY) => isWalkableAt(toX, toY) && climbGate(fromX, fromY, toX, toY);
}

export function flatStepProbe(isWalkableAt: WalkableProbe): StepProbe {
  return (_fromX, _fromY, toX, toY) => isWalkableAt(toX, toY);
}

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
