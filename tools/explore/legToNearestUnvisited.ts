import { CARDINAL_STEPS } from '../../world/cardinalSteps';
import { cellFromKey, cellKey, type CellPoint } from '../../world/cellPoint';
import type { WalkableProbe } from './cachedWorldProbes';
import type { ExplorationTrace, WalkLimits } from './explorationTrace';

export function legToNearestUnvisited(
  isWalkableAt: WalkableProbe,
  from: CellPoint,
  trace: ExplorationTrace,
  limits: WalkLimits,
): CellPoint[] | null {
  const cameFrom = new Map<string, string | null>([[cellKey(from.x, from.y), null]]);
  const queue: CellPoint[] = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]!;
    if (!trace.visited.has(cellKey(cell.x, cell.y))) return legEndingAt(cameFrom, cell);
    enqueueWalkableNeighbors(isWalkableAt, cell, trace.spawn, limits.radiusCap, cameFrom, queue);
  }
  return null;
}

function enqueueWalkableNeighbors(
  isWalkableAt: WalkableProbe,
  cell: CellPoint,
  spawn: CellPoint,
  radiusCap: number,
  cameFrom: Map<string, string | null>,
  queue: CellPoint[],
): void {
  for (const step of CARDINAL_STEPS) {
    const next = { x: cell.x + step.dx, y: cell.y + step.dy };
    const key = cellKey(next.x, next.y);
    if (cameFrom.has(key)) continue;
    if (!withinRadius(next, spawn, radiusCap) || !isWalkableAt(next.x, next.y)) continue;
    cameFrom.set(key, cellKey(cell.x, cell.y));
    queue.push(next);
  }
}

function withinRadius(cell: CellPoint, center: CellPoint, radius: number): boolean {
  return Math.abs(cell.x - center.x) <= radius && Math.abs(cell.y - center.y) <= radius;
}

function legEndingAt(cameFrom: Map<string, string | null>, goal: CellPoint): CellPoint[] {
  const reversed: CellPoint[] = [];
  let key: string | null = cellKey(goal.x, goal.y);
  while (key !== null) {
    reversed.push(cellFromKey(key));
    key = cameFrom.get(key) ?? null;
  }
  return reversed.reverse().slice(1);
}
