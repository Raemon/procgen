import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import { cellKeyOf } from '../../../circuits/circuit';
import type { Cell } from '../../../worldRules';
import type { MarkerSource } from '../../markerSource';

export type MarkerCover = (marker: Marker) => boolean;

const HIDES_EVERY_MARKER: MarkerCover = () => true;

export class CoveredCells {
  private readonly covers = new Map<string, MarkerCover[]>();

  constructor(private readonly remesh: (cell: Cell) => void) {}

  cover(cell: Cell, hides: MarkerCover = HIDES_EVERY_MARKER): () => void {
    const key = cellKeyOf(cell);
    const hiding = this.covers.get(key) ?? [];
    hiding.push(hides);
    this.covers.set(key, hiding);
    if (hiding.length === 1) this.remesh(cell);
    return actedOnlyOnce(() => this.uncover(cell, key, hides));
  }

  private uncover(cell: Cell, key: string, hides: MarkerCover): void {
    const hiding = this.covers.get(key) ?? [];
    const lifted = hiding.indexOf(hides);
    if (lifted >= 0) hiding.splice(lifted, 1);
    if (hiding.length > 0) {
      this.covers.set(key, hiding);
      return;
    }
    this.covers.delete(key);
    this.remesh(cell);
  }

  isCovered(x: number, y: number): boolean {
    return this.covers.has(cellKeyOf({ x, y }));
  }

  hidesMarker(marker: Marker): boolean {
    const hiding = this.covers.get(cellKeyOf(marker));
    return hiding !== undefined && hiding.some((cover) => cover(marker));
  }

  markersExcept(source: MarkerSource): MarkerSource {
    return {
      markersIn: (minX, minY, maxX, maxY) =>
        source.markersIn(minX, minY, maxX, maxY).filter((marker) => !this.hidesMarker(marker)),
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
