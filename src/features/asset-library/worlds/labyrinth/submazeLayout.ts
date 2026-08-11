import { braidCellMaze } from '../nodes/maze/braidCellMaze';
import { isOpenBetween, type CellMaze } from '../nodes/maze/cellMaze';
import { carveCellMaze } from '../nodes/maze/mazeCarvers';
import { hashString } from '../random/hashString';
import { mulberry32 } from '../random/mulberry32';
import { clampedCorridor, clampedWall, doorwaySpread, CLOSED, type ChunkExits } from './chunkExits';
import type { LabyrinthKnobs } from './labyrinthKnobs';
import { LABYRINTH_CELL_SIZE } from './labyrinthLattice';

interface SubmazeLattice {
  corridor: number;
  wall: number;
  pitch: number;
  cells: number;
}

function latticeOf(knobs: LabyrinthKnobs): SubmazeLattice {
  const corridor = clampedCorridor(knobs);
  const wall = clampedWall(knobs);
  const pitch = corridor + wall;
  const cells = Math.max(1, Math.floor((LABYRINTH_CELL_SIZE - wall) / pitch));
  return { corridor, wall, pitch, cells };
}

function submazeOf(cx: number, cy: number, knobs: LabyrinthKnobs, lattice: SubmazeLattice): CellMaze {
  const rng = mulberry32(hashString(`${knobs.seed}:submaze:${cx},${cy}`));
  const maze = carveCellMaze(lattice.cells, knobs.carver, rng);
  braidCellMaze(maze, knobs.braid, rng);
  return maze;
}

export function submazeFloorMask(
  cx: number,
  cy: number,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): Uint8Array {
  const lattice = latticeOf(knobs);
  const maze = submazeOf(cx, cy, knobs, lattice);
  const mask = new Uint8Array(LABYRINTH_CELL_SIZE * LABYRINTH_CELL_SIZE);
  paintLattice(mask, lattice, maze);
  carveDoorChannels(mask, lattice, exits, knobs);
  return mask;
}

function paintLattice(mask: Uint8Array, lattice: SubmazeLattice, maze: CellMaze): void {
  for (let y = 0; y < LABYRINTH_CELL_SIZE; y++) {
    for (let x = 0; x < LABYRINTH_CELL_SIZE; x++) {
      if (isLatticeFloor(x, y, lattice, maze)) mask[y * LABYRINTH_CELL_SIZE + x] = 1;
    }
  }
}

function isLatticeFloor(x: number, y: number, lattice: SubmazeLattice, maze: CellMaze): boolean {
  const column = latticeSlot(x, lattice);
  const row = latticeSlot(y, lattice);
  if (!column || !row) return false;
  if (column.inFloor && row.inFloor) return true;
  if (!column.inFloor && !row.inFloor) return false;
  if (!column.inFloor) return passageOpen(maze, lattice, column.cell, row.cell, 1, 0);
  return passageOpen(maze, lattice, column.cell, row.cell, 0, 1);
}

function latticeSlot(coord: number, lattice: SubmazeLattice): { cell: number; inFloor: boolean } | null {
  const local = coord - lattice.wall;
  if (local < 0) return null;
  const cell = Math.floor(local / lattice.pitch);
  if (cell >= lattice.cells) return null;
  return { cell, inFloor: local % lattice.pitch < lattice.corridor };
}

function passageOpen(
  maze: CellMaze,
  lattice: SubmazeLattice,
  cellX: number,
  cellY: number,
  dx: number,
  dy: number,
): boolean {
  if (cellX + dx >= lattice.cells || cellY + dy >= lattice.cells) return false;
  return isOpenBetween(maze, { x: cellX, y: cellY }, { x: cellX + dx, y: cellY + dy });
}

function carveDoorChannels(
  mask: Uint8Array,
  lattice: SubmazeLattice,
  exits: ChunkExits,
  knobs: LabyrinthKnobs,
): void {
  const spread = doorwaySpread(knobs);
  if (exits.west !== CLOSED) carveWestDoor(mask, lattice, exits.west, spread);
  if (exits.east !== CLOSED) carveEastDoor(mask, lattice, exits.east, spread);
  if (exits.north !== CLOSED) carveNorthDoor(mask, lattice, exits.north, spread);
  if (exits.south !== CLOSED) carveSouthDoor(mask, lattice, exits.south, spread);
}

function nearestCell(offset: number, lattice: SubmazeLattice): number {
  const cell = Math.floor((offset - lattice.wall) / lattice.pitch);
  return Math.max(0, Math.min(lattice.cells - 1, cell));
}

function cellFloorStart(cell: number, lattice: SubmazeLattice): number {
  return lattice.wall + cell * lattice.pitch;
}

function fillRect(mask: Uint8Array, x0: number, x1: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) mask[y * LABYRINTH_CELL_SIZE + x] = 1;
  }
}

function carveWestDoor(mask: Uint8Array, lattice: SubmazeLattice, offset: number, spread: number): void {
  const start = cellFloorStart(nearestCell(offset, lattice), lattice);
  fillRect(mask, 0, lattice.wall + lattice.corridor - 1, offset - spread, offset + spread);
  fillRect(
    mask,
    lattice.wall,
    lattice.wall + lattice.corridor - 1,
    Math.min(offset - spread, start),
    Math.max(offset + spread, start + lattice.corridor - 1),
  );
}

function carveEastDoor(mask: Uint8Array, lattice: SubmazeLattice, offset: number, spread: number): void {
  const columnStart = cellFloorStart(lattice.cells - 1, lattice);
  const rowStart = cellFloorStart(nearestCell(offset, lattice), lattice);
  fillRect(mask, columnStart, LABYRINTH_CELL_SIZE - 1, offset - spread, offset + spread);
  fillRect(
    mask,
    columnStart,
    columnStart + lattice.corridor - 1,
    Math.min(offset - spread, rowStart),
    Math.max(offset + spread, rowStart + lattice.corridor - 1),
  );
}

function carveNorthDoor(mask: Uint8Array, lattice: SubmazeLattice, offset: number, spread: number): void {
  const start = cellFloorStart(nearestCell(offset, lattice), lattice);
  fillRect(mask, offset - spread, offset + spread, 0, lattice.wall + lattice.corridor - 1);
  fillRect(
    mask,
    Math.min(offset - spread, start),
    Math.max(offset + spread, start + lattice.corridor - 1),
    lattice.wall,
    lattice.wall + lattice.corridor - 1,
  );
}

function carveSouthDoor(mask: Uint8Array, lattice: SubmazeLattice, offset: number, spread: number): void {
  const rowStart = cellFloorStart(lattice.cells - 1, lattice);
  const columnStart = cellFloorStart(nearestCell(offset, lattice), lattice);
  fillRect(mask, offset - spread, offset + spread, rowStart, LABYRINTH_CELL_SIZE - 1);
  fillRect(
    mask,
    Math.min(offset - spread, columnStart),
    Math.max(offset + spread, columnStart + lattice.corridor - 1),
    rowStart,
    rowStart + lattice.corridor - 1,
  );
}
