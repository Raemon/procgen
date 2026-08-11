import type { CellPoint } from '@/features/game/nearestWalkable';
import type { WalkableProbe } from './cachedWorldProbes';
import {
  cellKey,
  stepsTaken,
  type ExplorationTrace,
  type WalkLimits,
} from './explorationTrace';
import { legToNearestUnvisited } from './legToNearestUnvisited';

export function exploreFromSpawn(
  isWalkableAt: WalkableProbe,
  spawn: CellPoint,
  limits: WalkLimits,
): ExplorationTrace {
  const trace: ExplorationTrace = {
    spawn,
    path: [spawn],
    visited: new Set([cellKey(spawn.x, spawn.y)]),
    exhaustedRegion: false,
  };
  walkUntilBudgetOrExhausted(isWalkableAt, trace, limits);
  return trace;
}

function walkUntilBudgetOrExhausted(
  isWalkableAt: WalkableProbe,
  trace: ExplorationTrace,
  limits: WalkLimits,
): void {
  while (stepsTaken(trace) < limits.stepBudget) {
    const leg = legToNearestUnvisited(isWalkableAt, currentCell(trace), trace, limits);
    if (!leg) {
      trace.exhaustedRegion = true;
      return;
    }
    appendLegWithinBudget(trace, leg, limits.stepBudget);
  }
}

function appendLegWithinBudget(
  trace: ExplorationTrace,
  leg: CellPoint[],
  stepBudget: number,
): void {
  for (const cell of leg) {
    if (stepsTaken(trace) >= stepBudget) return;
    trace.path.push(cell);
    trace.visited.add(cellKey(cell.x, cell.y));
  }
}

function currentCell(trace: ExplorationTrace): CellPoint {
  return trace.path[trace.path.length - 1]!;
}
