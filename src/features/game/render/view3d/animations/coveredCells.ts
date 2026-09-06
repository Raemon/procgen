import { cellKeyOf } from '../../../circuits/circuit';
import type { Cell } from '../../../worldRules';
import type { MarkerSource } from '../../markerSource';

export class CoveredCells {
  private readonly covers = new Map<string, number>();

  constructor(private readonly remesh: (cell: Cell) => void) {}

  cover(cell: Cell): () => void {
    const key = cellKeyOf(cell);
    const covers = (this.covers.get(key) ?? 0) + 1;
    this.covers.set(key, covers);
    if (covers === 1) this.remesh(cell);
    return actedOnlyOnce(() => this.uncover(cell, key));
  }

  private uncover(cell: Cell, key: string): void {
    const left = (this.covers.get(key) ?? 1) - 1;
    if (left > 0) {
      this.covers.set(key, left);
      return;
    }
    this.covers.delete(key);
    this.remesh(cell);
  }

  isCovered(x: number, y: number): boolean {
    return this.covers.has(cellKeyOf({ x, y }));
  }

  markersExcept(source: MarkerSource): MarkerSource {
    return {
      markersIn: (minX, minY, maxX, maxY) =>
        source.markersIn(minX, minY, maxX, maxY).filter((marker) => !this.isCovered(marker.x, marker.y)),
    };
  }
}

function actedOnlyOnce(act: () => void): () => void {
  let acted = false;
  return () => {
    if (acted) return;
    acted = true;
    act();
  };
}
