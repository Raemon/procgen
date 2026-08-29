const TILE_HOP_SECONDS = 0.15;
const SNAP_DISTANCE_TILES = 4;

export class EasedPoint {
  constructor(
    public x: number,
    public y: number,
  ) {}

  approach(targetX: number, targetY: number, dtSeconds: number): void {
    this.travel(targetX, targetY, (distance) => Math.min(distance, dtSeconds / TILE_HOP_SECONDS));
  }

  glideTo(targetX: number, targetY: number, dtSeconds: number, secondsLeft: number): void {
    this.travel(targetX, targetY, (distance) => (distance * dtSeconds) / Math.max(secondsLeft, dtSeconds));
  }

  private travel(targetX: number, targetY: number, pace: (distance: number) => number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    const maxTravel = pace(distance);
    if (distance > SNAP_DISTANCE_TILES || distance <= maxTravel) {
      this.x = targetX;
      this.y = targetY;
      return;
    }
    this.x += (dx / distance) * maxTravel;
    this.y += (dy / distance) * maxTravel;
  }
}
