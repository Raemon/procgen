import { CRATE_DIRECTIONS, cellKey } from './crateFloorSpace';
import type { Cell, RoomCells } from './roomCells';

export interface CrateBoard {
  cells: RoomCells;
  pillars: ReadonlySet<string>;
}

export function standingRoomForACrate(board: CrateBoard, cell: Cell): boolean {
  return board.cells.contains(cell.x, cell.y) && !board.pillars.has(cellKey(cell));
}

export function squaresACrateCannotComeBackFrom(
  board: CrateBoard,
  plates: readonly Cell[],
): Set<string> {
  const stillWinnable = squaresAPlateIsStillReachableFrom(board, plates);
  const stranding = new Set<string>();
  for (const cell of everyFloorCellOf(board)) {
    if (!stillWinnable.has(cellKey(cell))) stranding.add(cellKey(cell));
  }
  return stranding;
}

function squaresAPlateIsStillReachableFrom(
  board: CrateBoard,
  plates: readonly Cell[],
): Set<string> {
  const reached = new Set<string>();
  const queue: Cell[] = [];
  for (const plate of plates) {
    if (!standingRoomForACrate(board, plate) || reached.has(cellKey(plate))) continue;
    reached.add(cellKey(plate));
    queue.push(plate);
  }
  for (let read = 0; read < queue.length; read++) {
    for (const from of squaresAPushIntoThisCellCanStartFrom(board, queue[read]!)) {
      if (reached.has(cellKey(from))) continue;
      reached.add(cellKey(from));
      queue.push(from);
    }
  }
  return reached;
}

function squaresAPushIntoThisCellCanStartFrom(board: CrateBoard, landedOn: Cell): Cell[] {
  const found: Cell[] = [];
  for (const push of CRATE_DIRECTIONS) {
    const crateStoodAt = { x: landedOn.x - push.dx, y: landedOn.y - push.dy };
    const playerStoodAt = { x: landedOn.x - 2 * push.dx, y: landedOn.y - 2 * push.dy };
    if (!standingRoomForACrate(board, crateStoodAt)) continue;
    if (!standingRoomForACrate(board, playerStoodAt)) continue;
    found.push(crateStoodAt);
  }
  return found;
}

function everyFloorCellOf(board: CrateBoard): Cell[] {
  const cells: Cell[] = [];
  const rect = board.cells.interior;
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (standingRoomForACrate(board, { x, y })) cells.push({ x, y });
    }
  }
  return cells;
}
