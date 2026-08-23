import { ANY_CLIMB_ALLOWED, standableProbeFrom, type ClimbGate } from './climbing';
import { turnedFacing, type FacingIndex } from './facing';
import { nearestWalkable, type CellPoint } from './nearestWalkable';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from './vision/characterSight';
import { NOTHING_IN_THE_WAY, stepIsAllowed } from './sim/stepIsAllowed';
import { WorldEvents, type WorldEvent } from './worldEvents';

const SNAP_SEARCH_RADIUS = 64;

export type WalkabilityProbe = (x: number, y: number) => boolean;

export function walkableLandingSpot(
  x: number,
  y: number,
  isWalkableAt: WalkabilityProbe,
  climbGateAt: ClimbGate,
): CellPoint | null {
  const standable = standableProbeFrom(isWalkableAt, climbGateAt);
  if (standable(x, y)) return { x, y };
  return (
    nearestWalkable(x, y, SNAP_SEARCH_RADIUS, standable) ??
    nearestWalkable(x, y, SNAP_SEARCH_RADIUS, isWalkableAt)
  );
}

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
    private readonly climbGateAt: ClimbGate = ANY_CLIMB_ALLOWED,
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
    const rules = {
      isWalkableAt: this.isWalkableAt,
      clearTheWay: this.clearTheWay,
      climbGateAt: this.climbGateAt,
    };
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

  ensurePlayerOnWalkableGround(): void {
    const spot = walkableLandingSpot(this.playerX, this.playerY, this.isWalkableAt, this.climbGateAt);
    if (!spot || (spot.x === this.playerX && spot.y === this.playerY)) return;
    this.playerX = spot.x;
    this.playerY = spot.y;
    this.events.emit('player-moved');
  }

  on(event: WorldEvent, listener: () => void): () => void {
    return this.events.on(event, listener);
  }
}
