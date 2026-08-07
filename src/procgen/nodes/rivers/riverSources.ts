import type { WorldFieldReader } from '../../values/worldInputReaders';
import type { CellHash, RiverCell } from './traceRiverDownhill';

export interface RiverSourceSpec {
  sourceDensity: number;
  minSourceHeight: number;
}

export function riverSourcesInRect(
  elevationAt: WorldFieldReader,
  hash: CellHash,
  spec: RiverSourceSpec,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): RiverCell[] {
  const sources: RiverCell[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (hash(x, y, 'river source') >= spec.sourceDensity) continue;
      const elevation = elevationAt(x, y);
      if (elevation !== null && elevation >= spec.minSourceHeight) sources.push({ x, y });
    }
  }
  return sources;
}
