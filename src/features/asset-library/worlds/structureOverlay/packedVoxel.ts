import type { TileId } from '@/features/asset-library/asset';
import { EMPTY_VOXEL, VOXEL_FACING_COUNT } from '@/features/asset-library/pieces/pieceDef';

export function packedVoxel(tileId: TileId, facing: number): number {
  return tileId * VOXEL_FACING_COUNT + facing;
}

export function tileIdOfVoxel(packed: number): TileId {
  return (packed < 0 ? EMPTY_VOXEL : Math.floor(packed / VOXEL_FACING_COUNT)) as TileId;
}

export function facingOfVoxel(packed: number): number {
  return packed < 0 ? 0 : packed % VOXEL_FACING_COUNT;
}
