import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface PickUpDeps extends KeyPressDeps {
  pickUp(): void;
}

export function listenForPickUpKey(deps: PickUpDeps): () => void {
  return listenForKeyPresses({ KeyG: () => deps.pickUp() }, deps);
}
