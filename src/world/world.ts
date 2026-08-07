import { turnedFacing, type FacingIndex } from './facing';
import { nearestWalkable } from './nearestWalkable';
import { WorldEvents, type WorldEvent } from './worldEvents';

const SNAP_SEARCH_RADIUS = 64;

export type WalkabilityProbe = (x: number, y: number) => boolean;

export class World {
  playerX = 0;
  playerY = 0;
  facing: FacingIndex = 0;
  private readonly events = new WorldEvents();

  constructor(private readonly isWalkableAt: WalkabilityProbe) {}

  turn(eighthTurns: number): void {
    this.facing = turnedFacing(this.facing, eighthTurns);
    this.events.emit('player-turned');
  }

  tryStep(dx: number, dy: number): boolean {
    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;
    if (!this.isWalkableAt(nextX, nextY)) return false;
    this.playerX = nextX;
    this.playerY = nextY;
    this.events.emit('player-moved');
    return true;
  }

  snapTo(x: number, y: number, facing: FacingIndex): void {
    const moved = this.playerX !== x || this.playerY !== y;
    const turned = this.facing !== facing;
    this.playerX = x;
    this.playerY = y;
    this.facing = facing;
    if (moved) this.events.emit('player-moved');
    if (turned) this.events.emit('player-turned');
  }

  ensurePlayerOnWalkableGround(): void {
    if (this.isWalkableAt(this.playerX, this.playerY)) return;
    const spot = nearestWalkable(this.playerX, this.playerY, SNAP_SEARCH_RADIUS, this.isWalkableAt);
    if (!spot) return;
    this.playerX = spot.x;
    this.playerY = spot.y;
    this.events.emit('player-moved');
  }

  on(event: WorldEvent, listener: () => void): () => void {
    return this.events.on(event, listener);
  }
}
