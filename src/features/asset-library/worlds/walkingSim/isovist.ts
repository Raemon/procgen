import type { CellPoint } from '@/features/game/nearestWalkable';
import type { ElevationProbe } from '@/features/game/climbing';
import type { OpaqueProbe } from './sightBlocking';

export const EYE_HEIGHT = 1;
const TARGET_STANDOUT = 0.5;
const OPAQUE_SIGHT_HEIGHT = 2;
const RAY_SLACK = 0.01;

export function visibleCellsFrom(
  origin: CellPoint,
  radius: number,
  isOpaqueAt: OpaqueProbe,
  elevationAt?: ElevationProbe,
): CellPoint[] {
  const visible: CellPoint[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const target = { x: origin.x + dx, y: origin.y + dy };
      if (sightRayReaches(origin, target, isOpaqueAt, elevationAt)) visible.push(target);
    }
  }
  return visible;
}

function sightRayReaches(
  origin: CellPoint,
  target: CellPoint,
  isOpaqueAt: OpaqueProbe,
  elevationAt: ElevationProbe | undefined,
): boolean {
  if (!elevationAt) return sightLineIsClear(origin, target, isOpaqueAt);
  return viewshedRayIsClear(origin, target, isOpaqueAt, elevationAt);
}

function viewshedRayIsClear(
  origin: CellPoint,
  target: CellPoint,
  isOpaqueAt: OpaqueProbe,
  elevationAt: ElevationProbe,
): boolean {
  const eye = elevationAt(origin.x, origin.y) + EYE_HEIGHT;
  const targetTop = elevationAt(target.x, target.y) + TARGET_STANDOUT;
  const span = Math.max(Math.abs(target.x - origin.x), Math.abs(target.y - origin.y));
  if (span === 0) return true;
  for (const cell of cellsStrictlyBetween(origin, target)) {
    const along = Math.max(Math.abs(cell.x - origin.x), Math.abs(cell.y - origin.y)) / span;
    const rayHeight = eye + (targetTop - eye) * along;
    if (blockerHeightAt(cell, isOpaqueAt, elevationAt) > rayHeight + RAY_SLACK) return false;
  }
  return true;
}

function blockerHeightAt(
  cell: CellPoint,
  isOpaqueAt: OpaqueProbe,
  elevationAt: ElevationProbe,
): number {
  return elevationAt(cell.x, cell.y) + (isOpaqueAt(cell.x, cell.y) ? OPAQUE_SIGHT_HEIGHT : 0);
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

function sightLineIsClear(origin: CellPoint, target: CellPoint, isOpaqueAt: OpaqueProbe): boolean {
  for (const cell of cellsStrictlyBetween(origin, target)) {
    if (isOpaqueAt(cell.x, cell.y)) return false;
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
