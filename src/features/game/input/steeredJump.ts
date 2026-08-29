import type { FacingIndex } from '../facing';
import { JUMP_UP, type JumpRequest } from '../sim/movementOrder';

export const JUMP_STEER_GRACE_MS = 120;

export interface JumpTimekeeper {
  now(): number;
  after(ms: number, run: () => void): () => void;
}

const WALL_CLOCK: JumpTimekeeper = {
  now: () => Date.now(),
  after: (ms, run) => {
    const timer = setTimeout(run, ms);
    return () => clearTimeout(timer);
  },
};

export class SteeredJump {
  private heldDir: FacingIndex | null = null;
  private taggedDir: FacingIndex | null = null;
  private taggedAt = -Infinity;
  private cancelWait: (() => void) | null = null;

  constructor(
    private readonly launch: (jump: JumpRequest) => void,
    private readonly clock: JumpTimekeeper = WALL_CLOCK,
  ) {}

  hold(dir: FacingIndex): void {
    this.heldDir = dir;
    if (this.cancelWait) this.launchNow(dir);
  }

  release(): void {
    if (this.heldDir === null) return;
    this.taggedDir = this.heldDir;
    this.taggedAt = this.clock.now();
    this.heldDir = null;
  }

  request(): void {
    if (this.cancelWait) return;
    const dir = this.heldDir ?? this.justReleasedDir();
    if (dir !== null) {
      this.launchNow(dir);
      return;
    }
    this.cancelWait = this.clock.after(JUMP_STEER_GRACE_MS, () => this.launchNow(JUMP_UP));
  }

  private stopWaiting(): void {
    this.cancelWait?.();
    this.cancelWait = null;
  }

  private justReleasedDir(): FacingIndex | null {
    return this.clock.now() - this.taggedAt <= JUMP_STEER_GRACE_MS ? this.taggedDir : null;
  }

  private launchNow(jump: JumpRequest): void {
    this.stopWaiting();
    this.taggedAt = -Infinity;
    this.launch(jump);
  }
}
