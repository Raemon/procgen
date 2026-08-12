import type { RandomStream } from '../../procgen/random/mulberry32';
import type { CellPoint } from '../../world/nearestWalkable';
import type { WalkableProbe } from '../explore/cachedWorldProbes';
import { CARDINAL_STEPS, cellKey, type WalkLimits } from '../explore/explorationTrace';
import { visibleCellsFrom } from './isovist';
import type { OpaqueProbe } from './sightBlocking';

export const TOURIST_SIGHT_RADIUS = 12;

export interface TouristTrace {
  spawn: CellPoint;
  path: CellPoint[];
  visited: Set<string>;
  seen: Set<string>;
  revealPerStep: number[];
  isovistAreaPerStep: number[];
  mysteryEdgesPerStep: number[];
  exhaustedRegion: boolean;
}

interface TouristWalkContext {
  isWalkableAt: WalkableProbe;
  isOpaqueAt: OpaqueProbe;
  limits: WalkLimits;
  rng: RandomStream;
  isovists: Map<string, CellPoint[]>;
  trace: TouristTrace;
}

export function walkAsTourist(
  isWalkableAt: WalkableProbe,
  isOpaqueAt: OpaqueProbe,
  spawn: CellPoint,
  limits: WalkLimits,
  rng: RandomStream,
): TouristTrace {
  const context = freshContext(isWalkableAt, isOpaqueAt, spawn, limits, rng);
  takeInTheViewFromSpawn(context);
  while (stepsWalked(context.trace) < limits.stepBudget) {
    if (!takeNextStep(context)) break;
  }
  return context.trace;
}

export function stepsWalked(trace: TouristTrace): number {
  return trace.path.length - 1;
}

function freshContext(
  isWalkableAt: WalkableProbe,
  isOpaqueAt: OpaqueProbe,
  spawn: CellPoint,
  limits: WalkLimits,
  rng: RandomStream,
): TouristWalkContext {
  const trace: TouristTrace = {
    spawn,
    path: [spawn],
    visited: new Set([cellKey(spawn.x, spawn.y)]),
    seen: new Set(),
    revealPerStep: [],
    isovistAreaPerStep: [],
    mysteryEdgesPerStep: [],
    exhaustedRegion: false,
  };
  return { isWalkableAt, isOpaqueAt, limits, rng, isovists: new Map(), trace };
}

function takeInTheViewFromSpawn(context: TouristWalkContext): void {
  for (const cell of cachedIsovistAt(context, context.trace.spawn)) {
    context.trace.seen.add(cellKey(cell.x, cell.y));
  }
}

function takeNextStep(context: TouristWalkContext): boolean {
  const candidates = walkableNeighborsOf(context, currentCell(context.trace));
  const best = mostRevealingCandidate(context, candidates);
  if (best) {
    recordStepTo(context, best);
    return true;
  }
  return followLegToSeenFrontier(context);
}

function walkableNeighborsOf(context: TouristWalkContext, cell: CellPoint): CellPoint[] {
  const neighbors: CellPoint[] = [];
  for (const step of CARDINAL_STEPS) {
    const next = { x: cell.x + step.dx, y: cell.y + step.dy };
    if (!withinRadiusOfSpawn(context, next)) continue;
    if (context.isWalkableAt(next.x, next.y)) neighbors.push(next);
  }
  return neighbors;
}

function withinRadiusOfSpawn(context: TouristWalkContext, cell: CellPoint): boolean {
  const { spawn } = context.trace;
  const cap = context.limits.radiusCap;
  return Math.abs(cell.x - spawn.x) <= cap && Math.abs(cell.y - spawn.y) <= cap;
}

function mostRevealingCandidate(
  context: TouristWalkContext,
  candidates: CellPoint[],
): CellPoint | null {
  let best: CellPoint | null = null;
  let bestGain = 0;
  for (const candidate of candidates) {
    const gain = unseenGainAt(context, candidate);
    if (gain > bestGain || (gain === bestGain && gain > 0 && context.rng() < 0.5)) {
      best = candidate;
      bestGain = gain;
    }
  }
  return best;
}

