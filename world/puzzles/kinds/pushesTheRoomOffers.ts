import {
  cellKey,
  cellsReachableFrom,
  isOpenFloor,
  CRATE_DIRECTIONS,
  type CrateFloorSpace,
} from './crateFloorSpace';
import type { CratePush } from './puzzleKind';
import type { Cell } from './roomCells';

export function pushesTheRoomOffers(space: CrateFloorSpace, player: Cell): CratePush[] {
  const withinReach = cellsReachableFrom(space, player);
  const offered: CratePush[] = [];
  for (const [crateId, crate] of space.crates) {
    for (const push of CRATE_DIRECTIONS) {
      if (!thePlayerCouldMakeThisPush(space, withinReach, crate, push)) continue;
      offered.push({ crateId, dx: push.dx, dy: push.dy });
    }
  }
  return offered;
}

export function pushesThatStrandACrate(
  space: CrateFloorSpace,
  player: Cell,
  stranding: ReadonlySet<string>,
): CratePush[] {
  return pushesTheRoomOffers(space, player).filter((push) => {
    const crate = space.crates.get(push.crateId)!;
    return stranding.has(cellKey({ x: crate.x + push.dx, y: crate.y + push.dy }));
  });
}

function thePlayerCouldMakeThisPush(
  space: CrateFloorSpace,
  withinReach: ReadonlySet<string>,
  crate: Cell,
  push: { dx: number; dy: number },
): boolean {
  const crateLandsOn = { x: crate.x + push.dx, y: crate.y + push.dy };
  if (!isOpenFloor(space, crateLandsOn)) return false;
  return withinReach.has(cellKey({ x: crate.x - push.dx, y: crate.y - push.dy }));
}
