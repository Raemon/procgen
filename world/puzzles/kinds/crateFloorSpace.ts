import type { Cell, RoomCells } from './roomCells';

export interface CrateFloorSpace {
  cells: RoomCells;
  pillars: Set<string>;
  crates: Map<string, Cell>;
}

export const CRATE_DIRECTIONS: readonly { dx: number; dy: number }[] = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function isOpenFloor(space: CrateFloorSpace, cell: Cell): boolean {
  if (!space.cells.contains(cell.x, cell.y)) return false;
  if (space.pillars.has(cellKey(cell))) return false;
  return ![...space.crates.values()].some((crate) => crate.x === cell.x && crate.y === cell.y);
}

export function canWalkBetween(space: CrateFloorSpace, from: Cell, goal: Cell): boolean {
  if (!isOpenFloor(space, from) || !isOpenFloor(space, goal)) return false;
  const seen = new Set<string>([cellKey(from)]);
  const queue: Cell[] = [from];
  while (queue.length > 0) {
    const here = queue.shift()!;
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
