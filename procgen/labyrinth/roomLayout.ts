import { CHUNK_SIZE, chunkOrigin } from '../chunk';
import { clampedWall, doorwaySpread, CLOSED, type ChunkExits } from './chunkExits';
import type { LabyrinthKnobs } from './labyrinthKnobs';

export interface RoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Cell {
  x: number;
  y: number;
}

export type DoorwaySide = 'west' | 'north' | 'east' | 'south';

export interface RoomDoorway {
  side: DoorwaySide;
  offset: number;
  cells: Cell[];
  gate: Cell[];
}

export interface RoomGeometry {
  interior: RoomRect;
  doorways: RoomDoorway[];
  anchors: Cell[];
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

export function roomInterior(cx: number, cy: number, knobs: LabyrinthKnobs): RoomRect {
  const wall = clampedWall(knobs);
  return {
    x: chunkOrigin(cx) + wall,
    y: chunkOrigin(cy) + wall,
    width: CHUNK_SIZE - 2 * wall,
    height: CHUNK_SIZE - 2 * wall,
  };
}

export function roomGeometryOf(
  cx: number,
  cy: number,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): RoomGeometry {
  const interior = roomInterior(cx, cy, knobs);
  return { interior, doorways: doorwaysOf(cx, cy, exits, knobs), anchors: anchorsOf(interior) };
}

export function isRoomFloor(x: number, y: number, geometry: RoomGeometry): boolean {
  if (rectContains(geometry.interior, x, y)) return true;
  return geometry.doorways.some((doorway) =>
    doorway.cells.some((cell) => cell.x === x && cell.y === y),
  );
}

function doorwaysOf(
  cx: number,
  cy: number,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): RoomDoorway[] {
  const sides: DoorwaySide[] = ['west', 'north', 'east', 'south'];
  return sides
    .filter((side) => exits[side] !== CLOSED)
    .map((side) => doorwayOf(side, exits[side], cx, cy, knobs));
}

function doorwayOf(
  side: DoorwaySide,
  offset: number,
  cx: number,
  cy: number,
  knobs: LabyrinthKnobs,
): RoomDoorway {
  const wall = clampedWall(knobs);
  const holeDepths = Array.from({ length: wall }, (_, depth) => depth);
  const cells = holeDepths.flatMap((depth) => doorwayRow(side, offset, depth, cx, cy, knobs));
  return { side, offset, cells, gate: doorwayRow(side, offset, wall, cx, cy, knobs) };
}

function doorwayRow(
  side: DoorwaySide,
  offset: number,
  depth: number,
  cx: number,
  cy: number,
  knobs: LabyrinthKnobs,
): Cell[] {
  const spread = doorwaySpread(knobs);
  const across = Array.from({ length: 2 * spread + 1 }, (_, i) => offset - spread + i);
  const originX = chunkOrigin(cx);
  const originY = chunkOrigin(cy);
  if (side === 'west') return across.map((o) => ({ x: originX + depth, y: originY + o }));
  if (side === 'north') return across.map((o) => ({ x: originX + o, y: originY + depth }));
  if (side === 'east') return across.map((o) => ({ x: originX + CHUNK_SIZE - 1 - depth, y: originY + o }));
  return across.map((o) => ({ x: originX + o, y: originY + CHUNK_SIZE - 1 - depth }));
}

function anchorsOf(interior: RoomRect): Cell[] {
  const columns = [Math.floor(interior.width / 4), Math.floor((3 * interior.width) / 4)];
  const rows = [Math.floor(interior.height / 4), Math.floor((3 * interior.height) / 4)];
  const quadrants = rows.flatMap((row) =>
    columns.map((column) => ({ x: interior.x + column, y: interior.y + row })),
  );
  const centre = {
    x: interior.x + Math.floor(interior.width / 2),
    y: interior.y + Math.floor(interior.height / 2),
  };
  return [centre, ...quadrants];
}
