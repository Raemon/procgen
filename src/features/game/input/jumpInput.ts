import { listenForKeyPresses, type KeyPressDeps } from './keyPressInput';

export interface JumpDeps extends KeyPressDeps {
  jump(): void;
}

const CONTROLS_SPACE_ACTIVATES = 'button, a[href], [role="button"], [contenteditable]';

function spaceIsFreeToJump(): boolean {
  const focused = document.activeElement;
  return !(focused instanceof HTMLElement && focused.matches(CONTROLS_SPACE_ACTIVATES));
}

export function listenForJumpKey(deps: JumpDeps): () => void {
  return listenForKeyPresses({ Space: () => deps.jump() }, deps, spaceIsFreeToJump);
}
