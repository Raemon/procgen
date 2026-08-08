import type { RandomStream } from '../../../procgen/random/mulberry32';
import {
  canWalkBetween,
  cellKey,
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

const ATTEMPTS_PER_PULL = 8;

export function reversePullCrates(
  room: PullableRoom,
  entrances: readonly Cell[],
  pulls: number,
  rng: RandomStream,
): CratePush[] {
  const plates = new Set([...room.crates.values()].map(cellKey));
  const solution: CratePush[] = [];
  const crateIds = [...room.crates.keys()];
  const attempts = pulls * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts && solution.length < pulls; attempt++) {
    const crateId = crateIds[Math.floor(rng() * crateIds.length)]!;
    const direction = CRATE_DIRECTIONS[Math.floor(rng() * CRATE_DIRECTIONS.length)]!;
    keepThePullIfItStaysSolvable(room, entrances, solution, crateId, direction);
  }
  dragEveryCrateOffAPlate(room, entrances, solution, plates, rng);
  return solution;
}

export function cratesStillOnPlates(room: PullableRoom, plates: ReadonlySet<string>): string[] {
  return [...room.crates]
    .filter(([, cell]) => plates.has(cellKey(cell)))
    .map(([crateId]) => crateId);
}

function dragEveryCrateOffAPlate(
  room: PullableRoom,
  entrances: readonly Cell[],
  solution: CratePush[],
  plates: ReadonlySet<string>,
  rng: RandomStream,
): void {
  const attempts = plates.size * CRATE_DIRECTIONS.length * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const resting = cratesStillOnPlates(room, plates);
    if (resting.length === 0) return;
    const crateId = resting[Math.floor(rng() * resting.length)]!;
    const direction = CRATE_DIRECTIONS[Math.floor(rng() * CRATE_DIRECTIONS.length)]!;
    keepThePullIfItStaysSolvable(room, entrances, solution, crateId, direction);
  }
}

function keepThePullIfItStaysSolvable(
  room: PullableRoom,
  entrances: readonly Cell[],
  solution: CratePush[],
  crateId: string,
  direction: { dx: number; dy: number },
): void {
  const wasAt = room.crates.get(crateId)!;
  const stoodAt = room.player;
  const pulled = pullOneCrateBackwards(room, crateId, direction);
  if (!pulled) return;
  solution.unshift(pulled);
  if (entrances.every((entrance) => forwardSolutionWorks(room, entrance, solution))) return;
  solution.shift();
  room.crates.set(crateId, wasAt);
  room.player = stoodAt;
}

function pullOneCrateBackwards(
  room: PullableRoom,
  crateId: string,
  direction: { dx: number; dy: number },
): CratePush | null {
  const crate = room.crates.get(crateId)!;
  const crateGoesTo = { x: crate.x - direction.dx, y: crate.y - direction.dy };
  const playerStandsAt = { x: crate.x - 2 * direction.dx, y: crate.y - 2 * direction.dy };
  if (!isOpenFloor(room, crateGoesTo) || !isOpenFloor(room, playerStandsAt)) return null;
  if (!canWalkBetween(room, room.player, playerStandsAt)) return null;
  room.crates.set(crateId, crateGoesTo);
  room.player = playerStandsAt;
  return { crateId, dx: direction.dx, dy: direction.dy };
}
