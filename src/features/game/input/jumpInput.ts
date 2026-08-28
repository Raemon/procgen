import { hasModifier, isTypingInFormControl } from './movementKeys';

const JUMP_KEY = 'Space';

export interface JumpDeps {
  jump(): void;
  isSuspended(): boolean;
}

const CONTROLS_SPACE_ACTIVATES = 'button, a[href], [role="button"], [contenteditable]';

function spaceActivatesTheFocusedControl(): boolean {
  const focused = document.activeElement;
  return focused instanceof HTMLElement && focused.matches(CONTROLS_SPACE_ACTIVATES);
}

export class JumpInput {
  constructor(private readonly deps: JumpDeps) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== JUMP_KEY) return;
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (spaceActivatesTheFocusedControl()) return;
    if (this.deps.isSuspended()) return;
    event.preventDefault();
    this.deps.jump();
  };
}
