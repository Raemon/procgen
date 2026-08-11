import { canWalkBetween, isOpenFloor, type CrateFloorSpace } from './crateFloorSpace';
import type { CratePush } from './puzzleKind';
import type { Cell } from './roomCells';

export function forwardSolutionWorks(
  space: CrateFloorSpace,
  entrance: Cell,
  solution: readonly CratePush[],
): boolean {
  const crates = new Map(space.crates);
  const walked: CrateFloorSpace = { ...space, crates };
  let player = entrance;
  for (const push of solution) {
    const crate = crates.get(push.crateId)!;
    const pushFrom = { x: crate.x - push.dx, y: crate.y - push.dy };
    const crateEndsAt = { x: crate.x + push.dx, y: crate.y + push.dy };
    if (!canWalkBetween(walked, player, pushFrom)) return false;
    if (!isOpenFloor(walked, crateEndsAt)) return false;
    crates.set(push.crateId, crateEndsAt);
    player = crate;
  }
  return true;
}
