import type { Cell } from '../worldRules';

export const ROOM_PROBE_TILES = 12;

const PROBE_DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

export interface OpenSpace {
  isWalkable(x: number, y: number): boolean;
}

export function roomSizeAround(space: OpenSpace, at: Cell): number {
  const reaches = PROBE_DIRECTIONS.map(([dx, dy]) => openTilesAlong(space, at, dx, dy));
  const average = reaches.reduce((total, reach) => total + reach, 0) / reaches.length;
  return Math.min(1, average / ROOM_PROBE_TILES);
}

function openTilesAlong(space: OpenSpace, at: Cell, dx: number, dy: number): number {
  for (let reach = 1; reach <= ROOM_PROBE_TILES; reach++) {
    if (!space.isWalkable(at.x + dx * reach, at.y + dy * reach)) return reach - 1;
  }
  return ROOM_PROBE_TILES;
}
