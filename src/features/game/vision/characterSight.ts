import { isInFrontHalfPlane, type FacingIndex } from '../facing';

export const DEFAULT_CHARACTER_SIGHT_RADIUS_TILES = 12;
export const MIN_CHARACTER_SIGHT_RADIUS_TILES = 3;
export const MAX_CHARACTER_SIGHT_RADIUS_TILES = 40;

const HAZE_START_FRACTION = 5 / 12;

export function clampSightRadiusTiles(radius: number): number {
  if (!Number.isFinite(radius)) return DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
  return Math.min(
    MAX_CHARACTER_SIGHT_RADIUS_TILES,
    Math.max(MIN_CHARACTER_SIGHT_RADIUS_TILES, Math.round(radius)),
  );
}

export function characterViewSize(
  radius: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): number {
  return radius * 2 + 1;
}

export function hazeStartTiles(radius: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES): number {
  return radius * HAZE_START_FRACTION;
}

export function sightCostMultiplier(radius: number): number {
  const ratio = radius / DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
  return ratio * ratio;
}

export function isWithinCharacterSight(
  facing: FacingIndex,
  dx: number,
  dy: number,
  radius: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): boolean {
  return isInFrontHalfPlane(facing, dx, dy) && isWithinSightRadius(dx, dy, radius);
}

export function isWithinSightRadius(
  dx: number,
  dy: number,
  radius: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): boolean {
  return dx * dx + dy * dy <= radius * radius;
}
