import type { CellPoint } from '@/features/game/nearestWalkable';
import { CARDINAL_STEPS, cellKey } from '../cellGrid';
import type { TileCharacterOf } from '../tileCharacter';
import type { TileIdProbe, WalkableProbe } from '../worldProbes';
import { meanOf, shareOf } from './meanOf';
import { sharesOfCounts, type ShareTally } from './sceneryShares';

const HORIZON_CELLS = 400;
const SMALLEST_MEANINGFUL_BRANCH = 12;
const DECISION_POINTS_WEIGHED = 24;
const DIVERGENT_ENOUGH_TO_MATTER = 0.25;
const SCENERY_WEIGHT = 0.6;
const PAYOFF_WEIGHT = 0.25;
const PROMISE_WEIGHT = 0.15;

export interface ChoiceStructure {
  decisionPointsPer100Steps: number;
  meanBranchDivergence: number;
}

export interface ChoiceProbes {
  isWalkableAt: WalkableProbe;
  tileIdAt: TileIdProbe;
  characterOf: TileCharacterOf;
  seen: ReadonlySet<string>;
}

interface BranchFuture {
  shares: ShareTally;
  reachShare: number;
  unseenShare: number;
}

export function choiceStructure(path: readonly CellPoint[], probes: ChoiceProbes): ChoiceStructure {
  const forks = forksAlongPath(path, probes.isWalkableAt);
  const divergences = weighedForks(forks).map((fork) => divergenceAtFork(fork, probes));
  return {
    decisionPointsPer100Steps: tradeoffsPer100Steps(forks, divergences, path.length),
    meanBranchDivergence: meanOf(divergences),
  };
}

function tradeoffsPer100Steps(
  forks: readonly CellPoint[],
  divergences: readonly number[],
  pathLength: number,
): number {
  const tradeoffShare = shareOf(
    divergences.filter((each) => each >= DIVERGENT_ENOUGH_TO_MATTER).length,
    divergences.length,
  );
  return shareOf(forks.length * tradeoffShare, pathLength) * 100;
}

function forksAlongPath(path: readonly CellPoint[], isWalkableAt: WalkableProbe): CellPoint[] {
  return path.filter((cell) => walkableNeighborsOf(cell, isWalkableAt).length > 2);
}

function weighedForks(forks: readonly CellPoint[]): CellPoint[] {
  const stride = Math.max(1, Math.ceil(forks.length / DECISION_POINTS_WEIGHED));
  return forks.filter((_fork, index) => index % stride === 0);
}

function divergenceAtFork(fork: CellPoint, probes: ChoiceProbes): number {
  const futures = futuresOfEachWayOn(fork, probes);
  if (futures.length < 2) return 0;
  return divergenceAmong(futures);
}

function futuresOfEachWayOn(fork: CellPoint, probes: ChoiceProbes): BranchFuture[] {
  return [...groundNearestToEachWayOn(fork, probes.isWalkableAt).values()]
    .filter((reached) => reached.length >= SMALLEST_MEANINGFUL_BRANCH)
    .map((reached) => futureOfReach(reached, probes));
}

function futureOfReach(reached: readonly CellPoint[], probes: ChoiceProbes): BranchFuture {
  return {
    shares: sharesOfCounts(characterCountsOf(reached, probes)),
    reachShare: reached.length / HORIZON_CELLS,
    unseenShare: shareOf(unseenCountOf(reached, probes.seen), reached.length),
  };
}

function characterCountsOf(reached: readonly CellPoint[], probes: ChoiceProbes): ShareTally {
  const counts: ShareTally = new Map();
  for (const cell of reached) {
    const character = probes.characterOf(probes.tileIdAt(cell.x, cell.y));
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }
  return counts;
}

function unseenCountOf(reached: readonly CellPoint[], seen: ReadonlySet<string>): number {
  return reached.filter((cell) => !seen.has(cellKey(cell.x, cell.y))).length;
}

function groundNearestToEachWayOn(
  fork: CellPoint,
  isWalkableAt: WalkableProbe,
): Map<string, CellPoint[]> {
  const entrances = walkableNeighborsOf(fork, isWalkableAt);
  const owner = new Map<string, string>([[cellKey(fork.x, fork.y), '']]);
  const grounds = new Map<string, CellPoint[]>();
  const queue = seededQueueOf(entrances, owner, grounds);
  for (let head = 0; head < queue.length && queue.length < HORIZON_CELLS; head++) {
    spreadOwnershipFrom(queue[head]!, isWalkableAt, owner, grounds, queue);
  }
  return grounds;
}

function seededQueueOf(
  entrances: readonly CellPoint[],
  owner: Map<string, string>,
  grounds: Map<string, CellPoint[]>,
): CellPoint[] {
  for (const entrance of entrances) {
    const key = cellKey(entrance.x, entrance.y);
    owner.set(key, key);
    grounds.set(key, [entrance]);
  }
  return [...entrances];
}

function spreadOwnershipFrom(
  cell: CellPoint,
  isWalkableAt: WalkableProbe,
  owner: Map<string, string>,
  grounds: Map<string, CellPoint[]>,
  queue: CellPoint[],
): void {
  const claim = owner.get(cellKey(cell.x, cell.y))!;
  for (const next of walkableNeighborsOf(cell, isWalkableAt)) {
    const key = cellKey(next.x, next.y);
    if (owner.has(key)) continue;
    owner.set(key, claim);
    grounds.get(claim)!.push(next);
    queue.push(next);
  }
}

function walkableNeighborsOf(cell: CellPoint, isWalkableAt: WalkableProbe): CellPoint[] {
  const neighbors: CellPoint[] = [];
  for (const step of CARDINAL_STEPS) {
    const next = { x: cell.x + step.dx, y: cell.y + step.dy };
    if (isWalkableAt(next.x, next.y)) neighbors.push(next);
  }
  return neighbors;
}

function divergenceAmong(futures: readonly BranchFuture[]): number {
  return meanOf(pairwiseDistancesOf(futures));
}

function pairwiseDistancesOf(futures: readonly BranchFuture[]): number[] {
  const distances: number[] = [];
  for (let first = 0; first < futures.length; first++) {
    for (let second = first + 1; second < futures.length; second++) {
      distances.push(distanceBetween(futures[first]!, futures[second]!));
    }
  }
  return distances;
}

function distanceBetween(one: BranchFuture, other: BranchFuture): number {
  const scenery = sceneryDistance(one.shares, other.shares);
  const payoff = relativeGap(one.reachShare, other.reachShare);
  const promise = Math.abs(one.unseenShare - other.unseenShare);
  return SCENERY_WEIGHT * scenery + PAYOFF_WEIGHT * payoff + PROMISE_WEIGHT * promise;
}

function relativeGap(one: number, other: number): number {
  if (one + other === 0) return 0;
  return Math.abs(one - other) / (one + other);
}

function sceneryDistance(one: ShareTally, other: ShareTally): number {
  let total = 0;
  for (const character of new Set([...one.keys(), ...other.keys()])) {
    total += Math.abs((one.get(character) ?? 0) - (other.get(character) ?? 0));
  }
  return total / 2;
}
