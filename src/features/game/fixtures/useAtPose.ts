import { facingVector, type FacingIndex } from '../facing';
import type { MineSlots } from '../worldRules';
import type { KeyPurse } from './keyPurse';
import type { UseOutcome } from './useOutcome';

export interface FixtureUser {
  use(x: number, y: number, mine: MineSlots, purse: KeyPurse): UseOutcome;
}

export function useHereOrAhead(
  rules: FixtureUser,
  x: number,
  y: number,
  facing: FacingIndex,
  mine: MineSlots,
  purse: KeyPurse,
): UseOutcome {
  const underfoot = rules.use(x, y, mine, purse);
  if (underfoot.ok || underfoot.code !== 'nothing_to_use') return underfoot;
  const ahead = facingVector(facing);
  return rules.use(x + ahead.dx, y + ahead.dy, mine, purse);
}
