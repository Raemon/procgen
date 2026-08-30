import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { rollInt } from '@/features/asset-library/worlds/randomize/randomRolls';

export const MIN_WORLD_GRID_SIDE = 1;
export const MAX_WORLD_GRID_SIDE = 6;
export const DEFAULT_WORLD_COLUMNS = 2;
export const DEFAULT_WORLD_ROWS = 2;
export const MIN_WORLDS_ZOOM = 1 / 128;
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
  if (!Number.isFinite(value)) return DEFAULT_WORLDS_ZOOM;
  return Math.min(MAX_WORLDS_ZOOM, Math.max(MIN_WORLDS_ZOOM, value));
}

export function worldsZoomExponent(zoom: number): number {
  return Math.log2(clampedWorldsZoom(zoom));
}

export function worldsZoomAtExponent(exponent: number): number {
  return clampedWorldsZoom(2 ** exponent);
}

export function steppedWorldsZoom(zoom: number, steps: number): number {
  const exponent = worldsZoomExponent(zoom);
  const landing = steps > 0 ? Math.floor(exponent + 1e-6) : Math.ceil(exponent - 1e-6);
  return worldsZoomAtExponent(landing + steps);
}

export function formattedWorldsZoom(zoom: number): string {
  if (zoom >= 1) return Number.isInteger(zoom) ? String(zoom) : zoom.toFixed(1);
  return `1/${Math.round(1 / zoom)}`;
}
