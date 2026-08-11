import { CHUNK_SIZE } from '@/features/asset-library/worlds/chunk';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { ceilingPlacementsForRect } from '../ceilingPlacements';
import { tilePlacementsForRect, type TilePlacement } from '../tilePlacements';
import { voxelPlacementsForRect } from '../voxelPlacements';

export interface OccluderWindow {
  originX: number;
  originY: number;
  span: number;
}

export interface ChunkSurroundings {
  window: OccluderWindow;
  floors: TilePlacement[];
  blocks: TilePlacement[];
  voxels: TilePlacement[];
  ceilings: TilePlacement[];
  shaped: TilePlacement[];
}

const BORDER = 1;
const SPAN = CHUNK_SIZE + BORDER * 2;

export function placementsAroundChunk(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  minX: number,
  minY: number,
): ChunkSurroundings {
  const [fromX, fromY] = [minX - BORDER, minY - BORDER];
  const tiles = tilePlacementsForRect(sampler, tileAssets, fromX, fromY, SPAN, SPAN);
  const voxels = voxelPlacementsForRect(sampler, tileAssets, fromX, fromY, SPAN, SPAN);
  return {
    window: { originX: fromX, originY: fromY, span: SPAN },
    floors: tiles.floors,
    blocks: tiles.blocks,
    voxels: voxels.voxels,
    ceilings: ceilingPlacementsForRect(sampler, tileAssets, fromX, fromY, SPAN, SPAN),
    shaped: [...tiles.shaped, ...voxels.shaped],
  };
}

export function insideChunk(
  placements: readonly TilePlacement[],
  minX: number,
  minY: number,
): TilePlacement[] {
  return placements.filter(
    (placement) =>
      placement.x >= minX &&
      placement.x < minX + CHUNK_SIZE &&
      placement.y >= minY &&
      placement.y < minY + CHUNK_SIZE,
  );
}
