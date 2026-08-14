export const CLIMB_LIMIT = 1.05;
export const CLIMB_EFFORT_WEIGHT = 1.5;

export type ElevationProbe = (x: number, y: number) => number;
export type ClimbGate = (fromX: number, fromY: number, toX: number, toY: number) => boolean;

export const ANY_CLIMB_ALLOWED: ClimbGate = () => true;

export function climbGateFrom(elevationAt: ElevationProbe): ClimbGate {
  return (fromX, fromY, toX, toY) =>
    Math.abs(elevationAt(toX, toY) - elevationAt(fromX, fromY)) <= CLIMB_LIMIT;
}

export function climbEffortOfRise(rise: number): number {
  return 1 + CLIMB_EFFORT_WEIGHT * Math.max(0, rise);
}
