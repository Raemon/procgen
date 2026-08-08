import type { PuzzleRoomKnobs } from '../../procgen/nodes/puzzle/puzzleRoomKnobs';

export function sameKnobs(
  left: PuzzleRoomKnobs | null,
  right: PuzzleRoomKnobs | null,
): boolean {
  if (left === null || right === null) return left === right;
  return (Object.keys(left) as (keyof PuzzleRoomKnobs)[]).every(
    (name) => left[name] === right[name],
  );
}
