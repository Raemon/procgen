import { CHUNK_SIZE } from '@/features/asset-library/worlds/chunk';

const MIN_RADIUS_CHUNKS = 2;
export const MAX_RADIUS_CHUNKS = 6;
const TERRAIN_OVERVIEW_RADIUS_CELLS = 5;

export function streamingRadiusChunks(visibleGroundRadiusTiles: number): number {
  const needed = requiredStreamingRadiusChunks(visibleGroundRadiusTiles);
  return Math.max(MIN_RADIUS_CHUNKS, Math.min(MAX_RADIUS_CHUNKS, needed));
}

export function needsTerrainOverview(visibleGroundRadiusTiles: number): boolean {
  return requiredStreamingRadiusChunks(visibleGroundRadiusTiles) > MAX_RADIUS_CHUNKS;
}

export function terrainOverviewCellSpan(visibleGroundRadiusTiles: number): number {
  const needed = Math.max(1, visibleGroundRadiusTiles / TERRAIN_OVERVIEW_RADIUS_CELLS);
  return 2 ** Math.ceil(Math.log2(needed));
}

export function terrainOverviewGroundRadiusTiles(visibleGroundRadiusTiles: number): number {
  return TERRAIN_OVERVIEW_RADIUS_CELLS * terrainOverviewCellSpan(visibleGroundRadiusTiles);
}

export function detailedContentRadiusTiles(visibleGroundRadiusTiles: number): number {
  return Math.min(visibleGroundRadiusTiles, (MAX_RADIUS_CHUNKS - 1) * CHUNK_SIZE);
}

function requiredStreamingRadiusChunks(visibleGroundRadiusTiles: number): number {
  return Math.ceil(visibleGroundRadiusTiles / CHUNK_SIZE) + 1;
}
