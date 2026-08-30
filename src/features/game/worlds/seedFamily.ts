import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { rollInt } from '@/features/asset-library/worlds/randomize/randomRolls';

export const MIN_WORLD_GRID_SIDE = 1;
export const MAX_WORLD_GRID_SIDE = 4;
export const DEFAULT_WORLD_COLUMNS = 2;
export const DEFAULT_WORLD_ROWS = 2;
export const MIN_WORLDS_ZOOM = 0.25;
export const MAX_WORLDS_ZOOM = 4;
export const DEFAULT_WORLDS_ZOOM = 1;

const MIN_SEED = 1;
const MAX_SEED = 999_999;

export function familySeeds(origin: number, count: number): number[] {
  const wanted = Math.max(0, count);
  const seeds = [Math.round(origin)];
  const seen = new Set(seeds);
  const rng = mulberry32(origin >>> 0);
  while (seeds.length < wanted) {
    const next = rollInt(rng, MIN_SEED, MAX_SEED);
    if (seen.has(next)) continue;
    seen.add(next);
    seeds.push(next);
  }
  return seeds;
}

export function pipelineStructureKey(
  store: { nodes(): readonly { id: string; type: string }[] },
): string {
  return store.nodes().map((node) => `${node.id}:${node.type}`).join(',');
}

export function clampedGridSide(value: number): number {
  return Math.min(MAX_WORLD_GRID_SIDE, Math.max(MIN_WORLD_GRID_SIDE, Math.round(value)));
}

export function clampedWorldsZoom(value: number): number {
  return Math.min(MAX_WORLDS_ZOOM, Math.max(MIN_WORLDS_ZOOM, value));
}