function unseenGainAt(context: TouristWalkContext, cell: CellPoint): number {
  let gain = 0;
  for (const visible of cachedIsovistAt(context, cell)) {
    if (!context.trace.seen.has(cellKey(visible.x, visible.y))) gain++;
  }
  return gain;
}

function recordStepTo(context: TouristWalkContext, cell: CellPoint): void {
  const { trace } = context;
  trace.path.push(cell);
  trace.visited.add(cellKey(cell.x, cell.y));
  const isovist = cachedIsovistAt(context, cell);
  trace.revealPerStep.push(absorbNewScenery(trace, isovist));
  trace.isovistAreaPerStep.push(isovist.length);
  trace.mysteryEdgesPerStep.push(mysteryEdgeCount(context, isovist));
}

function absorbNewScenery(trace: TouristTrace, isovist: CellPoint[]): number {
  let revealed = 0;
  for (const cell of isovist) {
    const key = cellKey(cell.x, cell.y);
    if (trace.seen.has(key)) continue;
    trace.seen.add(key);
    revealed++;
  }
  return revealed;
}

function mysteryEdgeCount(context: TouristWalkContext, isovist: CellPoint[]): number {
  let edges = 0;
  for (const cell of isovist) {
    if (!context.isWalkableAt(cell.x, cell.y)) continue;
    if (hasUnseenNeighbor(context.trace, cell)) edges++;
  }
  return edges;
}

function hasUnseenNeighbor(trace: TouristTrace, cell: CellPoint): boolean {
  for (const step of CARDINAL_STEPS) {
    if (!trace.seen.has(cellKey(cell.x + step.dx, cell.y + step.dy))) return true;
  }
  return false;
}

function followLegToSeenFrontier(context: TouristWalkContext): boolean {
  const leg = legToSeenFrontier(context);
  if (!leg) {
    context.trace.exhaustedRegion = true;
    return false;
  }
  for (const cell of leg) {
    if (stepsWalked(context.trace) >= context.limits.stepBudget) return true;
    recordStepTo(context, cell);
  }
  return true;
}

function legToSeenFrontier(context: TouristWalkContext): CellPoint[] | null {
  const start = currentCell(context.trace);
  const cameFrom = new Map<string, string | null>([[cellKey(start.x, start.y), null]]);
  const queue: CellPoint[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head]!;
    if (head > 0 && hasUnseenNeighbor(context.trace, cell)) return legEndingAt(cameFrom, cell);
    enqueueFrontierSearchNeighbors(context, cell, cameFrom, queue);
  }
  return null;
}

function enqueueFrontierSearchNeighbors(
  context: TouristWalkContext,
  cell: CellPoint,
  cameFrom: Map<string, string | null>,
  queue: CellPoint[],
): void {
  for (const next of walkableNeighborsOf(context, cell)) {
    const key = cellKey(next.x, next.y);
    if (cameFrom.has(key)) continue;
    cameFrom.set(key, cellKey(cell.x, cell.y));
    queue.push(next);
  }
}

function legEndingAt(cameFrom: Map<string, string | null>, goal: CellPoint): CellPoint[] {
  const reversed: CellPoint[] = [];
  let key: string | null = cellKey(goal.x, goal.y);
  while (key !== null) {
    const [x, y] = key.split(',').map(Number);
    reversed.push({ x: x ?? 0, y: y ?? 0 });
    key = cameFrom.get(key) ?? null;
  }
  return reversed.reverse().slice(1);
}

function currentCell(trace: TouristTrace): CellPoint {
  return trace.path[trace.path.length - 1]!;
}

const ISOVISTS_KEPT = 512;

function cachedIsovistAt(context: TouristWalkContext, cell: CellPoint): CellPoint[] {
  const key = cellKey(cell.x, cell.y);
  const cached = context.isovists.get(key);
  if (cached) return cached;
  const isovist = visibleCellsFrom(cell, TOURIST_SIGHT_RADIUS, context.isOpaqueAt);
  evictOldestIsovistWhenFull(context.isovists);
  context.isovists.set(key, isovist);
  return isovist;
}

function evictOldestIsovistWhenFull(isovists: Map<string, CellPoint[]>): void {
  if (isovists.size < ISOVISTS_KEPT) return;
  const oldest = isovists.keys().next().value;
  if (oldest !== undefined) isovists.delete(oldest);
}
