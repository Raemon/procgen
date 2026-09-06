import type { CrateFloorSpace } from './crateFloorSpace';
import { pushesTheRoomOffers, pushesThatStrandACrate } from './pushesTheRoomOffers';
import type { CratePush } from './puzzleKind';
import type { Cell } from './roomCells';
import { squaresACrateCannotComeBackFrom } from './squaresACrateCannotComeBackFrom';

const RUIN_ASKED_FOR_PER_LEVEL = 0.03;
const MOST_RUIN_WORTH_HUNTING_FOR = 0.15;

export function chanceToRuinTheRoom(
  space: CrateFloorSpace,
  standingAt: Cell,
  plates: readonly Cell[],
): number {
  const offered = pushesTheRoomOffers(space, standingAt);
  if (offered.length === 0) return 0;
  const stranding = squaresACrateCannotComeBackFrom(space, plates);
  return pushesThatStrandACrate(space, standingAt, stranding).length / offered.length;
}

export function ruinChanceWantedAt(level: number): number {
  return Math.min(level * RUIN_ASKED_FOR_PER_LEVEL, MOST_RUIN_WORTH_HUNTING_FOR);
}

export function timesTheSolutionChangesCrate(solution: readonly CratePush[]): number {
  let changes = 0;
  for (let index = 1; index < solution.length; index++) {
    if (solution[index]!.crateId !== solution[index - 1]!.crateId) changes++;
  }
  return changes;
}
