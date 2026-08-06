import { isInFrontHalfPlane, type FacingIndex } from '../facing';

export const CHARACTER_SIGHT_RADIUS_TILES = 12;
export const CHARACTER_HAZE_START_TILES = 5;
export const CHARACTER_VIEW_SIZE = CHARACTER_SIGHT_RADIUS_TILES * 2 + 1;

export function isWithinCharacterSight(facing: FacingIndex, dx: number, dy: number): boolean {
  return isInFrontHalfPlane(facing, dx, dy) && isWithinSightRadius(dx, dy);
}

export function isWithinSightRadius(dx: number, dy: number): boolean {
  return dx * dx + dy * dy <= CHARACTER_SIGHT_RADIUS_TILES * CHARACTER_SIGHT_RADIUS_TILES;
}
