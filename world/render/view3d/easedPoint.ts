const TILE_HOP_SECONDS = 0.15;
const SNAP_DISTANCE_TILES = 4;

export class EasedPoint {
  constructor(
    public x: number,
    public y: number,
  ) {}

  approach(targetX: number, targetY: number, dtSeconds: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    const maxTravel = dtSeconds / TILE_HOP_SECONDS;
    if (distance > SNAP_DISTANCE_TILES || distance <= maxTravel) {
      this.x = targetX;
      this.y = targetY;
      return;
    }
    this.x += (dx / distance) * maxTravel;
    this.y += (dy / distance) * maxTravel;
  }
}
