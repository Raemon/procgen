import { hashString } from '@/features/asset-library/worlds/random/hashString';
import { headingRadians } from '@/features/asset-library/characters/characterFacing';
import { CHASE, FLEE, GUARD, IDLE, PATROL } from '@/features/asset-library/creatures/behaviorKinds';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { distanceBetween, type CreatureInstance } from './creatureInstance';

const PAUSE_SECONDS = 1.6;
const ARRIVAL_DISTANCE = 0.35;
const CHASE_STANDOFF_TILES = 1;
const STRIKE_RANGE_TILES = 1.6;

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
  creature.attacking = false;
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
  const towardPlayerX = world.playerX - creature.x;
  const towardPlayerY = world.playerY - creature.y;
  const gap = Math.hypot(towardPlayerX, towardPlayerY);
  if (gap <= STRIKE_RANGE_TILES) {
    creature.attacking = true;
    creature.heading = headingRadians(towardPlayerX, towardPlayerY);
  }
  aimAlong(creature, towardPlayerX, towardPlayerY, Math.max(0, gap - CHASE_STANDOFF_TILES));
  return true;
}

function fleeTargetsAwayFromPlayer(
  creature: CreatureInstance,
  def: CreatureDef,
  world: SimWorldView,
): boolean {
  if (def.behavior !== FLEE || !playerInSight(creature, def, world)) return false;
  aimAlong(creature, creature.x - world.playerX, creature.y - world.playerY, def.sight);
  return true;
}

function aimAlong(creature: CreatureInstance, dirX: number, dirY: number, reach: number): void {
  const length = Math.max(0.001, Math.hypot(dirX, dirY));
  creature.targetX = creature.x + (dirX / length) * reach;
  creature.targetY = creature.y + (dirY / length) * reach;
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
