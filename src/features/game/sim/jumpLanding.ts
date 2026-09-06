import type { StepRules } from './stepIsAllowed';
import type { StepDelta } from './tickMovement';

export const JUMP_REACH_TILES = 2;

export const LANDING_DISTANCES = [JUMP_REACH_TILES, 1] as const;

export function jumpLandingDelta(
  rules: StepRules,
  fromX: number,
  fromY: number,
  dx: number,
  dy: number,
): StepDelta | null {
  const to = rules.jump({ x: fromX, y: fromY }, dx, dy);
  return to ? { dx: to.x - fromX, dy: to.y - fromY, jumped: true } : null;
}
