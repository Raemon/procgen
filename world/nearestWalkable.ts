import type { CellPoint } from './cellPoint';
import { cellsSpiralingOutward } from './spawn/cellsSpiralingOutward';

export function nearestWalkable(
  startX: number,
  startY: number,
  maxRadius: number,
  isWalkableAt: (x: number, y: number) => boolean,
): CellPoint | null {
  for (const cell of cellsSpiralingOutward(startX, startY, maxRadius)) {
    if (isWalkableAt(cell.x, cell.y)) return cell;
  }
  return null;
}
