import type { WalkableProbe } from './interaction/pushCrate';

export interface PushablePlaces {
  couldPushInto(x: number, y: number, dx: number, dy: number): boolean;
}

export function playerCanEnter(
  isWalkableAt: WalkableProbe,
  puzzles: PushablePlaces,
  standingAt: () => { x: number; y: number },
): WalkableProbe {
  return (x, y) => {
    if (isWalkableAt(x, y)) return true;
    const from = standingAt();
    return puzzles.couldPushInto(x, y, Math.sign(x - from.x), Math.sign(y - from.y));
  };
}
