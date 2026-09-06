import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { ExploredCells } from '@/features/game/vision/exploredCells';
import {
  SEES_EVERYTHING,
  cellIsInLineOfSight,
  lineOfSightFrom,
  type SightWindow,
} from '@/features/game/vision/lineOfSight';
import { seesByLineOfSight, type AgentMode, type AgentPose } from './agentMode';

export function sightWindowFor(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
  explored: ExploredCells | null = null,
): SightWindow {
  if (!seesByLineOfSight(mode)) return SEES_EVERYTHING;
  return lineOfSightFrom(sampler, tileAssets, { x: pose.x, y: pose.y }, sightRadiusTiles, explored);
}

export function terrainHidesTileFrom(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  x: number,
  y: number,
): boolean {
  if (!seesByLineOfSight(mode)) return false;
  return !cellIsInLineOfSight(sampler, tileAssets, { x: pose.x, y: pose.y }, { x, y });
}
