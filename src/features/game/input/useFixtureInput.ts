import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface UseFixtureDeps extends KeyPressDeps {
  use(): void;
  reset(): void;
}

export interface ResetRules {
  resetGrowsAFreshWorldAt(x: number, y: number): boolean;
}

export function listenForFixtureKeys(deps: UseFixtureDeps): () => void {
  return listenForKeyPresses({ KeyF: () => deps.use(), KeyR: () => deps.reset() }, deps);
}

export function resetKeyAction(
  rules: ResetRules,
  x: number,
  y: number,
  characterControlled: boolean,
): string {
  if (rules.resetGrowsAFreshWorldAt(x, y)) return 'regrow_world';
  return characterControlled ? 'reset_room' : 'reset_puzzle_room';
}
