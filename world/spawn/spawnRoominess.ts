import type { CellPoint } from '../cellPoint';
import { reachableCellsFrom, type WalkabilityProbe } from './reachableCellsFrom';

export type { WalkabilityProbe };

export const ROOM_TO_MOVE_AROUND = {
  cellsAFreshSpawnNeeds: 64,
  cellsAStandingPlayerNeeds: 8,
  elbowRoomRadius: 1,
} as const;

export function spotIsRoomyEnoughToSpawnIn(
  isWalkableAt: WalkabilityProbe,
  cell: CellPoint,
): boolean {
  return reachesAtLeast(isWalkableAt, cell, ROOM_TO_MOVE_AROUND.cellsAFreshSpawnNeeds);
}

export function spotIsTooPennedInToStandIn(
  isWalkableAt: WalkabilityProbe,
  cell: CellPoint,
): boolean {
  return !reachesAtLeast(isWalkableAt, cell, ROOM_TO_MOVE_AROUND.cellsAStandingPlayerNeeds);
}

export function groundWithinReachOf(isWalkableAt: WalkabilityProbe, cell: CellPoint): Set<string> {
  return reachableCellsFrom(isWalkableAt, cell, ROOM_TO_MOVE_AROUND.cellsAFreshSpawnNeeds);
}

export function hasElbowRoom(isWalkableAt: WalkabilityProbe, cell: CellPoint): boolean {
  const radius = ROOM_TO_MOVE_AROUND.elbowRoomRadius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!isWalkableAt(cell.x + dx, cell.y + dy)) return false;
    }
  }
  return true;
}

function reachesAtLeast(
  isWalkableAt: WalkabilityProbe,
  cell: CellPoint,
  cells: number,
): boolean {
  if (!isWalkableAt(cell.x, cell.y)) return false;
  return reachableCellsFrom(isWalkableAt, cell, cells).size >= cells;
}
