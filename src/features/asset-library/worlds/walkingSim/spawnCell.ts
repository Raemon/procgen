import type { CellPoint } from '@/features/game/nearestWalkable';
import { CARDINAL_STEPS, cellKey } from './cellGrid';
import type { WalkableProbe } from './worldProbes';

const SPAWN_SEARCH_RADIUS = 48;
const SPAWN_CANDIDATES_TRIED = 12;
const SPAWN_SPACING = 16;
const WALKS_SPACING = 16;
const ROOM_TO_WALK_CELLS = 300;

export function spawnWithRoomToWalk(isWalkableAt: WalkableProbe): CellPoint | null {
  return spawnsWithRoomToWalk(isWalkableAt, 1)[0] ?? null;
}

export function spawnsWithRoomToWalk(isWalkableAt: WalkableProbe, wanted: number): CellPoint[] {
  const roomy: CellPoint[] = [];
  let roomiest: CellPoint | null = null;
  let roomiestReach = 0;
  for (const candidate of spawnCandidates(isWalkableAt)) {
    if (!standsWellApartFrom(candidate, roomy)) continue;
    const reach = reachableFrom(candidate, isWalkableAt);
    if (reach >= ROOM_TO_WALK_CELLS) roomy.push(candidate);
    if (roomy.length >= wanted) return roomy;
    if (reach > roomiestReach) {
      roomiest = candidate;
      roomiestReach = reach;
    }
  }
  return roomy.length > 0 ? roomy : roomiest ? [roomiest] : [];
}

function standsWellApartFrom(cell: CellPoint, chosen: readonly CellPoint[]): boolean {
  return chosen.every(
    (each) => Math.max(Math.abs(each.x - cell.x), Math.abs(each.y - cell.y)) >= WALKS_SPACING,
  );
}

function spawnCandidates(isWalkableAt: WalkableProbe): CellPoint[] {
  const candidates: CellPoint[] = [];
  for (let radius = 0; radius <= SPAWN_SEARCH_RADIUS; radius++) {
    for (const cell of cellsOnRing(radius)) {
      if (isWalkableAt(cell.x, cell.y) && standsApartFrom(cell, candidates)) candidates.push(cell);
      if (candidates.length >= SPAWN_CANDIDATES_TRIED) return candidates;
    }
  }
  return candidates;
}

function cellsOnRing(radius: number): CellPoint[] {
  if (radius === 0) return [{ x: 0, y: 0 }];
  const cells: CellPoint[] = [];
  for (let along = -radius; along <= radius; along++) {
    cells.push({ x: along, y: -radius }, { x: along, y: radius });
    cells.push({ x: -radius, y: along }, { x: radius, y: along });
  }
  return cells;
}

function standsApartFrom(cell: CellPoint, chosen: readonly CellPoint[]): boolean {
  return chosen.every(
    (each) => Math.max(Math.abs(each.x - cell.x), Math.abs(each.y - cell.y)) >= SPAWN_SPACING,
  );
}

function reachableFrom(start: CellPoint, isWalkableAt: WalkableProbe): number {
  const visited = new Set([cellKey(start.x, start.y)]);
  const queue: CellPoint[] = [start];
  for (let head = 0; head < queue.length && queue.length < ROOM_TO_WALK_CELLS; head++) {
    enqueueWalkableNeighbors(queue[head]!, isWalkableAt, visited, queue);
  }
  return queue.length;
}

function enqueueWalkableNeighbors(
  cell: CellPoint,
  isWalkableAt: WalkableProbe,
  visited: Set<string>,
  queue: CellPoint[],
): void {
  for (const step of CARDINAL_STEPS) {
    const next = { x: cell.x + step.dx, y: cell.y + step.dy };
    const key = cellKey(next.x, next.y);
    if (visited.has(key) || !isWalkableAt(next.x, next.y)) continue;
    visited.add(key);
    queue.push(next);
  }
}
