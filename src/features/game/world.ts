import { turnedFacing, type FacingIndex } from './facing';
import { nearestWalkable, type CellPoint } from './nearestWalkable';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from './vision/characterSight';
import { DEFAULT_GOD_VIEW_SIZE_TILES, clampGodViewSizeTiles } from './vision/godViewSize';
import { jumpLandingDelta } from './sim/jumpLanding';
import { isAxisStep, type StepRules } from './sim/stepIsAllowed';
import { WorldEvents, type WorldEvent } from './worldEvents';

const SNAP_SEARCH_RADIUS = 64;

export type CellProbe = (x: number, y: number) => boolean;

export function walkableLandingSpot(
  x: number,
  y: number,
  isWalkableAt: CellProbe,
  isStandableAt: CellProbe,
): CellPoint | null {
  if (isStandableAt(x, y)) return { x, y };
  return (
    nearestWalkable(x, y, SNAP_SEARCH_RADIUS, isStandableAt) ??
    nearestWalkable(x, y, SNAP_SEARCH_RADIUS, isWalkableAt)
  );
}

export class World {
  playerX = 0;
  playerY = 0;
  facing: FacingIndex = 0;
  sightRadiusTiles = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
  godViewSizeTiles = DEFAULT_GOD_VIEW_SIZE_TILES;
  private readonly events = new WorldEvents();

  constructor(private readonly rules: StepRules) {}

  setSightRadiusTiles(radius: number): void {
    const clamped = clampSightRadiusTiles(radius);
    if (clamped === this.sightRadiusTiles) return;
    this.sightRadiusTiles = clamped;
    this.events.emit('sight-changed');
  }

  setGodViewSizeTiles(sizeTiles: number): void {
    const clamped = clampGodViewSizeTiles(sizeTiles);
    if (clamped === this.godViewSizeTiles) return;
    this.godViewSizeTiles = clamped;
    this.events.emit('sight-changed');
  }

  turn(eighthTurns: number): void {
    this.facing = turnedFacing(this.facing, eighthTurns);
    this.events.emit('player-turned');
  }

  stepRules(): StepRules {
    return this.rules;
  }

  tryStep(dx: number, dy: number, mayPush = isAxisStep(dx, dy)): boolean {
    const from = { x: this.playerX, y: this.playerY };
    const to = { x: from.x + dx, y: from.y + dy };
    if (!this.rules.step(from, to, dx, dy, mayPush, true).allowed) return false;
    this.playerX = to.x;
    this.playerY = to.y;
    this.events.emit('player-moved');
    return true;
  }

  explainStep(dx: number, dy: number, mayPush = isAxisStep(dx, dy)): string | null {
    const from = { x: this.playerX, y: this.playerY };
    const verdict = this.rules.step(from, { x: from.x + dx, y: from.y + dy }, dx, dy, mayPush, false);
    return verdict.allowed ? null : verdict.why;
  }

  tryJump(dx: number, dy: number): boolean {
    const delta = jumpLandingDelta(this.rules, this.playerX, this.playerY, dx, dy);
    if (!delta) return false;
    this.landAfterJump(delta.dx, delta.dy);
    return true;
  }

  landAfterJump(dx: number, dy: number): void {
    this.events.emit('player-jumped');
    if (dx === 0 && dy === 0) return;
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
    const spot = walkableLandingSpot(
      this.playerX,
      this.playerY,
      (x, y) => this.rules.isWalkableAt(x, y),
      (x, y) => this.rules.isStandableAt(x, y),
    );
    if (!spot || (spot.x === this.playerX && spot.y === this.playerY)) return;
    this.playerX = spot.x;
    this.playerY = spot.y;
    this.events.emit('player-moved');
  }

  on(event: WorldEvent, listener: () => void): () => void {
    return this.events.on(event, listener);
  }
}
