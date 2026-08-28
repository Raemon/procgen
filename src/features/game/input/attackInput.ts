import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface AttackDeps extends KeyPressDeps {
  attack(): void;
}

export function listenForAttackKey(deps: AttackDeps): () => void {
  return listenForKeyPresses({ KeyX: () => deps.attack() }, deps);
}
