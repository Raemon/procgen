import type { WorldFieldReader } from '../../values/worldInputReaders';

export type CellHash = (worldX: number, worldY: number, label: string) => number;

export interface RiverTraceSpec {
  seaLevel: number;
  maxLength: number;
  meander: number;
}

export interface RiverCell {
  x: number;
  y: number;
}

export function traceRiverDownhill(
  elevationAt: WorldFieldReader,
  hash: CellHash,
  spec: RiverTraceSpec,
  startX: number,
  startY: number,
): RiverCell[] {
  const path: RiverCell[] = [{ x: startX, y: startY }];
  const visited = new Set([cellKey(startX, startY)]);
  let current = { x: startX, y: startY };
  while (path.length < spec.maxLength) {
    const next = nextDownhillCell(elevationAt, hash, spec, current, visited);
    if (!next) break;
    if (next.elevation < spec.seaLevel) break;
    path.push({ x: next.x, y: next.y });
    visited.add(cellKey(next.x, next.y));
    current = { x: next.x, y: next.y };
  }
  return path;
}

interface ScoredCell {
  x: number;
  y: number;
  elevation: number;
}

function nextDownhillCell(
  elevationAt: WorldFieldReader,
  hash: CellHash,
  spec: RiverTraceSpec,
  current: RiverCell,
  visited: Set<string>,
): ScoredCell | null {
  const currentElevation = elevationAt(current.x, current.y);
  if (currentElevation === null) return null;
  let best: ScoredCell | null = null;
  let bestScore = Infinity;
  for (const [dx, dy] of NEIGHBOR_STEPS) {
    const x = current.x + dx;
    const y = current.y + dy;
    if (visited.has(cellKey(x, y))) continue;
    const elevation = elevationAt(x, y);
    if (elevation === null || elevation > currentElevation) continue;
    const score = elevation + hash(x, y, 'meander') * spec.meander;
    if (score < bestScore) {
      bestScore = score;
      best = { x, y, elevation };
    }
  }
  return best;
}

const NEIGHBOR_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}
