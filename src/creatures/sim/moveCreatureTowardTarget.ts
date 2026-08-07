import type { CreatureDef } from '../creatureDef';
import { distanceBetween, type CreatureInstance } from './creatureInstance';

const MAX_STEP_PER_TICK = 0.5;

export type WalkabilityProbe = (x: number, y: number) => boolean;

export function moveCreatureTowardTarget(
  creature: CreatureInstance,
  def: CreatureDef,
  isWalkableAt: WalkabilityProbe,
  dtSeconds: number,
): void {
  const distance = distanceBetween(creature.x, creature.y, creature.targetX, creature.targetY);
  if (distance < 0.001) return;
  const step = Math.min(MAX_STEP_PER_TICK, def.speed * dtSeconds);
  const stepX = ((creature.targetX - creature.x) / distance) * step;
  const stepY = ((creature.targetY - creature.y) / distance) * step;
  slideAlongOpenAxes(creature, def, isWalkableAt, stepX, stepY);
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
