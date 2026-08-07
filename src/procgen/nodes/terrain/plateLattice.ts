import { hashLatticePoint } from '../../../noise/hashLatticePoint';

const TAU = Math.PI * 2;
const CELLS_BEYOND_EDGE = 2;
const OCEAN_SALT = 0x1f83d9ab;
const DRIFT_SALT = 0x5be0cd19;

export interface PlateLatticeSpec {
  plateSize: number;
  oceanFraction: number;
  seed: number;
}

export interface Plate {
  siteX: number;
  siteY: number;
  oceanic: boolean;
  driftX: number;
  driftY: number;
}

export interface PlateContact {
  plate: Plate;
  neighbor: Plate;
  boundaryDistance: number;
  convergence: number;
}

export function platesOverlapping(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  spec: PlateLatticeSpec,
): Plate[] {
  const plates: Plate[] = [];
  const lastCellX = Math.floor(maxX / spec.plateSize) + CELLS_BEYOND_EDGE;
  const lastCellY = Math.floor(maxY / spec.plateSize) + CELLS_BEYOND_EDGE;
  for (let cellY = Math.floor(minY / spec.plateSize) - CELLS_BEYOND_EDGE; cellY <= lastCellY; cellY++) {
    for (let cellX = Math.floor(minX / spec.plateSize) - CELLS_BEYOND_EDGE; cellX <= lastCellX; cellX++) {
      plates.push(plateOfCell(cellX, cellY, spec));
    }
  }
  return plates;
}

export function plateContactAt(plates: readonly Plate[], worldX: number, worldY: number): PlateContact {
  let nearest = plates[0]!;
  let second = plates[0]!;
  let nearestSquared = Infinity;
  let secondSquared = Infinity;
  for (const plate of plates) {
    const dx = plate.siteX - worldX;
    const dy = plate.siteY - worldY;
    const squared = dx * dx + dy * dy;
    if (squared < nearestSquared) {
      second = nearest;
      secondSquared = nearestSquared;
      nearest = plate;
      nearestSquared = squared;
    } else if (squared < secondSquared) {
      second = plate;
      secondSquared = squared;
    }
  }
  return {
    plate: nearest,
    neighbor: second,
    boundaryDistance: (Math.sqrt(secondSquared) - Math.sqrt(nearestSquared)) / 2,
    convergence: convergenceOf(nearest, second),
  };
}

function plateOfCell(cellX: number, cellY: number, spec: PlateLatticeSpec): Plate {
  const driftAngle = hashLatticePoint(cellX, cellY, spec.seed ^ DRIFT_SALT) * TAU;
  return {
    ...jitteredSite(cellX, cellY, spec),
    oceanic: hashLatticePoint(cellX, cellY, spec.seed ^ OCEAN_SALT) < spec.oceanFraction,
    driftX: Math.cos(driftAngle),
    driftY: Math.sin(driftAngle),
  };
}

function jitteredSite(
  cellX: number,
  cellY: number,
  spec: PlateLatticeSpec,
): { siteX: number; siteY: number } {
  return {
    siteX: (cellX + hashLatticePoint(cellX, cellY, spec.seed)) * spec.plateSize,
    siteY: (cellY + hashLatticePoint(cellX, cellY, spec.seed + 1)) * spec.plateSize,
  };
}

function convergenceOf(plate: Plate, neighbor: Plate): number {
  const dx = neighbor.siteX - plate.siteX;
  const dy = neighbor.siteY - plate.siteY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return 0;
  const relativeX = plate.driftX - neighbor.driftX;
  const relativeY = plate.driftY - neighbor.driftY;
  return Math.max(-1, Math.min(1, (relativeX * dx + relativeY * dy) / length / 2));
}
