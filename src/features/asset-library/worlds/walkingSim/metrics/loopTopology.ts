import { cellFromKey, cellKey } from '../cellGrid';
import type { StepProbe } from '../worldProbes';

const CORRIDOR_WAYS_AT_MOST = 3;

export function corridorLoopsPer100Cells(
  seen: ReadonlySet<string>,
  canStep: StepProbe,
): number {
  const corridor = corridorCellsAmong(seen, canStep);
  if (corridor.size === 0) return 0;
  const { edges, components } = corridorGraphOf(corridor, canStep);
  const independentLoops = Math.max(0, edges - corridor.size + components);
  return (independentLoops / corridor.size) * 100;
}

function corridorCellsAmong(seen: ReadonlySet<string>, canStep: StepProbe): Set<string> {
  const corridor = new Set<string>();
  for (const key of seen) {
    const ways = seenNeighborsOf(key, seen, canStep).length;
    if (ways > 0 && ways <= CORRIDOR_WAYS_AT_MOST) corridor.add(key);
  }
  return corridor;
}

function corridorGraphOf(
  corridor: ReadonlySet<string>,
  canStep: StepProbe,
): { edges: number; components: number } {
  let doubledEdges = 0;
  for (const key of corridor) {
    doubledEdges += seenNeighborsOf(key, corridor, canStep).length;
  }
  return { edges: doubledEdges / 2, components: componentsOf(corridor, canStep) };
}

function componentsOf(corridor: ReadonlySet<string>, canStep: StepProbe): number {
  const unvisited = new Set(corridor);
  let components = 0;
  while (unvisited.size > 0) {
    components++;
    floodOneComponent(unvisited, corridor, canStep);
  }
  return components;
}

function floodOneComponent(
  unvisited: Set<string>,
  corridor: ReadonlySet<string>,
  canStep: StepProbe,
): void {
  const start = unvisited.values().next().value!;
  const queue = [start];
  unvisited.delete(start);
  for (let head = 0; head < queue.length; head++) {
    for (const next of seenNeighborsOf(queue[head]!, corridor, canStep)) {
      if (!unvisited.delete(next)) continue;
      queue.push(next);
    }
  }
}

function seenNeighborsOf(
  key: string,
  among: ReadonlySet<string>,
  canStep: StepProbe,
): string[] {
  const cell = cellFromKey(key);
  const neighbors: string[] = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const nextKey = cellKey(cell.x + dx, cell.y + dy);
    if (!among.has(nextKey)) continue;
    if (canStep(cell.x, cell.y, cell.x + dx, cell.y + dy)) neighbors.push(nextKey);
  }
  return neighbors;
}
