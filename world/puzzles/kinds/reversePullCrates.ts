import type { RandomStream } from '../../../procgen/random/mulberry32';
import type { CratePush } from './puzzleKind';
import type { Cell, RoomCells } from './roomCells';

export interface PullableRoom {
  cells: RoomCells;
  pillars: Set<string>;
  crates: Map<string, Cell>;
  player: Cell;
}

const DIRECTIONS: readonly { dx: number; dy: number }[] = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

const ATTEMPTS_PER_PULL = 8;

export function reversePullCrates(
  room: PullableRoom,
  pulls: number,
  rng: RandomStream,
): CratePush[] {
  const solution: CratePush[] = [];
  const crateIds = [...room.crates.keys()];
  const attempts = pulls * ATTEMPTS_PER_PULL;
  for (let attempt = 0; attempt < attempts && solution.length < pulls; attempt++) {
    const crateId = crateIds[Math.floor(rng() * crateIds.length)]!;
    const direction = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)]!;
    const pulled = pullOneCrateBackwards(room, crateId, direction);
    if (pulled) solution.unshift(pulled);
  }
  return solution;
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
  if (!playerCanWalkTo(room, playerStandsAt)) return null;
  room.crates.set(crateId, crateGoesTo);
  room.player = playerStandsAt;
  return { crateId, dx: direction.dx, dy: direction.dy };
}

function isOpenFloor(room: PullableRoom, cell: Cell): boolean {
  if (!room.cells.contains(cell.x, cell.y)) return false;
  if (room.pillars.has(cellKey(cell))) return false;
  return ![...room.crates.values()].some((crate) => crate.x === cell.x && crate.y === cell.y);
}

function playerCanWalkTo(room: PullableRoom, goal: Cell): boolean {
  const seen = new Set<string>([cellKey(room.player)]);
  const queue: Cell[] = [room.player];
  while (queue.length > 0) {
    const here = queue.shift()!;
    if (here.x === goal.x && here.y === goal.y) return true;
    for (const step of DIRECTIONS) {
      const next = { x: here.x + step.dx, y: here.y + step.dy };
      if (seen.has(cellKey(next)) || !isOpenFloor(room, next)) continue;
      seen.add(cellKey(next));
      queue.push(next);
    }
  }
  return false;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}
