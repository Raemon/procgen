import {
  hasModifier,
  isTypingInFormControl,
  movementAxisForKey,
  type MovementAxis,
} from './movementKeys';

const HOLD_REPEAT_MS = 125;

export interface MovementDeps {
  moveIntent(forwardInput: number, strafeInput: number): void;
  moveReleased(): void;
  rotate(direction: -1 | 1): void;
  isSuspended(): boolean;
}

const ROTATION_KEYS: Readonly<Record<string, -1 | 1>> = {
  KeyA: -1,
  ArrowLeft: -1,
  KeyD: 1,
  ArrowRight: 1,
};

export class MovementInput {
  private readonly heldAxes = new Set<MovementAxis>();
  private repeatTimer = 0;

  constructor(private readonly deps: MovementDeps) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  releaseHeldKeys(): void {
    if (this.heldAxes.size === 0) return;
    this.heldAxes.clear();
    this.releaseAll();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.stopRepeating();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (this.deps.isSuspended()) return;
    const rotation = ROTATION_KEYS[event.code];
    if (rotation) {
      event.preventDefault();
      this.deps.rotate(rotation);
      return;
    }
    const axis = movementAxisForKey(event.code);
    if (!axis) return;
    event.preventDefault();
    this.heldAxes.add(axis);
    this.stepOnce();
    this.startRepeating();
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const axis = movementAxisForKey(event.code);
    if (!axis) return;
    this.heldAxes.delete(axis);
    if (this.heldAxes.size === 0) this.releaseAll();
  };

  private onBlur = (): void => {
    this.releaseHeldKeys();
  };

  private releaseAll(): void {
    this.stopRepeating();
    this.deps.moveReleased();
  }

  private startRepeating(): void {
    if (this.repeatTimer) return;
    this.repeatTimer = window.setInterval(() => this.stepOnce(), HOLD_REPEAT_MS);
  }

  private stopRepeating(): void {
    clearInterval(this.repeatTimer);
    this.repeatTimer = 0;
  }

  private stepOnce(): void {
    this.deps.moveIntent(this.axisInput('forward', 'back'), this.axisInput('right', 'left'));
  }

  private axisInput(positive: MovementAxis, negative: MovementAxis): number {
    return (this.heldAxes.has(positive) ? 1 : 0) - (this.heldAxes.has(negative) ? 1 : 0);
  }
}
