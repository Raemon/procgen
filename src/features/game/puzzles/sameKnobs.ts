import type { LabyrinthKnobs } from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';

export function sameKnobs(
  left: LabyrinthKnobs | null,
  right: LabyrinthKnobs | null,
): boolean {
  if (left === null || right === null) return left === right;
  return (Object.keys(left) as (keyof LabyrinthKnobs)[]).every(
    (name) => left[name] === right[name],
  );
}
