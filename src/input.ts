// Movement keys, chunkmaze-flavored: WASD + arrows step the player on the
// grid, Q/E swing the camera a quarter-turn (RotateInput's turn keys, widened
// to 90° since this world is 4-way). Steps are camera-relative — "forward" is
// whatever the 2.5d camera currently faces; the ascii view just keeps its
// camera at north.
//
// Hold-to-repeat at ~8 steps/sec: an immediate step on the press, then the
// interval. Keys are ignored while the focus is in a form control, so typing a
// tile name never walks the player.

const REPEAT_MS = 125;

export interface MovementDeps {
  /** Attempt a grid step; the world refuses blocked ones itself. */
  step(dx: number, dy: number): void;
  /** Rotate the camera a quarter-turn: -1 left (Q), +1 right (E). */
  rotate(dir: -1 | 1): void;
  /** The camera's facing as a quadrant: 0 = north, 1 = east, 2 = south, 3 = west. */
  yawQuadrant(): number;
}

/** Forward vector per quadrant (north is -y, matching the ascii view's up). */
const FWD: readonly (readonly [number, number])[] = [
  [0, -1], // N
  [1, 0], // E
  [0, 1], // S
  [-1, 0], // W
];

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target;
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  );
}

export class MovementInput {
  private fwdDown = false;
  private backDown = false;
  private leftDown = false;
  private rightDown = false;
  private timer = 0;

  constructor(private readonly deps: MovementDeps) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.stopRepeat();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'KeyQ') {
      this.deps.rotate(-1);
      return;
    }
    if (e.code === 'KeyE') {
      this.deps.rotate(1);
      return;
    }
    if (!this.setKey(e.code, true)) return;
    e.preventDefault(); // arrows scroll the page otherwise
    this.stepNow();
    this.startRepeat();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.setKey(e.code, false) && !this.anyDown()) this.stopRepeat();
  };

  private onBlur = (): void => {
    this.fwdDown = this.backDown = this.leftDown = this.rightDown = false;
    this.stopRepeat();
  };

  /** Track a movement key; returns whether the code was one of ours. */
  private setKey(code: string, down: boolean): boolean {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.fwdDown = down;
        return true;
      case 'KeyS':
      case 'ArrowDown':
        this.backDown = down;
        return true;
      case 'KeyA':
      case 'ArrowLeft':
        this.leftDown = down;
        return true;
      case 'KeyD':
      case 'ArrowRight':
        this.rightDown = down;
        return true;
      default:
        return false;
    }
  }

  private anyDown(): boolean {
    return this.fwdDown || this.backDown || this.leftDown || this.rightDown;
  }

  private startRepeat(): void {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.stepNow(), REPEAT_MS);
  }

  private stopRepeat(): void {
    clearInterval(this.timer);
    this.timer = 0;
  }

  private stepNow(): void {
    const fwd = (this.fwdDown ? 1 : 0) - (this.backDown ? 1 : 0);
    const side = (this.rightDown ? 1 : 0) - (this.leftDown ? 1 : 0);
    if (fwd === 0 && side === 0) return;
    const q = ((this.deps.yawQuadrant() % 4) + 4) % 4;
    const [fx, fy] = FWD[q]!;
    // Right-hand vector is forward rotated a quarter clockwise.
    const [rx, ry] = FWD[(q + 1) % 4]!;
    const dx = fwd * fx + side * rx;
    const dy = fwd * fy + side * ry;
    // Diagonals resolve axis-by-axis; one blocked axis still slides the other.
    if (dx !== 0 && dy !== 0) {
      this.deps.step(dx, 0);
      this.deps.step(0, dy);
    } else {
      this.deps.step(dx, dy);
    }
  }
}
