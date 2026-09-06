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
  if (!isOpenFloor(space, from)) return new Set();
  const seen = new Set<number>([cellKey(from)]);
  const queue: Cell[] = [from];
  for (let read = 0; read < queue.length; read++) {
    const here = queue[read]!;
    for (const step of CRATE_DIRECTIONS) {
      const next = { x: here.x + step.dx, y: here.y + step.dy };
      if (seen.has(cellKey(next)) || !isOpenFloor(space, next)) continue;
      seen.add(cellKey(next));
      queue.push(next);
    }
  }
  return seen;
}

export function canWalkBetween(space: CrateFloorSpace, from: Cell, goal: Cell): boolean {
  if (!isOpenFloor(space, from) || !isOpenFloor(space, goal)) return false;
  const seen = new Set<number>([cellKey(from)]);
  const queue: Cell[] = [from];
  for (let read = 0; read < queue.length; read++) {
    const here = queue[read]!;
    if (here.x === goal.x && here.y === goal.y) return true;
    for (const step of CRATE_DIRECTIONS) {
      const next = { x: here.x + step.dx, y: here.y + step.dy };
      if (seen.has(cellKey(next)) || !isOpenFloor(space, next)) continue;
      seen.add(cellKey(next));
      queue.push(next);
    }
  }
  return false;
}
