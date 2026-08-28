import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface UseFixtureDeps extends KeyPressDeps {
  use(): void;
  resetRoom(): void;
}

export function listenForFixtureKeys(deps: UseFixtureDeps): () => void {
  return listenForKeyPresses({ KeyF: () => deps.use(), KeyR: () => deps.resetRoom() }, deps);
}
