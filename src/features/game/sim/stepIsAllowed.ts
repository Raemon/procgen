import { ANY_CLIMB_ALLOWED, type ClimbGate } from '../climbing';

export interface StepRules {
  isWalkableAt(x: number, y: number): boolean;
  clearTheWay(x: number, y: number, dx: number, dy: number, mayPush: boolean): boolean;
  climbGateAt?: ClimbGate;
  jumpGateAt?: ClimbGate;
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
  const climbGate = rules.climbGateAt ?? ANY_CLIMB_ALLOWED;
  if (!climbGate(nextX - dx, nextY - dy, nextX, nextY)) return false;
  return rules.clearTheWay(nextX, nextY, dx, dy, mayPush) && rules.isWalkableAt(nextX, nextY);
}
