import { EMPTY_VOXEL } from '../../assets/prefabs/prefabDef';

export const VOXEL_FACINGS = 4;

export function packedVoxel(tileId: number, facing: number): number {
  return tileId * VOXEL_FACINGS + facing;
}

export function tileIdOfVoxel(packed: number): number {
  return packed < 0 ? EMPTY_VOXEL : Math.floor(packed / VOXEL_FACINGS);
}

export function facingOfVoxel(packed: number): number {
  return packed < 0 ? 0 : packed % VOXEL_FACINGS;
}
