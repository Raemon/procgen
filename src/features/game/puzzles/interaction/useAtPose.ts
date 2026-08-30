import { facingVector, type FacingIndex } from '../../facing';
import { NO_KEYS, type KeyPurse } from './keyPurse';
import type { UseOutcome } from './useFixture';

export interface FixtureUser {
  use(x: number, y: number, purse?: KeyPurse): UseOutcome;
}

export function useHereOrAhead(
  puzzles: FixtureUser,
  x: number,
  y: number,
  facing: FacingIndex,
  purse: KeyPurse = NO_KEYS,
): UseOutcome {
  const underfoot = puzzles.use(x, y, purse);
  if (underfoot.ok || underfoot.code !== 'nothing_to_use') return underfoot;
  const ahead = facingVector(facing);
  return puzzles.use(x + ahead.dx, y + ahead.dy, purse);
}
