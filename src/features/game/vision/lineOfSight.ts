import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import {
  cellIsVisibleFrom,
  visibleCellsFrom,
  type SightProbes,
} from '@/features/asset-library/worlds/walkingSim/isovist';
import { opaqueProbeFrom } from '@/features/asset-library/worlds/walkingSim/sightBlocking';
import {
  cachedElevationProbe,
  cachedTileIdProbe,
} from '@/features/asset-library/worlds/walkingSim/worldProbes';
import { cellKey } from '@/features/asset-library/worlds/walkingSim/cellGrid';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { CellPoint } from '@/features/game/nearestWalkable';
import type { ExploredCells } from './exploredCells';

export interface SightWindow {
  inSight(x: number, y: number): boolean;
  remembered(x: number, y: number): boolean;
}

export const SEES_EVERYTHING: SightWindow = {
  inSight: () => true,
  remembered: () => false,
};

export function lineOfSightFrom(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  origin: CellPoint,
  sightRadiusTiles: number,
  explored: ExploredCells | null = null,
): SightWindow {
  const cells = visibleCellsFrom(origin, sightRadiusTiles, sightProbesOf(sampler, tileAssets));
  explored?.remember(cells);
  const seen = new Set(cells.map((cell) => cellKey(cell.x, cell.y)));
  return {
    inSight: (x, y) => seen.has(cellKey(x, y)),
    remembered: (x, y) => !seen.has(cellKey(x, y)) && (explored?.hasSeen(x, y) ?? false),
  };
}

export function cellIsInLineOfSight(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  origin: CellPoint,
  target: CellPoint,
): boolean {
  return cellIsVisibleFrom(origin, target, sightProbesOf(sampler, tileAssets));
}

function sightProbesOf(sampler: WorldSampler, tileAssets: ReadOnlyTileAssets): SightProbes {
  return {
    isOpaqueAt: opaqueProbeFrom(cachedTileIdProbe(sampler), tileAssets),
    elevationAt: cachedElevationProbe(sampler),
  };
}
