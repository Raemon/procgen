import type { CellPoint } from '@/features/game/nearestWalkable';
import type { WalkableProbe } from '../cachedWorldProbes';
import { CARDINAL_STEPS, cellFromKey, type ExplorationTrace } from '../explorationTrace';

export function deadEndRatio(trace: ExplorationTrace, isWalkableAt: WalkableProbe): number {
  let deadEnds = 0;
  for (const key of trace.visited) {
    if (isDeadEnd(cellFromKey(key), isWalkableAt)) deadEnds++;
  }
  return trace.visited.size === 0 ? 0 : deadEnds / trace.visited.size;
}

function isDeadEnd(cell: CellPoint, isWalkableAt: WalkableProbe): boolean {
  const openSides = CARDINAL_STEPS.filter((step) =>
    isWalkableAt(cell.x + step.dx, cell.y + step.dy),
  ).length;
  return openSides === 1;
}
