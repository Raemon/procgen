import { ANY_CLIMB_ALLOWED, standableProbeFrom, type ClimbGate } from './climbing';
import { turnedFacing, type FacingIndex } from './facing';
import { nearestWalkable, type CellPoint } from './nearestWalkable';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from './vision/characterSight';
import { jumpLandingDelta } from './sim/jumpLanding';
import { NOTHING_IN_THE_WAY, stepIsAllowed, type StepRules } from './sim/stepIsAllowed';
import type { StepDelta } from './sim/tickMovement';
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
    private readonly jumpGateAt: ClimbGate = climbGateAt,
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

  stepRules(): StepRules {
    return {
      isWalkableAt: this.isWalkableAt,
      clearTheWay: this.clearTheWay,
      climbGateAt: this.climbGateAt,
      jumpGateAt: this.jumpGateAt,
    };
  }

  tryStep(dx: number, dy: number, mayPush = true): boolean {
    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;
    if (!stepIsAllowed(this.stepRules(), nextX, nextY, dx, dy, mayPush)) return false;
    this.playerX = nextX;
    this.playerY = nextY;
    this.events.emit('player-moved');
    return true;
  }

  jumpLandingFrom(fromX: number, fromY: number, dx: number, dy: number): StepDelta | null {
    return jumpLandingDelta(this.stepRules(), fromX, fromY, dx, dy);
  }

  tryJump(dx: number, dy: number): boolean {
    const delta = this.jumpLandingFrom(this.playerX, this.playerY, dx, dy);
    if (!delta) return false;
    this.landAfterJump(delta.dx, delta.dy);
    this.events.emit('player-jumped');
    return true;
  }

  landAfterJump(dx: number, dy: number): void {
    this.playerX += dx;
    this.playerY += dy;
    this.events.emit('player-moved');
  }

  announceJump(): void {
    this.events.emit('player-jumped');
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
