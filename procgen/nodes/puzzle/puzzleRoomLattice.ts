import { CHUNK_SIZE } from '../../chunk';
import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';

export interface RoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function roomBlockSize(knobs: PuzzleRoomKnobs): number {
  return knobs.roomChunks * CHUNK_SIZE;
}

export function roomIndexOfCell(cell: number, knobs: PuzzleRoomKnobs): number {
  const block = roomBlockSize(knobs);
  return Math.floor((cell + Math.floor(block / 2)) / block);
}

export function roomBlockOrigin(room: number, knobs: PuzzleRoomKnobs): number {
  const block = roomBlockSize(knobs);
  return room * block - Math.floor(block / 2);
}

export function roomInteriorSize(knobs: PuzzleRoomKnobs): number {
  const widest = roomBlockSize(knobs) - 2 * knobs.wall - 2;
  return Math.max(3, Math.min(knobs.roomTiles, widest));
}

export function roomInteriorRect(
  roomX: number,
  roomY: number,
  knobs: PuzzleRoomKnobs,
): RoomRect {
  const block = roomBlockSize(knobs);
  const size = roomInteriorSize(knobs);
  const inset = Math.ceil((block - size) / 2);
  return {
    x: roomBlockOrigin(roomX, knobs) + inset,
    y: roomBlockOrigin(roomY, knobs) + inset,
    width: size,
    height: size,
  };
}

export function roomKey(roomX: number, roomY: number): string {
  return `${roomX},${roomY}`;
}

export function corridorWidth(knobs: PuzzleRoomKnobs): number {
  return Math.max(1, Math.min(knobs.corridor, roomInteriorSize(knobs)));
}

export function doorwayCentreOffset(knobs: PuzzleRoomKnobs): number {
  return Math.floor(roomInteriorSize(knobs) / 2);
}

export function corridorSpread(knobs: PuzzleRoomKnobs): number {
  return Math.floor((corridorWidth(knobs) - 1) / 2);
}

export function rectRight(rect: RoomRect): number {
  return rect.x + rect.width - 1;
}

export function rectBottom(rect: RoomRect): number {
  return rect.y + rect.height - 1;
}

export function rectContains(rect: RoomRect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x <= rectRight(rect) && y <= rectBottom(rect);
}
