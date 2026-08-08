import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';
import {
  corridorSpread,
  doorwayCentreOffset,
  rectBottom,
  rectRight,
  roomInteriorRect,
} from './puzzleRoomLattice';

export interface Band {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function bandContains(band: Band, x: number, y: number): boolean {
  return x >= band.minX && x <= band.maxX && y >= band.minY && y <= band.maxY;
}

export function eastCorridorFloor(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const rect = roomInteriorRect(roomX, roomY, knobs);
  const row = rect.y + doorwayCentreOffset(knobs);
  const spread = corridorSpread(knobs);
  return {
    minX: rectRight(rect) + 1,
    maxX: roomInteriorRect(roomX + 1, roomY, knobs).x - 1,
    minY: row - spread,
    maxY: row + spread,
  };
}

export function southCorridorFloor(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const rect = roomInteriorRect(roomX, roomY, knobs);
  const column = rect.x + doorwayCentreOffset(knobs);
  const spread = corridorSpread(knobs);
  return {
    minX: column - spread,
    maxX: column + spread,
    minY: rectBottom(rect) + 1,
    maxY: roomInteriorRect(roomX, roomY + 1, knobs).y - 1,
  };
}

export function corridorLining(floor: Band, knobs: PuzzleRoomKnobs): Band {
  const runsEastward = floor.maxX - floor.minX > floor.maxY - floor.minY;
  return runsEastward
    ? { ...floor, minY: floor.minY - knobs.wall, maxY: floor.maxY + knobs.wall }
    : { ...floor, minX: floor.minX - knobs.wall, maxX: floor.maxX + knobs.wall };
}

export function eastGateBand(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const floor = eastCorridorFloor(roomX, roomY, knobs);
  return { ...floor, maxX: floor.minX };
}

export function southGateBand(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const floor = southCorridorFloor(roomX, roomY, knobs);
  return { ...floor, maxY: floor.minY };
}

export function westGateBand(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const floor = eastCorridorFloor(roomX - 1, roomY, knobs);
  return { ...floor, minX: floor.maxX };
}

export function northGateBand(roomX: number, roomY: number, knobs: PuzzleRoomKnobs): Band {
  const floor = southCorridorFloor(roomX, roomY - 1, knobs);
  return { ...floor, minY: floor.maxY };
}

export function bandCells(band: Band): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = band.minY; y <= band.maxY; y++) {
    for (let x = band.minX; x <= band.maxX; x++) cells.push({ x, y });
  }
  return cells;
}
