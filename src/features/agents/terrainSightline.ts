import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { cellKey } from '@/features/asset-library/worlds/walkingSim/cellGrid';
import { visibleCellsFrom } from '@/features/asset-library/worlds/walkingSim/isovist';
import { opaqueProbeFrom } from '@/features/asset-library/worlds/walkingSim/sightBlocking';
import { cachedTileIdProbe } from '@/features/asset-library/worlds/walkingSim/worldProbes';
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
  const isOpaqueAt = opaqueProbeFrom(cachedTileIdProbe(sampler), tileAssets);
  const elevationAt =
    typeof sampler.elevationAt === 'function'
      ? (x: number, y: number) => sampler.elevationAt(x, y)
      : undefined;
  const inSight = visibleCellsFrom({ x: pose.x, y: pose.y }, sightRadiusTiles, isOpaqueAt, elevationAt);
  const seen = new Set(inSight.map((cell) => cellKey(cell.x, cell.y)));
  return (x, y) => seen.has(cellKey(x, y));
}
