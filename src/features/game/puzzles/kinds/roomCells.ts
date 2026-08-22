import type { Cell } from '@/features/asset-library/worlds/values/cell';
export type { Cell };
import { cellKey } from './cellKey';
import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import type { RoomRect } from '@/features/asset-library/worlds/labyrinth/roomLayout';


export class RoomCells {
  private readonly taken = new Set<number>();

  constructor(readonly interior: RoomRect) {}

  contains(x: number, y: number): boolean {
    return (
      x >= this.interior.x &&
      y >= this.interior.y &&
      x < this.interior.x + this.interior.width &&
      y < this.interior.y + this.interior.height
    );
  }

  isFree(x: number, y: number): boolean {
    return this.contains(x, y) && !this.taken.has(cellKey({ x, y }));
  }

  occupy(cell: Cell): Cell {
    this.taken.add(cellKey(cell));
    return cell;
  }

  release(cell: Cell): void {
    this.taken.delete(cellKey(cell));
  }

  centre(): Cell {
    return {
      x: this.interior.x + Math.floor(this.interior.width / 2),
      y: this.interior.y + Math.floor(this.interior.height / 2),
    };
  }

  freeCells(): Cell[] {
    const cells: Cell[] = [];
    for (let y = this.interior.y; y < this.interior.y + this.interior.height; y++) {
      for (let x = this.interior.x; x < this.interior.x + this.interior.width; x++) {
        if (this.isFree(x, y)) cells.push({ x, y });
      }
    }
    return cells;
  }

  takeFreeCell(rng: RandomStream): Cell | null {
    const free = this.freeCells();
    if (free.length === 0) return null;
    return this.occupy(free[Math.floor(rng() * free.length)]!);
  }

  takeCentreThenSpread(rng: RandomStream, preferCentre: boolean): Cell | null {
    const centre = this.centre();
    if (preferCentre && this.isFree(centre.x, centre.y)) return this.occupy(centre);
    return this.takeFreeCell(rng);
  }
}
