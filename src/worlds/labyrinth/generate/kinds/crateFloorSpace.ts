import { cellKey } from './cellKey';
import type { Cell, RoomCells } from './roomCells';

export interface CrateFloorSpace {
  cells: RoomCells;
  pillars: Set<number>;
  crates: Map<string, Cell>;
}

export const CRATE_DIRECTIONS: readonly { dx: number; dy: number }[] = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

export { cellKey };

export function isOpenFloor(space: CrateFloorSpace, cell: Cell): boolean {
  if (!space.cells.contains(cell.x, cell.y)) return false;
  if (space.pillars.has(cellKey(cell))) return false;
  return !aCrateSitsOn(space, cell);
}

function aCrateSitsOn(space: CrateFloorSpace, cell: Cell): boolean {
  for (const crate of space.crates.values()) {
    if (crate.x === cell.x && crate.y === cell.y) return true;
  }
  return false;
}

export function cellsReachableFrom(space: CrateFloorSpace, from: Cell): Set<number> {
  return openFloorReachedFrom(space, from, null);
}

export function canWalkBetween(space: CrateFloorSpace, from: Cell, goal: Cell): boolean {
  if (!isOpenFloor(space, goal)) return false;
  return openFloorReachedFrom(space, from, goal).has(cellKey(goal));
}

function openFloorReachedFrom(
  space: CrateFloorSpace,
  from: Cell,
  until: Cell | null,
): Set<number> {
  if (!isOpenFloor(space, from)) return new Set();
  const seen = new Set<number>([cellKey(from)]);
  const queue: Cell[] = [from];
  for (let read = 0; read < queue.length; read++) {
    const here = queue[read]!;
    if (until && here.x === until.x && here.y === until.y) return seen;
    for (const step of CRATE_DIRECTIONS) {
      const next = { x: here.x + step.dx, y: here.y + step.dy };
      if (seen.has(cellKey(next)) || !isOpenFloor(space, next)) continue;
      seen.add(cellKey(next));
      queue.push(next);
    }
  }
  return seen;
}
