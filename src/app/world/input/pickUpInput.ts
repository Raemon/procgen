import { hasModifier, isTypingInFormControl } from './movementKeys';

const PICK_UP_KEY = 'KeyG';

export interface PickUpDeps {
  pickUp(): void;
  isSuspended(): boolean;
}

export class PickUpInput {
  constructor(private readonly deps: PickUpDeps) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== PICK_UP_KEY) return;
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (this.deps.isSuspended()) return;
    event.preventDefault();
    this.deps.pickUp();
  };
}
