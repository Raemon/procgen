import { cellKey } from '@/features/asset-library/worlds/walkingSim/cellGrid';
import type { CellPoint } from '@/features/game/nearestWalkable';

export class ExploredCells {
  private readonly seen = new Set<string>();

  remember(cells: readonly CellPoint[]): void {
    for (const cell of cells) this.seen.add(cellKey(cell.x, cell.y));
  }

  hasSeen(x: number, y: number): boolean {
    return this.seen.has(cellKey(x, y));
  }

  forgetAll(): void {
    this.seen.clear();
  }
}
