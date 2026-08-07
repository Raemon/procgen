import {
  bandContains,
  corridorLining,
  eastCorridorFloor,
  southCorridorFloor,
  type Band,
} from './puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';
import { rectContains, roomIndexOfCell, roomInteriorRect } from './puzzleRoomLattice';

export type ShellCell = 'floor' | 'wall' | 'outside';

export function puzzleShellAt(knobs: PuzzleRoomKnobs, x: number, y: number): ShellCell {
  const roomX = roomIndexOfCell(x, knobs);
  const roomY = roomIndexOfCell(y, knobs);
  if (rectContains(roomInteriorRect(roomX, roomY, knobs), x, y)) return 'floor';
  if (touchesAnyCorridor(knobs, roomX, roomY, x, y, (floor) => floor)) return 'floor';
  if (isWallRing(knobs, roomX, roomY, x, y)) return 'wall';
  if (touchesAnyCorridor(knobs, roomX, roomY, x, y, (floor) => corridorLining(floor, knobs))) {
    return 'wall';
  }
  return 'outside';
}

function isWallRing(
  knobs: PuzzleRoomKnobs,
  roomX: number,
  roomY: number,
  x: number,
  y: number,
): boolean {
  const rect = roomInteriorRect(roomX, roomY, knobs);
  const ring = {
    x: rect.x - knobs.wall,
    y: rect.y - knobs.wall,
    width: rect.width + 2 * knobs.wall,
    height: rect.height + 2 * knobs.wall,
  };
  return rectContains(ring, x, y);
}

function touchesAnyCorridor(
  knobs: PuzzleRoomKnobs,
  roomX: number,
  roomY: number,
  x: number,
  y: number,
  widen: (floor: Band) => Band,
): boolean {
  return corridorsReaching(knobs, roomX, roomY).some((floor) =>
    bandContains(widen(floor), x, y),
  );
}

function corridorsReaching(knobs: PuzzleRoomKnobs, roomX: number, roomY: number): Band[] {
  return [
    eastCorridorFloor(roomX, roomY, knobs),
    southCorridorFloor(roomX, roomY, knobs),
    eastCorridorFloor(roomX - 1, roomY, knobs),
    southCorridorFloor(roomX, roomY - 1, knobs),
  ];
}
