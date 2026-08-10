import type { RandomStream } from '../../random/mulberry32';

const NO_ROOM = -1;

export interface MazeRooms {
  cells: number;
  roomIdOfCell: Int32Array;
}

export function carveMazeRooms(
  cells: number,
  roomFraction: number,
  maxRoomCells: number,
  rng: RandomStream,
): MazeRooms {
  const rooms: MazeRooms = { cells, roomIdOfCell: new Int32Array(cells * cells).fill(NO_ROOM) };
  const targetCells = Math.floor(cells * cells * roomFraction);
  let filled = 0;
  let nextRoomId = 0;
  for (let attempt = 0; attempt < cells * cells && filled < targetCells; attempt++) {
    const rect = randomRoomRect(cells, maxRoomCells, rng);
    if (!rect || overlapsExistingRoom(rooms, rect)) continue;
    stampRoom(rooms, rect, nextRoomId++);
    filled += rect.width * rect.height;
  }
  return rooms;
}

function roomIdAt(rooms: MazeRooms, cellX: number, cellY: number): number {
  if (cellX < 0 || cellY < 0 || cellX >= rooms.cells || cellY >= rooms.cells) return NO_ROOM;
  return rooms.roomIdOfCell[cellY * rooms.cells + cellX]!;
}

export function cellsShareARoom(
  rooms: MazeRooms,
  corners: readonly { x: number; y: number }[],
): boolean {
  const first = roomIdAt(rooms, corners[0]!.x, corners[0]!.y);
  if (first === NO_ROOM) return false;
  return corners.every((corner) => roomIdAt(rooms, corner.x, corner.y) === first);
}

interface RoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function randomRoomRect(cells: number, maxRoomCells: number, rng: RandomStream): RoomRect | null {
  const largest = Math.max(2, Math.min(maxRoomCells, cells));
  const width = 2 + Math.floor(rng() * (largest - 1));
  const height = 2 + Math.floor(rng() * (largest - 1));
  const x = Math.floor(rng() * cells);
  const y = Math.floor(rng() * cells);
  if (x + width > cells || y + height > cells) return null;
  return { x, y, width, height };
}

function overlapsExistingRoom(rooms: MazeRooms, rect: RoomRect): boolean {
  return everyCellOfRect(rect).some(
    (cell) => roomIdAt(rooms, cell.x, cell.y) !== NO_ROOM,
  );
}

function stampRoom(rooms: MazeRooms, rect: RoomRect, roomId: number): void {
  for (const cell of everyCellOfRect(rect)) {
    rooms.roomIdOfCell[cell.y * rooms.cells + cell.x] = roomId;
  }
}

function everyCellOfRect(rect: RoomRect): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) cells.push({ x, y });
  }
  return cells;
}
