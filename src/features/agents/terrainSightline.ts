import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { cellKey } from '@/features/asset-library/worlds/walkingSim/cellGrid';
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
import type { AgentMode, AgentPose } from './agentMode';

export type TerrainSightline = (x: number, y: number) => boolean;

export const SEES_PAST_EVERYTHING: TerrainSightline = () => true;

export function terrainSightlineFor(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
): TerrainSightline {
  if (mode === 'god') return SEES_PAST_EVERYTHING;
  const inSight = visibleCellsFrom(
    { x: pose.x, y: pose.y },
    sightRadiusTiles,
    sightProbesOf(sampler, tileAssets),
  );
  const seen = new Set(inSight.map((cell) => cellKey(cell.x, cell.y)));
  return (x, y) => seen.has(cellKey(x, y));
}

export function terrainHidesTileFrom(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  x: number,
  y: number,
): boolean {
  if (mode === 'god') return false;
  return !cellIsVisibleFrom({ x: pose.x, y: pose.y }, { x, y }, sightProbesOf(sampler, tileAssets));
}

function sightProbesOf(sampler: WorldSampler, tileAssets: ReadOnlyTileAssets): SightProbes {
  return {
    isOpaqueAt: opaqueProbeFrom(cachedTileIdProbe(sampler), tileAssets),
    elevationAt: cachedElevationProbe(sampler),
  };
}
