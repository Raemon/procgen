import { facingVector, type FacingIndex } from '../../facing';
import type { UseOutcome } from './useFixture';

export interface FixtureUser {
  use(x: number, y: number): UseOutcome;
}

export function useHereOrAhead(
  puzzles: FixtureUser,
  x: number,
  y: number,
  facing: FacingIndex,
): UseOutcome {
  const underfoot = puzzles.use(x, y);
  if (underfoot.ok || underfoot.code !== 'nothing_to_use') return underfoot;
  const ahead = facingVector(facing);
  return puzzles.use(x + ahead.dx, y + ahead.dy);
}
