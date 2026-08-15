import type { CellPoint } from '@/features/game/nearestWalkable';
import type { CellCharacterProbe } from '../cellCharacter';
import { CARDINAL_STEPS, cellKey } from '../cellGrid';
import { spawnSitsAtCell, type NearbySpawnsProbe } from '../nearbySpawnsProbe';
import type { StepProbe, WalkableProbe } from '../worldProbes';
import { meanOf, shareOf } from './meanOf';
import { sharesOfCounts, type ShareTally } from './sceneryShares';

const HORIZON_CELLS = 400;
const SMALLEST_MEANINGFUL_BRANCH = 12;
const DECISION_POINTS_WEIGHED = 24;
const DIVERGENT_ENOUGH_TO_MATTER = 0.15;
const SCENERY_WEIGHT = 0.6;
const PAYOFF_WEIGHT = 0.1;
const PROMISE_WEIGHT = 0.15;
const SPOILS_WEIGHT = 0.15;
const SPOILS_DENSITY_FOR_FULL_GAP = 0.03;

export interface ChoiceStructure {
  decisionPointsPer100Steps: number;
  meanBranchDivergence: number;
}

export interface ChoiceProbes {
  isWalkableAt: WalkableProbe;
  canStep: StepProbe;
  characterAt: CellCharacterProbe;
  spawnsNear: NearbySpawnsProbe;
  seen: ReadonlySet<string>;
}

interface BranchFuture {
  shares: ShareTally;
  reachShare: number;
  unseenShare: number;
  spoilsShare: number;
}

export function choiceStructure(path: readonly CellPoint[], probes: ChoiceProbes): ChoiceStructure {
  const forks = forksAlongPath(path, probes.canStep);
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

function forksAlongPath(path: readonly CellPoint[], canStep: StepProbe): CellPoint[] {
  return path.filter((cell) => walkableNeighborsOf(cell, canStep).length > 2);
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
  return [...groundNearestToEachWayOn(fork, probes.canStep).values()]
    .filter((reached) => reached.length >= SMALLEST_MEANINGFUL_BRANCH)
    .map((reached) => futureOfReach(reached, probes));
}

function futureOfReach(reached: readonly CellPoint[], probes: ChoiceProbes): BranchFuture {
  return {
    shares: sharesOfCounts(characterCountsOf(reached, probes)),
    reachShare: reached.length / HORIZON_CELLS,
    unseenShare: shareOf(unseenCountOf(reached, probes.seen), reached.length),
    spoilsShare: shareOf(spoilsCountOf(reached, probes), reached.length),
  };
}

function characterCountsOf(reached: readonly CellPoint[], probes: ChoiceProbes): ShareTally {
  const counts: ShareTally = new Map();
  for (const cell of reached) {
    const character = probes.characterAt(cell.x, cell.y);
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }
  return counts;
}

function spoilsCountOf(reached: readonly CellPoint[], probes: ChoiceProbes): number {
  return reached.filter((cell) => spawnSitsAtCell(probes.spawnsNear, cell.x, cell.y)).length;
}

function unseenCountOf(reached: readonly CellPoint[], seen: ReadonlySet<string>): number {
  return reached.filter((cell) => !seen.has(cellKey(cell.x, cell.y))).length;
}

function groundNearestToEachWayOn(
  fork: CellPoint,
  canStep: StepProbe,
): Map<string, CellPoint[]> {
  const entrances = walkableNeighborsOf(fork, canStep);
  const owner = new Map<string, string>([[cellKey(fork.x, fork.y), '']]);
  const grounds = new Map<string, CellPoint[]>();
  const queue = seededQueueOf(entrances, owner, grounds);
  for (let head = 0; head < queue.length && queue.length < HORIZON_CELLS; head++) {
    spreadOwnershipFrom(queue[head]!, canStep, owner, grounds, queue);
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
  canStep: StepProbe,
  owner: Map<string, string>,
  grounds: Map<string, CellPoint[]>,
  queue: CellPoint[],
): void {
  const claim = owner.get(cellKey(cell.x, cell.y))!;
  for (const next of walkableNeighborsOf(cell, canStep)) {
    const key = cellKey(next.x, next.y);
    if (owner.has(key)) continue;
    owner.set(key, claim);
    grounds.get(claim)!.push(next);
    queue.push(next);
  }
}

function walkableNeighborsOf(cell: CellPoint, canStep: StepProbe): CellPoint[] {
  const neighbors: CellPoint[] = [];
  for (const step of CARDINAL_STEPS) {
    const next = { x: cell.x + step.dx, y: cell.y + step.dy };
    if (canStep(cell.x, cell.y, next.x, next.y)) neighbors.push(next);
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
  const spoils = Math.min(1, Math.abs(one.spoilsShare - other.spoilsShare) / SPOILS_DENSITY_FOR_FULL_GAP);
  return SCENERY_WEIGHT * scenery + PAYOFF_WEIGHT * payoff + PROMISE_WEIGHT * promise + SPOILS_WEIGHT * spoils;
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
