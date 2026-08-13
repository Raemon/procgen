import type { CellPoint } from '@/features/game/nearestWalkable';
import type { RandomStream } from '../random/mulberry32';
import { CARDINAL_STEPS, cellKey, type WalkLimits } from './cellGrid';
import { visibleCellsFrom } from './isovist';
import { spawnSitsAtCell, type NearbySpawnsProbe } from './nearbySpawnsProbe';
import type { OpaqueProbe } from './sightBlocking';
import type { WalkableProbe } from './worldProbes';

export const TOURIST_SIGHT_RADIUS = 10;
const FAR_RING_SHARE = 0.75;
const PROMISE_HORIZON_STEPS = 25;
const PROMISE_DRIVE_WEIGHT = 18;
const CONFLICTING_DRIVE_FLOOR = 12;

export interface TouristLimits extends WalkLimits {
  sightRadius: number;
  patienceMs: number;
}

export const ALL_THE_TIME_IN_THE_WORLD = Number.MAX_SAFE_INTEGER;

export interface TouristTrace {
  spawn: CellPoint;
  path: CellPoint[];
  visited: Set<string>;
  seen: Set<string>;
  revealPerStep: number[];
  isovistAreaPerStep: number[];
  mysteryEdgesPerStep: number[];
  waysOnPerStep: number[];
  farSeenPerStep: string[][];
  conflictCostPerStep: number[];
  promisesSighted: number;
  promisesKept: number;
  exhaustedRegion: boolean;
}

interface TouristWalkContext {
  isWalkableAt: WalkableProbe;
  isOpaqueAt: OpaqueProbe;
  spawnsNear: NearbySpawnsProbe;
  limits: TouristLimits;
  rng: RandomStream;
  isovists: Map<string, CellPoint[]>;
  promises: Map<string, CellPoint>;
  promisesEverSighted: Set<string>;
  trace: TouristTrace;
}

export function touristLimits(stepBudget: number, radiusCap: number): TouristLimits {
  return {
    stepBudget,
    radiusCap,
    sightRadius: TOURIST_SIGHT_RADIUS,
    patienceMs: ALL_THE_TIME_IN_THE_WORLD,
  };
}

export function walkAsTourist(
  isWalkableAt: WalkableProbe,
  isOpaqueAt: OpaqueProbe,
  spawnsNear: NearbySpawnsProbe,
  spawn: CellPoint,
  limits: TouristLimits,
  rng: RandomStream,
): TouristTrace {
  const context = freshContext(isWalkableAt, isOpaqueAt, spawnsNear, spawn, limits, rng);
  const walkEndsAt = Date.now() + limits.patienceMs;
  takeInTheViewFromSpawn(context);
  while (stepsWalked(context.trace) < limits.stepBudget && Date.now() < walkEndsAt) {
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
  spawnsNear: NearbySpawnsProbe,
  spawn: CellPoint,
  limits: TouristLimits,
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
    waysOnPerStep: [],
    farSeenPerStep: [],
    conflictCostPerStep: [],
    promisesSighted: 0,
    promisesKept: 0,
    exhaustedRegion: false,
  };
  return {
    isWalkableAt,
    isOpaqueAt,
    spawnsNear,
    limits,
    rng,
    isovists: new Map(),
    promises: new Map(),
    promisesEverSighted: new Set(),
    trace,
  };
}

function takeInTheViewFromSpawn(context: TouristWalkContext): void {
  const isovist = cachedIsovistAt(context, context.trace.spawn);
  for (const cell of isovist) {
    context.trace.seen.add(cellKey(cell.x, cell.y));
  }
  sightPromisesAmong(context, isovist);
}

function takeNextStep(context: TouristWalkContext): boolean {
  const candidates = walkableNeighborsOf(context, currentCell(context.trace));
  const choice = choiceUnderCompetingDrives(context, candidates);
  if (choice) {
    recordStepTo(context, choice.cell, candidates.length, choice.conflictCost);
    return true;
  }
  return followLegToSeenFrontier(context);
}

interface DrivenCandidate {
  cell: CellPoint;
  curiosity: number;
  promise: number;
}

interface DriveChoice {
  cell: CellPoint;
  conflictCost: number;
}

function choiceUnderCompetingDrives(
  context: TouristWalkContext,
  candidates: CellPoint[],
): DriveChoice | null {
  const driven = drivenCandidatesOf(context, candidates);
  const winner = strongest(context, driven, (each) => each.curiosity + each.promise);
  if (!winner || winner.curiosity + winner.promise <= 0) return null;
  return { cell: winner.cell, conflictCost: conflictCostAmong(context, driven) };
}

function drivenCandidatesOf(
  context: TouristWalkContext,
  candidates: CellPoint[],
): DrivenCandidate[] {
  const beckoning = nearestPromiseTo(context, currentCell(context.trace));
  return candidates.map((cell) => ({
    cell,
    curiosity: unseenGainAt(context, cell),
    promise: promisePullAt(context, cell, beckoning),
  }));
}

