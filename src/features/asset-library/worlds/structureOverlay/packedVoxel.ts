import { EMPTY_VOXEL, VOXEL_FACING_COUNT } from '@/features/asset-library/pieces/pieceDef';

export function packedVoxel(tileId: number, facing: number): number {
  return tileId * VOXEL_FACING_COUNT + facing;
}

export function tileIdOfVoxel(packed: number): number {
  return packed < 0 ? EMPTY_VOXEL : Math.floor(packed / VOXEL_FACING_COUNT);
}

export function facingOfVoxel(packed: number): number {
  return packed < 0 ? 0 : packed % VOXEL_FACING_COUNT;
}
