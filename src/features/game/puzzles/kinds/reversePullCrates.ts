import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import {
  cellKey,
  cellsReachableFrom,
  isOpenFloor,
  CRATE_DIRECTIONS,
  type CrateFloorSpace,
} from './crateFloorSpace';
import { forwardSolutionWorks } from './forwardSolutionWorks';
import type { CratePush } from './puzzleKind';
import type { Cell } from './roomCells';

export interface PullableRoom extends CrateFloorSpace {
  player: Cell;
}

interface ReversePull {
  entrance: Cell;
  solution: CratePush[];
  whereThePlayerCanGetTo: Set<number>;
}

const ATTEMPTS_PER_PULL = 5;

export function reversePullCrates(
  room: PullableRoom,
  entrances: readonly Cell[],
  pulls: number,
  rng: RandomStream,
): CratePush[] {
  const plates = new Set([...room.crates.values()].map(cellKey));
  const run = aRunStartingAtTheDoorway(room, entrances[0]!);
  const crateIds = [...room.crates.keys()];
  const attempts = pulls * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts && run.solution.length < pulls; attempt++) {
    const crateId = crateIds[Math.floor(rng() * crateIds.length)]!;
    keepThePullIfItStaysSolvable(room, run, crateId, aDirectionAtRandom(rng));
  }
  dragEveryCrateOffAPlate(room, run, plates, rng);
  return run.solution;
}

export function everyDoorwayCanRunTheSolution(
  room: PullableRoom,
  entrances: readonly Cell[],
  solution: readonly CratePush[],
): boolean {
  return entrances.every((entrance) => forwardSolutionWorks(room, entrance, solution));
}

export function cratesStillOnPlates(room: PullableRoom, plates: ReadonlySet<number>): string[] {
  return [...room.crates]
    .filter(([, cell]) => plates.has(cellKey(cell)))
    .map(([crateId]) => crateId);
}

function aRunStartingAtTheDoorway(room: PullableRoom, entrance: Cell): ReversePull {
  return {
    entrance,
    solution: [],
    whereThePlayerCanGetTo: cellsReachableFrom(room, entrance),
  };
}

function aDirectionAtRandom(rng: RandomStream): { dx: number; dy: number } {
  return CRATE_DIRECTIONS[Math.floor(rng() * CRATE_DIRECTIONS.length)]!;
}

function dragEveryCrateOffAPlate(
  room: PullableRoom,
  run: ReversePull,
  plates: ReadonlySet<number>,
  rng: RandomStream,
): void {
  const attempts = plates.size * CRATE_DIRECTIONS.length * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const resting = cratesStillOnPlates(room, plates);
    if (resting.length === 0) return;
    const crateId = resting[Math.floor(rng() * resting.length)]!;
    keepThePullIfItStaysSolvable(room, run, crateId, aDirectionAtRandom(rng));
  }
}

function keepThePullIfItStaysSolvable(
  room: PullableRoom,
  run: ReversePull,
  crateId: string,
  direction: { dx: number; dy: number },
): void {
  const wasAt = room.crates.get(crateId)!;
  const stoodAt = room.player;
  if (!thePullIsWorthTrying(room, run, wasAt, direction)) return;
  const pulled = pullOneCrateBackwards(room, crateId, direction);
  const nowReachable = cellsReachableFrom(room, run.entrance);
  if (nowReachable.has(cellKey(room.player))) {
    run.solution.unshift(pulled);
    run.whereThePlayerCanGetTo = nowReachable;
    return;
  }
  room.crates.set(crateId, wasAt);
  room.player = stoodAt;
}

function thePullIsWorthTrying(
  room: PullableRoom,
  run: ReversePull,
  crateIsAt: Cell,
  direction: { dx: number; dy: number },
): boolean {
  const crateGoesTo = { x: crateIsAt.x - direction.dx, y: crateIsAt.y - direction.dy };
  const playerStandsAt = { x: crateIsAt.x - 2 * direction.dx, y: crateIsAt.y - 2 * direction.dy };
  if (!isOpenFloor(room, crateGoesTo) || !isOpenFloor(room, playerStandsAt)) return false;
  if (!run.whereThePlayerCanGetTo.has(cellKey(playerStandsAt))) return false;
  return run.solution.length === 0 || run.whereThePlayerCanGetTo.has(cellKey(crateGoesTo));
}

function pullOneCrateBackwards(
  room: PullableRoom,
  crateId: string,
  direction: { dx: number; dy: number },
): CratePush {
  const crate = room.crates.get(crateId)!;
  room.crates.set(crateId, { x: crate.x - direction.dx, y: crate.y - direction.dy });
  room.player = { x: crate.x - 2 * direction.dx, y: crate.y - 2 * direction.dy };
  return { crateId, dx: direction.dx, dy: direction.dy };
}
