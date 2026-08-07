import type { RandomStream } from '../../../procgen/random/mulberry32';
import {
  canWalkBetween,
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
  const solution: CratePush[] = [];
  const crateIds = [...room.crates.keys()];
  const attempts = pulls * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts && solution.length < pulls; attempt++) {
    const crateId = crateIds[Math.floor(rng() * crateIds.length)]!;
    const direction = CRATE_DIRECTIONS[Math.floor(rng() * CRATE_DIRECTIONS.length)]!;
    keepThePullIfItStaysSolvable(room, entrances, solution, crateId, direction);
  }
  return solution;
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
