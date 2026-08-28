import type { FacingIndex } from '../facing';

export const JUMP_STEER_GRACE_MS = 120;

export interface JumpTimekeeper {
  now(): number;
  after(ms: number, run: () => void): () => void;
}

export const WALL_CLOCK_TIMEKEEPER: JumpTimekeeper = {
  now: () => Date.now(),
  after: (ms, run) => {
    const timer = setTimeout(run, ms);
    return () => clearTimeout(timer);
  },
};

export class SteeredJump {
  private heldDir: FacingIndex | null = null;
  private lastDir: FacingIndex | null = null;
  private releasedAt = -Infinity;
  private cancelWait: (() => void) | null = null;

  constructor(
    private readonly launch: (dir: FacingIndex | null) => void,
    private readonly clock: JumpTimekeeper = WALL_CLOCK_TIMEKEEPER,
  ) {}

  hold(dir: FacingIndex): void {
    this.heldDir = dir;
    this.lastDir = dir;
    if (this.cancelWait) this.launchNow(dir);
  }

  release(): void {
    if (this.heldDir !== null) this.releasedAt = this.clock.now();
    this.heldDir = null;
  }

  request(): void {
    if (this.cancelWait) return;
    const dir = this.heldDir ?? this.justReleasedDir();
    if (dir !== null) {
      this.launch(dir);
      return;
    }
    this.cancelWait = this.clock.after(JUMP_STEER_GRACE_MS, () => this.launchNow(null));
  }

  private justReleasedDir(): FacingIndex | null {
    return this.clock.now() - this.releasedAt <= JUMP_STEER_GRACE_MS ? this.lastDir : null;
  }

  private launchNow(dir: FacingIndex | null): void {
    this.cancelWait?.();
    this.cancelWait = null;
    this.launch(dir);
  }
}
