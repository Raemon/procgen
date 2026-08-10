import { hasModifier, isTypingInFormControl } from './movementKeys';

const USE_KEY = 'KeyF';
const RESET_KEY = 'KeyR';

export interface UseFixtureDeps {
  use(): void;
  resetRoom(): void;
  isSuspended(): boolean;
}

export class UseFixtureInput {
  constructor(private readonly deps: UseFixtureDeps) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== USE_KEY && event.code !== RESET_KEY) return;
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (this.deps.isSuspended()) return;
    event.preventDefault();
    if (event.code === USE_KEY) this.deps.use();
    else this.deps.resetRoom();
  };
}
