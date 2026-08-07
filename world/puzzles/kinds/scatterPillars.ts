import { fixture, type PuzzleFixture } from '../fixtures/puzzleFixture';
import type { FurnishContext } from './puzzleKind';
import type { Cell } from './roomCells';

export function scatterPillars(context: FurnishContext, count: number): PuzzleFixture[] {
  reserveWalkingRoom(context, context.entrance);
  const pillars: PuzzleFixture[] = [];
  for (let index = 0; index < count; index++) {
    const cell = context.cells.takeFreeCell(context.rng);
    if (!cell) break;
    pillars.push(fixture(`pillar${index}`, 'pillar', cell));
  }
  return pillars;
}

function reserveWalkingRoom(context: FurnishContext, around: Cell): void {
  for (const cell of cellAndItsNeighbours(around)) {
    if (context.cells.isFree(cell.x, cell.y)) context.cells.occupy(cell);
  }
}

export function releaseWalkingRoom(context: FurnishContext, around: Cell): void {
  for (const cell of cellAndItsNeighbours(around)) context.cells.release(cell);
}

function cellAndItsNeighbours(cell: Cell): Cell[] {
  return [
    cell,
    { x: cell.x + 1, y: cell.y },
    { x: cell.x - 1, y: cell.y },
    { x: cell.x, y: cell.y + 1 },
    { x: cell.x, y: cell.y - 1 },
  ];
}
