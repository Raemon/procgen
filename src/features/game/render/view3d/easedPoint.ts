const TILE_HOP_SECONDS = 0.15;
const SNAP_DISTANCE_TILES = 4;

export class EasedPoint {
  constructor(
    public x: number,
    public y: number,
  ) {}

  approach(targetX: number, targetY: number, dtSeconds: number): void {
    this.travel(targetX, targetY, dtSeconds / TILE_HOP_SECONDS);
  }

  glideTo(targetX: number, targetY: number, dtSeconds: number, secondsLeft: number): void {
    const distance = Math.hypot(targetX - this.x, targetY - this.y);
    this.travel(targetX, targetY, (distance * dtSeconds) / Math.max(secondsLeft, dtSeconds));
  }

  private travel(targetX: number, targetY: number, maxTravel: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    if (distance > SNAP_DISTANCE_TILES || distance <= maxTravel) {
      this.x = targetX;
      this.y = targetY;
      return;
    }
    this.x += (dx / distance) * maxTravel;
    this.y += (dy / distance) * maxTravel;
  }
}
