import { turnedFacing, type FacingIndex } from './facing';
import { spotIsTooPennedInToStandIn } from './spawn/spawnRoominess';
import { spawnWithRoomToMove } from './spawn/spawnWithRoomToMove';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from './vision/characterSight';
import { NOTHING_IN_THE_WAY, stepIsAllowed } from './sim/stepIsAllowed';
import { WorldEvents, type WorldEvent } from './worldEvents';

const SNAP_SEARCH_RADIUS = 64;

export type WalkabilityProbe = (x: number, y: number) => boolean;

export type ObstacleResolver = (
  x: number,
  y: number,
  dx: number,
  dy: number,
  mayPush: boolean,
) => boolean;

export class World {
  playerX = 0;
  playerY = 0;
  facing: FacingIndex = 0;
  sightRadiusTiles = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
  private readonly events = new WorldEvents();

  constructor(
    private readonly isWalkableAt: WalkabilityProbe,
    private readonly clearTheWay: ObstacleResolver = NOTHING_IN_THE_WAY,
  ) {}

  setSightRadiusTiles(radius: number): void {
    const clamped = clampSightRadiusTiles(radius);
    if (clamped === this.sightRadiusTiles) return;
    this.sightRadiusTiles = clamped;
    this.events.emit('sight-changed');
  }

  turn(eighthTurns: number): void {
    this.facing = turnedFacing(this.facing, eighthTurns);
    this.events.emit('player-turned');
  }

  tryStep(dx: number, dy: number, mayPush = true): boolean {
    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;
    const rules = { isWalkableAt: this.isWalkableAt, clearTheWay: this.clearTheWay };
    if (!stepIsAllowed(rules, nextX, nextY, dx, dy, mayPush)) return false;
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

  ensurePlayerHasRoomToMove(): void {
    if (!spotIsTooPennedInToStandIn(this.isWalkableAt, { x: this.playerX, y: this.playerY })) return;
    const spot = spawnWithRoomToMove(
      this.isWalkableAt,
      { x: this.playerX, y: this.playerY },
      SNAP_SEARCH_RADIUS,
    );
    if (!spot) return;
    this.playerX = spot.x;
    this.playerY = spot.y;
    this.events.emit('player-moved');
  }

  on(event: WorldEvent, listener: () => void): () => void {
    return this.events.on(event, listener);
  }
}
