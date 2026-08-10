import type { RoomCells } from './roomCells';

const CELLS_PER_FIXTURE = 24;
const LEAST_CAPACITY = 1;

export function fixtureCapacity(cells: RoomCells): number {
  const area = cells.interior.width * cells.interior.height;
  return Math.max(LEAST_CAPACITY, Math.floor(area / CELLS_PER_FIXTURE));
}

export function climbingCount(level: number, per: number, capacity: number): number {
  return Math.max(1, Math.min(1 + Math.floor(level / per), Math.floor(capacity)));
}

export function crowdingCount(level: number, from: number, capacity: number): number {
  return Math.max(0, Math.min(level - from, Math.floor(capacity)));
}
