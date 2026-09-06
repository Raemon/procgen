import type { Cell } from './roomCells';

const HALF_SPAN = 2 ** 25;
const COLUMN_STRIDE = 2 ** 26;

export function cellKey(cell: Cell): number {
  return (cell.x + HALF_SPAN) * COLUMN_STRIDE + (cell.y + HALF_SPAN);
}
