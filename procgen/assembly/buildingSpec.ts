export interface BuildingSpec {
  x: number;
  y: number;
  program: number;
  facing: number;
  seedKey: string;
}

export type PaintVoxel = (worldX: number, worldY: number, layer: number, packed: number) => void;

export const FACING_NORTH = 0;
export const FACING_EAST = 1;
export const FACING_SOUTH = 2;
export const FACING_WEST = 3;

export const FACING_STEPS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function normalizedFacing(facing: number): number {
  if (!Number.isFinite(facing)) return FACING_NORTH;
  return ((Math.round(facing) % 4) + 4) % 4;
}

export function oppositeFacing(facing: number): number {
  return normalizedFacing(facing + 2);
}

export function stepOfFacing(facing: number): readonly [number, number] {
  return FACING_STEPS[normalizedFacing(facing)]!;
}
