import type { CellPoint } from '../../world/cellPoint';

export interface ExplorationTrace {
  spawn: CellPoint;
  path: CellPoint[];
  visited: Set<string>;
  exhaustedRegion: boolean;
}

export interface WalkLimits {
  stepBudget: number;
  radiusCap: number;
}

export function stepsTaken(trace: ExplorationTrace): number {
  return trace.path.length - 1;
}
