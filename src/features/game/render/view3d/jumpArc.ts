import { JUMP_COOLDOWN_TICKS, TICK_MS } from '../../sim/movementOrder';

const ARC_HEIGHT = 1.7;
const ARC_SECONDS = (JUMP_COOLDOWN_TICKS * TICK_MS) / 1000;

export class JumpArc {
  private elapsedSeconds = ARC_SECONDS;
  private takeoffGround = 0;

  launch(groundBeneath: number): void {
    this.elapsedSeconds = 0;
    this.takeoffGround = groundBeneath;
  }

  advance(dtSeconds: number): void {
    this.elapsedSeconds = Math.min(ARC_SECONDS, this.elapsedSeconds + dtSeconds);
  }

  airborne(): boolean {
    return this.elapsedSeconds < ARC_SECONDS;
  }

  secondsRemaining(): number {
    return ARC_SECONDS - this.elapsedSeconds;
  }

  elevationOver(landingGround: number): number {
    const progress = this.elapsedSeconds / ARC_SECONDS;
    const ground = this.takeoffGround + (landingGround - this.takeoffGround) * progress;
    return ground + ARC_HEIGHT * 4 * progress * (1 - progress);
  }
}
