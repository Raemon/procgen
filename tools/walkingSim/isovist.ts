import type { CellPoint } from '../../world/nearestWalkable';
import type { OpaqueProbe } from './sightBlocking';

export function visibleCellsFrom(
  origin: CellPoint,
  radius: number,
  isOpaqueAt: OpaqueProbe,
): CellPoint[] {
  const visible: CellPoint[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const target = { x: origin.x + dx, y: origin.y + dy };
      if (sightLineIsClear(origin, target, isOpaqueAt)) visible.push(target);
    }
  }
  return visible;
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
