import { hashString } from '@/features/asset-library/worlds/random/hashString';
import { CHASE, FLEE, GUARD, IDLE, PATROL } from '@/features/asset-library/creatures/behaviorKinds';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { distanceBetween, type CreatureInstance } from './creatureInstance';
import type { CombatActor } from './combatEvents';

const PAUSE_SECONDS = 1.6;
const ARRIVAL_DISTANCE = 0.35;
const CHASE_STANDOFF_TILES = 1;

export interface SimWorldView {
  actors(): readonly CombatActor[];
}

export function nearestActorTo(x: number, y: number, world: SimWorldView): CombatActor | null {
  let nearest: CombatActor | null = null;
  let nearestDistance = Infinity;
  for (const actor of world.actors()) {
    const distance = distanceBetween(x, y, actor.x, actor.y);
    if (distance < nearestDistance) {
      nearest = actor;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function retargetCreature(
  creature: CreatureInstance,
  def: CreatureDef,
  world: SimWorldView,
  dtSeconds: number,
): void {
  creature.repathIn -= dtSeconds;
  const nearest = nearestActorTo(creature.x, creature.y, world);
  if (chaseTargetsNearestActor(creature, def, nearest)) return;
  if (fleeTargetsAwayFromActor(creature, def, nearest)) return;
  if (def.behavior === IDLE) return homeTarget(creature);
  if (def.behavior === PATROL) return patrolTarget(creature, def);
  if (def.behavior === GUARD && !nearHome(creature, def)) return homeTarget(creature);
  wanderTarget(creature, def);
}

function actorInSight(creature: CreatureInstance, def: CreatureDef, actor: CombatActor): boolean {
  return distanceBetween(creature.x, creature.y, actor.x, actor.y) <= def.sight;
}

function chaseTargetsNearestActor(
  creature: CreatureInstance,
  def: CreatureDef,
  actor: CombatActor | null,
): boolean {
  const chases = def.behavior === CHASE || (def.behavior === GUARD && nearHome(creature, def));
  if (!chases || !actor || !actorInSight(creature, def, actor)) return false;
  const towardActorX = actor.x - creature.x;
  const towardActorY = actor.y - creature.y;
  const approach = Math.hypot(towardActorX, towardActorY) - CHASE_STANDOFF_TILES;
  aimAlong(creature, towardActorX, towardActorY, Math.max(0, approach));
  return true;
}

function fleeTargetsAwayFromActor(
  creature: CreatureInstance,
  def: CreatureDef,
  actor: CombatActor | null,
): boolean {
  if (def.behavior !== FLEE || !actor || !actorInSight(creature, def, actor)) return false;
  aimAlong(creature, creature.x - actor.x, creature.y - actor.y, def.sight);
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
