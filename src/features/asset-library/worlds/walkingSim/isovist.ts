import type { CellPoint } from '@/features/game/nearestWalkable';
import { SIGHT_BLOCKING_TILE_HEIGHT, type OpaqueProbe } from './sightBlocking';

export type GroundElevationProbe = (x: number, y: number) => number;

export interface SightProbes {
  isOpaqueAt: OpaqueProbe;
  elevationAt: GroundElevationProbe;
}

export function visibleCellsFrom(
  origin: CellPoint,
  radius: number,
  sight: SightProbes,
): CellPoint[] {
  const visible: CellPoint[] = [];
  const eyeGround = sight.elevationAt(origin.x, origin.y);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const target = { x: origin.x + dx, y: origin.y + dy };
      if (sightLineIsClear(origin, target, eyeGround, sight)) visible.push(target);
    }
  }
  return visible;
}

export function cellIsVisibleFrom(
  origin: CellPoint,
  target: CellPoint,
  sight: SightProbes,
): boolean {
  return sightLineIsClear(origin, target, sight.elevationAt(origin.x, origin.y), sight);
}

export function cellsInSightDisc(radius: number): number {
  let count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) count++;
    }
  }
  return count;
}

function sightLineIsClear(
  origin: CellPoint,
  target: CellPoint,
  eyeGround: number,
  sight: SightProbes,
): boolean {
  const targetGround = sight.elevationAt(target.x, target.y);
  const ridgeRise = eyeGround + SIGHT_BLOCKING_TILE_HEIGHT;
  for (const cell of cellsStrictlyBetween(origin, target)) {
    if (sight.isOpaqueAt(cell.x, cell.y)) return false;
    const ground = sight.elevationAt(cell.x, cell.y);
    if (ground >= ridgeRise && ground > targetGround) return false;
  }
  return true;
}

function cellsStrictlyBetween(origin: CellPoint, target: CellPoint): CellPoint[] {
  const between: CellPoint[] = [];
  for (const cell of bresenhamLine(origin, target)) {
    const isEndpoint =
      (cell.x === origin.x && cell.y === origin.y) || (cell.x === target.x && cell.y === target.y);
    if (!isEndpoint) between.push(cell);
  }
  return between;
}

function bresenhamLine(from: CellPoint, to: CellPoint): CellPoint[] {
  const line: CellPoint[] = [];
  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  const run = Math.abs(to.x - from.x);
  const rise = Math.abs(to.y - from.y);
  let error = run - rise;
  let { x, y } = from;
  while (true) {
    line.push({ x, y });
    if (x === to.x && y === to.y) return line;
    const doubledError = 2 * error;
    if (doubledError > -rise) {
      error -= rise;
      x += stepX;
    }
    if (doubledError < run) {
      error += run;
      y += stepY;
    }
  }
}
