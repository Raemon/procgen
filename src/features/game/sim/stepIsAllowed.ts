import type { Cell, StepVerdict } from '../worldRules';

export interface StepRules {
  isWalkableAt(x: number, y: number): boolean;
  isStandableAt(x: number, y: number): boolean;
  step(from: Cell, to: Cell, dx: number, dy: number, mayPush: boolean, commit: boolean): StepVerdict;
  jump(from: Cell, dx: number, dy: number): Cell | null;
}

export function stepIsAllowed(
  rules: StepRules,
  nextX: number,
  nextY: number,
  dx: number,
  dy: number,
  mayPush = true,
  commit = true,
): boolean {
  return stepVerdict(rules, nextX, nextY, dx, dy, mayPush, commit).allowed;
}

export function stepVerdict(
  rules: StepRules,
  nextX: number,
  nextY: number,
  dx: number,
  dy: number,
  mayPush = true,
  commit = false,
): StepVerdict {
  return rules.step({ x: nextX - dx, y: nextY - dy }, { x: nextX, y: nextY }, dx, dy, mayPush, commit);
}

export function isAxisStep(dx: number, dy: number): boolean {
  return dx === 0 || dy === 0;
}
