const ARC_HEIGHT = 1;
const ARC_SECONDS = 0.32;

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

  elevationOver(landingGround: number): number {
    const progress = this.elapsedSeconds / ARC_SECONDS;
    const ground = this.takeoffGround + (landingGround - this.takeoffGround) * progress;
    return ground + ARC_HEIGHT * 4 * progress * (1 - progress);
  }
}
