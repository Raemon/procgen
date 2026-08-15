import type { CellPoint } from '@/features/game/nearestWalkable';
import { SIGHT_BLOCKING_TILE_HEIGHT, type OpaqueProbe } from './sightBlocking';

export type GroundElevationProbe = (x: number, y: number) => number;

export interface SightProbes {
  isOpaqueAt: OpaqueProbe;
  elevationAt: GroundElevationProbe;
}

export const EYE_HEIGHT = 1;
const TARGET_STANDOUT = 0.5;
const OPAQUE_SIGHT_HEIGHT = 2;
const RAY_SLACK = 0.01;

export function visibleCellsFrom(
  origin: CellPoint,
  radius: number,
  sight: SightProbes,
): CellPoint[] {
  const visible: CellPoint[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const target = { x: origin.x + dx, y: origin.y + dy };
      if (cellIsVisibleFrom(origin, target, sight)) visible.push(target);
    }
  }
  return visible;
}

export function cellIsVisibleFrom(
  origin: CellPoint,
  target: CellPoint,
  sight: SightProbes,
): boolean {
  const eyeGround = sight.elevationAt(origin.x, origin.y);
  const eye = eyeGround + EYE_HEIGHT;
  const targetGround = sight.elevationAt(target.x, target.y);
  const targetTop = targetGround + TARGET_STANDOUT;
  const span = Math.max(Math.abs(target.x - origin.x), Math.abs(target.y - origin.y));
  if (span === 0) return true;
  for (const cell of cellsStrictlyBetween(origin, target)) {
    const ground = sight.elevationAt(cell.x, cell.y);
    if (ground >= eyeGround + SIGHT_BLOCKING_TILE_HEIGHT && ground > targetGround) return false;
    if (!sight.isOpaqueAt(cell.x, cell.y)) continue;
    const along = Math.max(Math.abs(cell.x - origin.x), Math.abs(cell.y - origin.y)) / span;
    const rayHeight = eye + (targetTop - eye) * along;
    if (ground + OPAQUE_SIGHT_HEIGHT > rayHeight + RAY_SLACK) return false;
  }
  return true;
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
