export type FacingIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface FacingVector {
  dx: number;
  dy: number;
}

const FACING_VECTORS: readonly FacingVector[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
];

export const FACING_NAMES = [
  'north',
  'northeast',
  'east',
  'southeast',
  'south',
  'southwest',
  'west',
  'northwest',
] as const;

export function turnedFacing(facing: FacingIndex, eighthTurns: number): FacingIndex {
  return ((((facing + eighthTurns) % 8) + 8) % 8) as FacingIndex;
}

export function facingVector(facing: FacingIndex): FacingVector {
  return FACING_VECTORS[facing]!;
}

export function facingYawRadians(facing: FacingIndex): number {
  return (facing * Math.PI) / 4;
}

export function isInFrontHalfPlane(facing: FacingIndex, dx: number, dy: number): boolean {
  const forward = facingVector(facing);
  return forward.dx * dx + forward.dy * dy > 0;
}
