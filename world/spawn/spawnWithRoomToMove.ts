import { cellKey, type CellPoint } from '../cellPoint';
import { nearestWalkable } from '../nearestWalkable';
import { cellsSpiralingOutward } from './cellsSpiralingOutward';
import {
  ROOM_TO_MOVE_AROUND,
  groundWithinReachOf,
  hasElbowRoom,
  type WalkabilityProbe,
} from './spawnRoominess';

export function spawnWithRoomToMove(
  isWalkableAt: WalkabilityProbe,
  origin: CellPoint,
  searchRadius: number,
): CellPoint | null {
  const solved = solveForRoomySpot(isWalkableAt, origin, searchRadius);
  return solved ?? nearestWalkable(origin.x, origin.y, searchRadius, isWalkableAt);
}

function solveForRoomySpot(
  isWalkableAt: WalkabilityProbe,
  origin: CellPoint,
  searchRadius: number,
): CellPoint | null {
  const cramped = new Set<string>();
  let withoutElbowRoom: CellPoint | null = null;
  for (const cell of cellsSpiralingOutward(origin.x, origin.y, searchRadius)) {
    if (!standsOnGroundWithRoom(isWalkableAt, cell, cramped)) continue;
    if (hasElbowRoom(isWalkableAt, cell)) return cell;
    withoutElbowRoom ??= cell;
  }
  return withoutElbowRoom;
}

function standsOnGroundWithRoom(
  isWalkableAt: WalkabilityProbe,
  cell: CellPoint,
  cramped: Set<string>,
): boolean {
  if (!isWalkableAt(cell.x, cell.y) || cramped.has(cellKey(cell.x, cell.y))) return false;
  const reached = groundWithinReachOf(isWalkableAt, cell);
  if (reached.size >= ROOM_TO_MOVE_AROUND.cellsAFreshSpawnNeeds) return true;
  for (const key of reached) cramped.add(key);
  return false;
}
