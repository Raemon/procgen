import { CARDINAL_STEPS } from '../cardinalSteps';
import { cellKey, type CellPoint } from '../cellPoint';

export type WalkabilityProbe = (x: number, y: number) => boolean;

interface Flood {
  isWalkableAt: WalkabilityProbe;
  reached: Set<string>;
  frontier: CellPoint[];
  cellCap: number;
}

export function reachableCellsFrom(
  isWalkableAt: WalkabilityProbe,
  start: CellPoint,
  cellCap: number,
): Set<string> {
  const flood: Flood = {
    isWalkableAt,
    reached: new Set([cellKey(start.x, start.y)]),
    frontier: [start],
    cellCap,
  };
  while (flood.frontier.length > 0 && flood.reached.size < cellCap) {
    spreadFrom(flood, flood.frontier.pop()!);
  }
  return flood.reached;
}

function spreadFrom(flood: Flood, cell: CellPoint): void {
  for (const step of CARDINAL_STEPS) {
    if (flood.reached.size >= flood.cellCap) return;
    reachInto(flood, { x: cell.x + step.dx, y: cell.y + step.dy });
  }
}

function reachInto(flood: Flood, next: CellPoint): void {
  const key = cellKey(next.x, next.y);
  if (flood.reached.has(key) || !flood.isWalkableAt(next.x, next.y)) return;
  flood.reached.add(key);
  flood.frontier.push(next);
}
