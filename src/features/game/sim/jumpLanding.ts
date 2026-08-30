import { ANY_CLIMB_ALLOWED, type ClimbGate } from '../climbing';
import type { StepRules } from './stepIsAllowed';
import type { StepDelta } from './tickMovement';

export const JUMP_REACH_TILES = 2;

export const LANDING_DISTANCES = [JUMP_REACH_TILES, 1] as const;

function jumpGateOf(rules: StepRules): ClimbGate {
  return rules.jumpGateAt ?? rules.climbGateAt ?? ANY_CLIMB_ALLOWED;
}

function jumpIsAllowed(
  rules: StepRules,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): boolean {
  if (!jumpGateOf(rules)(fromX, fromY, toX, toY)) return false;
  const dx = Math.sign(toX - fromX);
  const dy = Math.sign(toY - fromY);
  if (!vaultIsClear(rules, fromX, fromY, toX, toY, dx, dy)) return false;
  return rules.clearTheWay(toX, toY, dx, dy, false) && rules.isWalkableAt(toX, toY);
}

function vaultIsClear(
  rules: StepRules,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dx: number,
  dy: number,
): boolean {
  const distance = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
  for (let step = 1; step < distance; step++) {
    if (!rules.clearTheWay(fromX + dx * step, fromY + dy * step, dx, dy, false)) return false;
  }
  return true;
}

export function jumpLandingDelta(
  rules: StepRules,
  fromX: number,
  fromY: number,
  dx: number,
  dy: number,
): StepDelta | null {
  for (const distance of LANDING_DISTANCES) {
    const toX = fromX + dx * distance;
    const toY = fromY + dy * distance;
    if (jumpIsAllowed(rules, fromX, fromY, toX, toY)) {
      return { dx: dx * distance, dy: dy * distance, jumped: true };
    }
  }
  return null;
}
