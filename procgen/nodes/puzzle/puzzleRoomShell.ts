import {
  bandContains,
  corridorLining,
  eastCorridorFloor,
  southCorridorFloor,
  type Band,
} from './puzzleRoomCorridors';
import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';
import { rectContains, roomIndexOfCell, roomInteriorRect } from './puzzleRoomLattice';
import type { RoomLatticeMaze } from './roomLatticeMaze';

export type ShellCell = 'floor' | 'wall' | 'outside';

export function puzzleShellAt(
  knobs: PuzzleRoomKnobs,
  maze: RoomLatticeMaze,
  x: number,
  y: number,
): ShellCell {
  const roomX = roomIndexOfCell(x, knobs);
  const roomY = roomIndexOfCell(y, knobs);
  if (rectContains(roomInteriorRect(roomX, roomY, knobs), x, y)) return 'floor';
  const reaching = corridorsReaching(knobs, maze, roomX, roomY);
  if (reaching.some((floor) => bandContains(floor, x, y))) return 'floor';
  if (isWallRing(knobs, roomX, roomY, x, y)) return 'wall';
  if (corridorsAreLined(knobs) && reaching.some((floor) => bandContains(corridorLining(floor, knobs), x, y))) {
    return 'wall';
  }
  return 'outside';
}

function corridorsAreLined(knobs: PuzzleRoomKnobs): boolean {
  return knobs.fillBetween !== 0;
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

function corridorsReaching(
  knobs: PuzzleRoomKnobs,
  maze: RoomLatticeMaze,
  roomX: number,
  roomY: number,
): Band[] {
  const bands: Band[] = [];
  if (maze.hasEastCorridor(roomX, roomY)) bands.push(eastCorridorFloor(roomX, roomY, knobs));
  if (maze.hasSouthCorridor(roomX, roomY)) bands.push(southCorridorFloor(roomX, roomY, knobs));
  if (maze.hasEastCorridor(roomX - 1, roomY)) {
    bands.push(eastCorridorFloor(roomX - 1, roomY, knobs));
  }
  if (maze.hasSouthCorridor(roomX, roomY - 1)) {
    bands.push(southCorridorFloor(roomX, roomY - 1, knobs));
  }
  return bands;
}
