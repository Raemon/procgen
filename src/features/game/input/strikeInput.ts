import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface StrikeDeps extends KeyPressDeps {
  strike(): void;
}

export function listenForStrikeKey(deps: StrikeDeps): () => void {
  return listenForKeyPresses({ KeyC: () => deps.strike() }, deps);
}
