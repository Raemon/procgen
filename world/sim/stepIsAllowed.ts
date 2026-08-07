export interface StepRules {
  isWalkableAt(x: number, y: number): boolean;
  clearTheWay(x: number, y: number, dx: number, dy: number): boolean;
}

export const NOTHING_IN_THE_WAY = (): boolean => true;

export function stepIsAllowed(
  rules: StepRules,
  nextX: number,
  nextY: number,
  dx: number,
  dy: number,
): boolean {
  return rules.clearTheWay(nextX, nextY, dx, dy) && rules.isWalkableAt(nextX, nextY);
}
