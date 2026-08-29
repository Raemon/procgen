export const LEVEL_STEP = 0.5;
export const WALK_CLIMB_LIMIT = 0.5;
export const JUMP_CLIMB_LIMIT = 1;
export const CLIMB_EFFORT_WEIGHT = 1.5;

export type ElevationProbe = (x: number, y: number) => number;
export type ClimbGate = (fromX: number, fromY: number, toX: number, toY: number) => boolean;
export type CellProbe = (x: number, y: number) => boolean;

export const ANY_CLIMB_ALLOWED: ClimbGate = () => true;

const EXIT_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export const CLIMB_STEPS_PER_WALK = WALK_CLIMB_LIMIT / LEVEL_STEP;
export const CLIMB_STEPS_PER_JUMP = JUMP_CLIMB_LIMIT / LEVEL_STEP;

export function navigationLevelOf(elevation: number): number {
  return Math.round(elevation / LEVEL_STEP) * LEVEL_STEP;
}

export function climbStepsOf(elevation: number): number {
  return Math.round(navigationLevelOf(elevation) / LEVEL_STEP);
}

export function navigationRiseBetween(fromElevation: number, toElevation: number): number {
  return navigationLevelOf(toElevation) - navigationLevelOf(fromElevation);
}

export function climbGateFrom(
  elevationAt: ElevationProbe,
  limit: number = WALK_CLIMB_LIMIT,
): ClimbGate {
  return (fromX, fromY, toX, toY) =>
    navigationRiseBetween(elevationAt(fromX, fromY), elevationAt(toX, toY)) <= limit;
}

export interface ClimbGates {
  climbGateAt: ClimbGate;
  jumpGateAt: ClimbGate;
}

export function climbGatesFrom(elevationAt: ElevationProbe): ClimbGates {
  return {
    climbGateAt: climbGateFrom(elevationAt),
    jumpGateAt: climbGateFrom(elevationAt, JUMP_CLIMB_LIMIT),
  };
}

export function climbEffortOfRise(rise: number): number {
  return 1 + CLIMB_EFFORT_WEIGHT * Math.max(0, rise);
}

export function standableProbeFrom(isWalkableAt: CellProbe, climbGate: ClimbGate): CellProbe {
  return (x, y) => isWalkableAt(x, y) && hasClimbableExit(isWalkableAt, climbGate, x, y);
}

function hasClimbableExit(
  isWalkableAt: CellProbe,
  climbGate: ClimbGate,
  x: number,
  y: number,
): boolean {
  return EXIT_STEPS.some(
    ([dx, dy]) => isWalkableAt(x + dx, y + dy) && climbGate(x, y, x + dx, y + dy),
  );
}
