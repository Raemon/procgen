import { headingRadians } from '@/features/asset-library/characters/characterFacing';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { distanceBetween, type CreatureInstance } from './creatureInstance';

const MAX_STEP_PER_TICK = 0.5;
const MOVING_THRESHOLD_TILES = 0.0005;

export type WalkabilityProbe = (x: number, y: number) => boolean;

export function moveCreatureTowardTarget(
  creature: CreatureInstance,
  def: CreatureDef,
  isWalkableAt: WalkabilityProbe,
  dtSeconds: number,
): void {
  const distance = distanceBetween(creature.x, creature.y, creature.targetX, creature.targetY);
  if (distance < 0.001) {
    creature.moving = false;
    return;
  }
  const step = Math.min(MAX_STEP_PER_TICK, def.speed * dtSeconds);
  const stepX = ((creature.targetX - creature.x) / distance) * step;
  const stepY = ((creature.targetY - creature.y) / distance) * step;
  const fromX = creature.x;
  const fromY = creature.y;
  slideAlongOpenAxes(creature, def, isWalkableAt, stepX, stepY);
  rememberMotion(creature, creature.x - fromX, creature.y - fromY);
}

function rememberMotion(creature: CreatureInstance, movedX: number, movedY: number): void {
  creature.moving = Math.hypot(movedX, movedY) > MOVING_THRESHOLD_TILES;
  if (creature.moving) creature.heading = headingRadians(movedX, movedY);
}

function slideAlongOpenAxes(
  creature: CreatureInstance,
  def: CreatureDef,
  isWalkableAt: WalkabilityProbe,
  stepX: number,
  stepY: number,
): void {
  if (canStandAt(def, isWalkableAt, creature.x + stepX, creature.y)) creature.x += stepX;
  if (canStandAt(def, isWalkableAt, creature.x, creature.y + stepY)) creature.y += stepY;
}

function canStandAt(
  def: CreatureDef,
  isWalkableAt: WalkabilityProbe,
  x: number,
  y: number,
): boolean {
  return def.phasing === 1 || isWalkableAt(Math.round(x), Math.round(y));
}