function conflictCostAmong(context: TouristWalkContext, driven: DrivenCandidate[]): number {
  const byCuriosity = strongest(context, driven, (each) => each.curiosity);
  const byPromise = strongest(context, driven, (each) => each.promise);
  if (!byCuriosity || !byPromise) return 0;
  if (sameCell(byCuriosity.cell, byPromise.cell)) return 0;
  const weaker = Math.min(byCuriosity.curiosity, byPromise.promise);
  if (weaker < CONFLICTING_DRIVE_FLOOR) return 0;
  return weaker / Math.max(byCuriosity.curiosity, byPromise.promise);
}

function sameCell(one: CellPoint, other: CellPoint): boolean {
  return one.x === other.x && one.y === other.y;
}

function strongest(
  context: TouristWalkContext,
  driven: DrivenCandidate[],
  valueOf: (candidate: DrivenCandidate) => number,
): DrivenCandidate | null {
  let best: DrivenCandidate | null = null;
  let bestValue = 0;
  for (const candidate of driven) {
    const value = valueOf(candidate);
    if (value > bestValue || (value === bestValue && value > 0 && context.rng() < 0.5)) {
      best = candidate;
      bestValue = value;
    }
  }
  return best;
}

function promisePullAt(
  context: TouristWalkContext,
  cell: CellPoint,
  beckoning: CellPoint | null,
): number {
  if (!beckoning) return 0;
  const from = chebyshev(currentCell(context.trace), beckoning);
  if (from > PROMISE_HORIZON_STEPS || from === 0) return 0;
  const closeness = 1 - from / PROMISE_HORIZON_STEPS;
  return (from - chebyshev(cell, beckoning)) * PROMISE_DRIVE_WEIGHT * closeness;
}

function nearestPromiseTo(context: TouristWalkContext, cell: CellPoint): CellPoint | null {
  let nearest: CellPoint | null = null;
  let nearestSpan = Number.MAX_SAFE_INTEGER;
  for (const promise of context.promises.values()) {
    const span = chebyshev(cell, promise);
    if (span < nearestSpan) {
      nearest = promise;
      nearestSpan = span;
    }
  }
  return nearest;
}

function chebyshev(one: CellPoint, other: CellPoint): number {
  return Math.max(Math.abs(one.x - other.x), Math.abs(one.y - other.y));
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

function unseenGainAt(context: TouristWalkContext, cell: CellPoint): number {
  let gain = 0;
  for (const visible of cachedIsovistAt(context, cell)) {
    if (!context.trace.seen.has(cellKey(visible.x, visible.y))) gain++;
  }
  return gain;
}

function recordStepTo(
  context: TouristWalkContext,
  cell: CellPoint,
  waysOn: number,
  conflictCost: number,
): void {
  const { trace } = context;
  trace.path.push(cell);
  trace.visited.add(cellKey(cell.x, cell.y));
  const isovist = cachedIsovistAt(context, cell);
  trace.revealPerStep.push(absorbNewScenery(trace, isovist));
  trace.isovistAreaPerStep.push(isovist.length);
  trace.mysteryEdgesPerStep.push(mysteryEdgeCount(context, isovist));
  trace.waysOnPerStep.push(waysOn);
  trace.farSeenPerStep.push(farRingKeysOf(cell, isovist, context.limits.sightRadius));
  trace.conflictCostPerStep.push(conflictCost);
  sightPromisesAmong(context, isovist);
  keepPromisesAround(context, cell);
}

function sightPromisesAmong(context: TouristWalkContext, isovist: readonly CellPoint[]): void {
  for (const cell of isovist) {
    const key = cellKey(cell.x, cell.y);
    if (context.promisesEverSighted.has(key)) continue;
    if (!spawnSitsAtCell(context.spawnsNear, cell.x, cell.y)) continue;
    context.promisesEverSighted.add(key);
    context.promises.set(key, cell);
    context.trace.promisesSighted++;
  }
}

function keepPromisesAround(context: TouristWalkContext, cell: CellPoint): void {
  for (const sighting of context.spawnsNear(cell.x, cell.y)) {
    const key = cellKey(sighting.x, sighting.y);
    if (!context.promises.delete(key)) continue;
    context.trace.promisesKept++;
  }
}

function farRingKeysOf(
  eye: CellPoint,
  isovist: readonly CellPoint[],
  sightRadius: number,
): string[] {
  const farEnough = (sightRadius * FAR_RING_SHARE) ** 2;
  return isovist
    .filter((cell) => (cell.x - eye.x) ** 2 + (cell.y - eye.y) ** 2 >= farEnough)
    .map((cell) => cellKey(cell.x, cell.y));
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
    recordStepTo(context, cell, walkableNeighborsOf(context, cell).length, 0);
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
  const isovist = visibleCellsFrom(cell, context.limits.sightRadius, context.isOpaqueAt);
  evictOldestIsovistWhenFull(context.isovists);
  context.isovists.set(key, isovist);
  return isovist;
}

function evictOldestIsovistWhenFull(isovists: Map<string, CellPoint[]>): void {
  if (isovists.size < ISOVISTS_KEPT) return;
  const oldest = isovists.keys().next().value;
  if (oldest !== undefined) isovists.delete(oldest);
}
