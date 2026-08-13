import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { WorldSampler } from '../worldSampler';
import { cellKey } from './cellGrid';
import { tileCharacterProbe } from './tileCharacter';
import type { TileIdProbe } from './worldProbes';

export type CellCharacterProbe = (x: number, y: number) => string;

const TERRACE_HEIGHT = 2;
const TALLEST_TERRACE = 3;

export function cellCharacterProbe(
  sampler: WorldSampler,
  tileIdAt: TileIdProbe,
  tileAssets: TileAssets,
): CellCharacterProbe {
  const tileCharacterOf = tileCharacterProbe(tileAssets);
  const cache = new Map<string, string>();
  return (x, y) => {
    const key = cellKey(x, y);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const character = `${tileCharacterOf(tileIdAt(x, y))}/t${terraceOf(sampler.elevationAt(x, y))}`;
    cache.set(key, character);
    return character;
  };
}

function terraceOf(elevation: number): number {
  return Math.max(0, Math.min(TALLEST_TERRACE, Math.round(elevation / TERRACE_HEIGHT)));
}
