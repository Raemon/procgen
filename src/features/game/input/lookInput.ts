import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface LookDeps extends KeyPressDeps {
  look(step: -1 | 1): void;
}

export function listenForLookKeys(deps: LookDeps): () => void {
  return listenForKeyPresses({ KeyX: () => deps.look(1), KeyZ: () => deps.look(-1) }, deps);
}
