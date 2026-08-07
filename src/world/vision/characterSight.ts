import { isInFrontHalfPlane, type FacingIndex } from '../facing';

export const DEFAULT_CHARACTER_SIGHT_RADIUS_TILES = 12;
export const MIN_CHARACTER_SIGHT_RADIUS_TILES = 3;
export const MAX_CHARACTER_SIGHT_RADIUS_TILES = 40;

/**
 * The haze keeps the same share of the sight radius at every range, so seeing
 * farther pushes the fog outward instead of thinning what is already close.
 * At the default radius this is the historical 5 tiles.
 */
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

/** How much more world a radius asks the view and the reader to carry, against the default. */
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
