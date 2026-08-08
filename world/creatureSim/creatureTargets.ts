import { hashString } from '../../procgen/random/hashString';
import { CHASE, FLEE, GUARD, IDLE, PATROL } from '../../assets/creatures/behaviorKinds';
import type { CreatureDef } from '../../assets/creatures/creatureDef';
import { distanceBetween, type CreatureInstance } from './creatureInstance';

const PAUSE_SECONDS = 1.6;
const ARRIVAL_DISTANCE = 0.35;

export interface SimWorldView {
  playerX: number;
  playerY: number;
}

export function retargetCreature(
  creature: CreatureInstance,
  def: CreatureDef,
  world: SimWorldView,
  dtSeconds: number,
): void {
  creature.repathIn -= dtSeconds;
  if (chaseTargetsPlayer(creature, def, world)) return;
  if (fleeTargetsAwayFromPlayer(creature, def, world)) return;
  if (def.behavior === IDLE) return homeTarget(creature);
  if (def.behavior === PATROL) return patrolTarget(creature, def);
  if (def.behavior === GUARD && !nearHome(creature, def)) return homeTarget(creature);
  wanderTarget(creature, def);
}

function playerInSight(creature: CreatureInstance, def: CreatureDef, world: SimWorldView): boolean {
  return distanceBetween(creature.x, creature.y, world.playerX, world.playerY) <= def.sight;
}

function chaseTargetsPlayer(
  creature: CreatureInstance,
  def: CreatureDef,
  world: SimWorldView,
): boolean {
  const chases = def.behavior === CHASE || (def.behavior === GUARD && nearHome(creature, def));
  if (!chases || !playerInSight(creature, def, world)) return false;
  creature.targetX = world.playerX;
  creature.targetY = world.playerY;
  return true;
}

function fleeTargetsAwayFromPlayer(
  creature: CreatureInstance,
  def: CreatureDef,
  world: SimWorldView,
): boolean {
  if (def.behavior !== FLEE || !playerInSight(creature, def, world)) return false;
  const awayX = creature.x - world.playerX;
  const awayY = creature.y - world.playerY;
  const length = Math.max(0.001, Math.hypot(awayX, awayY));
  creature.targetX = creature.x + (awayX / length) * def.sight;
  creature.targetY = creature.y + (awayY / length) * def.sight;
  return true;
}

function nearHome(creature: CreatureInstance, def: CreatureDef): boolean {
  return distanceBetween(creature.x, creature.y, creature.homeX, creature.homeY) <= def.roam;
}

function homeTarget(creature: CreatureInstance): void {
  creature.targetX = creature.homeX;
  creature.targetY = creature.homeY;
}

function patrolTarget(creature: CreatureInstance, def: CreatureDef): void {
  if (creature.repathIn > 0 && !hasArrived(creature)) return;
  const angle = patrolAngleOf(creature);
  creature.patrolPhase = creature.patrolPhase === 1 ? -1 : 1;
  creature.repathIn = PAUSE_SECONDS;
  creature.targetX = creature.homeX + Math.cos(angle) * def.roam * creature.patrolPhase;
  creature.targetY = creature.homeY + Math.sin(angle) * def.roam * creature.patrolPhase;
}

function wanderTarget(creature: CreatureInstance, def: CreatureDef): void {
  if (creature.repathIn > 0 && !hasArrived(creature)) return;
  creature.repathIn = PAUSE_SECONDS * (0.5 + creature.rng());
  const angle = creature.rng() * Math.PI * 2;
  const reach = creature.rng() * def.roam;
  creature.targetX = creature.homeX + Math.cos(angle) * reach;
  creature.targetY = creature.homeY + Math.sin(angle) * reach;
}

function patrolAngleOf(creature: CreatureInstance): number {
  return (hashString(`patrol:${creature.key}`) % 1000) * ((Math.PI * 2) / 1000);
}

function hasArrived(creature: CreatureInstance): boolean {
  return distanceBetween(creature.x, creature.y, creature.targetX, creature.targetY) < ARRIVAL_DISTANCE;
}
