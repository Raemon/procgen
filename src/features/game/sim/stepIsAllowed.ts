import type { ClimbGate } from '../climbing';

export interface StepRules {
  isWalkableAt(x: number, y: number): boolean;
  clearTheWay(x: number, y: number, dx: number, dy: number, mayPush: boolean): boolean;
  climbGateAt?: ClimbGate;
}

export const NOTHING_IN_THE_WAY = (): boolean => true;

export function stepIsAllowed(
  rules: StepRules,
  nextX: number,
  nextY: number,
  dx: number,
  dy: number,
  mayPush = true,
): boolean {
  if (!rules.clearTheWay(nextX, nextY, dx, dy, mayPush)) return false;
  if (!rules.isWalkableAt(nextX, nextY)) return false;
  return (rules.climbGateAt ?? (() => true))(nextX - dx, nextY - dy, nextX, nextY);
}
