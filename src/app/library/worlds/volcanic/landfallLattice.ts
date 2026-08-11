import { hashLatticePoint } from '../noise/hashLatticePoint';
import { PRESENT, SETTLEMENT_ERA_SPAN } from '../time/worldTime';

export interface Landfall {
  x: number;
  y: number;
  arrived: number;
}

export interface LandfallSpec {
  pitch: number;
  seed: number;
}

export function landfallCellsOverlapping(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  spec: LandfallSpec,
): Landfall[] {
  const cells: Landfall[] = [];
  for (let cellY = cellIndexOf(minY, spec); cellY <= cellIndexOf(maxY, spec); cellY++) {
    for (let cellX = cellIndexOf(minX, spec); cellX <= cellIndexOf(maxX, spec); cellX++) {
      cells.push(landfallOfCell(cellX, cellY, spec));
    }
  }
  return cells;
}

export function landfallOfCell(cellX: number, cellY: number, spec: LandfallSpec): Landfall {
  const alongX = hashLatticePoint(cellX, cellY, spec.seed);
  const alongY = hashLatticePoint(cellX, cellY, spec.seed + 1);
  const arrivedAt = hashLatticePoint(cellX, cellY, spec.seed + 2);
  return {
    x: Math.round((cellX + alongX) * spec.pitch),
    y: Math.round((cellY + alongY) * spec.pitch),
    arrived: PRESENT - SETTLEMENT_ERA_SPAN * (0.55 + 0.45 * arrivedAt),
  };
}

function cellIndexOf(worldCoord: number, spec: LandfallSpec): number {
  return Math.floor(worldCoord / spec.pitch);
}
