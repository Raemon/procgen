import { EMPTY_TILE } from '../../procgen/values/chunkValues';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { ReadOnlyTileAssets } from '../../frontend/readOnlyAssets';
import { emitsLight, lightSourceAt, type LightSource } from './lightEmission';

export interface LightRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function tileLightSourcesInRect(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  rect: LightRect,
): LightSource[] {
  const sources: LightSource[] = [];
  for (let y = rect.minY; y <= rect.maxY; y++) {
    for (let x = rect.minX; x <= rect.maxX; x++) {
      addGlowingGround(sources, sampler, tileAssets, x, y);
      addGlowingCeiling(sources, sampler, tileAssets, x, y);
    }
  }
  return sources;
}

function addGlowingGround(
  into: LightSource[],
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): void {
  const tile = tileAt(tileAssets, sampler.tileAt(x, y));
  if (tile) into.push(lightSourceAt(tile, x, y, sampler.elevationAt(x, y) + 0.5));
}

function addGlowingCeiling(
  into: LightSource[],
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): void {
  const tile = tileAt(tileAssets, sampler.ceilingTileAt(x, y));
  if (!tile) return;
  const elevation = sampler.elevationAt(x, y) + sampler.ceilingHeightAt(x, y);
  into.push(lightSourceAt(tile, x, y, elevation - 0.5));
}

function tileAt(tileAssets: ReadOnlyTileAssets, tileId: number) {
  if (tileId === EMPTY_TILE) return null;
  const tile = tileAssets.byId(tileId);
  return tile && emitsLight(tile) ? tile : null;
}
