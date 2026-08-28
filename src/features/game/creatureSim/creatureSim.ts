import type { CreatureSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { CHASE, GUARD } from '@/features/asset-library/creatures/behaviorKinds';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { isInFrontHalfPlane, type FacingIndex } from '../facing';
import { climbGateFrom, type ClimbGate } from '../climbing';
import { distanceBetween, spawnedCreature, spawnKeyOf, type CreatureInstance } from './creatureInstance';
import { nearestActorTo, retargetCreature, type SimWorldView } from './creatureTargets';
import { moveCreatureTowardTarget, type WalkabilityProbe } from './moveCreatureTowardTarget';
import type { CombatActor, CombatListener } from './combatEvents';
import type { SlainCreatureSpawns } from './slainCreatureSpawns';

const ACTIVE_RADIUS_TILES = 40;
const DESPAWN_MARGIN_TILES = 16;
const RESPAWN_SCAN_SECONDS = 0.5;
const MAX_ACTIVE_CREATURES = 400;
const POINT_BLANK_TILES = 0.75;

export interface StrikeOutcome {
  creatureKey: string;
  creatureName: string;
  damage: number;
  remainingHp: number;
  slain: boolean;
}

export interface CreatureSimDeps {
  sampler: WorldSampler;
  creatureAssets: CreatureAssets;
  world: SimWorldView;
  isWalkableAt: WalkabilityProbe;
  slain: SlainCreatureSpawns;
  onCombat?: CombatListener;
}

export class CreatureSim {
  private readonly creatures = new Map<string, CreatureInstance>();
  private secondsUntilScan = 0;
  private readonly climbGate: ClimbGate;

  constructor(private readonly deps: CreatureSimDeps) {
    this.climbGate = climbGateFrom((x, y) => deps.sampler.elevationAt(x, y));
  }

  active(): readonly CreatureInstance[] {
    return [...this.creatures.values()];
  }

  forget(): void {
    this.creatures.clear();
    this.secondsUntilScan = 0;
  }

  step(dtSeconds: number): void {
    this.rescanSpawnsPeriodically(dtSeconds);
    for (const creature of this.creatures.values()) this.stepOne(creature, dtSeconds);
  }

  strikeFrom(striker: CombatActor, facing: FacingIndex, reach: number, damage: number): StrikeOutcome | null {
    const creature = this.creatureInReach(striker, facing, reach);
    if (!creature) return null;
    const def = this.deps.creatureAssets.byId(creature.creatureId);
    if (!def) return null;
    creature.hp -= damage;
    const slain = creature.hp <= 0;
    this.deps.onCombat?.({
      kind: 'actor_hit_creature',
      actorId: striker.id,
      actorName: striker.name,
      creatureKey: creature.key,
      creatureName: def.name,
      damage,
      remainingHp: Math.max(0, creature.hp),
      maxHp: def.maxHp,
    });
    if (slain) this.slay(creature, def, striker);
    return {
      creatureKey: creature.key,
      creatureName: def.name,
      damage,
      remainingHp: Math.max(0, creature.hp),
      slain,
    };
  }

  private creatureInReach(
    striker: CombatActor,
    facing: FacingIndex,
    reach: number,
  ): CreatureInstance | null {
    let best: CreatureInstance | null = null;
    let bestDistance = Infinity;
    for (const creature of this.creatures.values()) {
      const distance = distanceBetween(striker.x, striker.y, creature.x, creature.y);
      if (distance > reach || distance >= bestDistance) continue;
      const pointBlank = distance <= POINT_BLANK_TILES;
      if (!pointBlank && !isInFrontHalfPlane(facing, creature.x - striker.x, creature.y - striker.y)) continue;
      best = creature;
      bestDistance = distance;
    }
    return best;
  }

  private slay(creature: CreatureInstance, def: CreatureDef, striker: CombatActor): void {
    this.creatures.delete(creature.key);
    this.deps.slain.slay(creature.key);
    this.deps.onCombat?.({
      kind: 'creature_slain',
      creatureKey: creature.key,
      creatureName: def.name,
      actorId: striker.id,
      actorName: striker.name,
      x: Math.round(creature.x),
      y: Math.round(creature.y),
      droppedItemIds: (def.inventory?.placements ?? []).map((placement) => placement.itemId),
    });
  }

  private stepOne(creature: CreatureInstance, dtSeconds: number): void {
    const def = this.deps.creatureAssets.byId(creature.creatureId);
    if (!def) return;
    retargetCreature(creature, def, this.deps.world, dtSeconds);
    const fromX = Math.round(creature.x);
    const fromY = Math.round(creature.y);
    const walkableAndClimbable = (x: number, y: number) =>
      this.deps.isWalkableAt(x, y) && this.climbGate(fromX, fromY, x, y);
    moveCreatureTowardTarget(creature, def, walkableAndClimbable, dtSeconds);
    this.attackNearbyActor(creature, def, dtSeconds);
  }

  private attackNearbyActor(creature: CreatureInstance, def: CreatureDef, dtSeconds: number): void {
    creature.attackIn = Math.max(0, creature.attackIn - dtSeconds);
    if (def.attackDamage <= 0 || creature.attackIn > 0) return;
    if (def.behavior !== CHASE && def.behavior !== GUARD) return;
    const actor = nearestActorTo(creature.x, creature.y, this.deps.world);
    if (!actor) return;
    if (distanceBetween(creature.x, creature.y, actor.x, actor.y) > def.attackReach) return;
    creature.attackIn = def.attackCooldown;
    this.deps.onCombat?.({
      kind: 'creature_hit_actor',
      creatureKey: creature.key,
      creatureName: def.name,
      actorId: actor.id,
      actorName: actor.name,
      damage: def.attackDamage,
    });
  }

  private rescanSpawnsPeriodically(dtSeconds: number): void {
    this.secondsUntilScan -= dtSeconds;
    if (this.secondsUntilScan > 0) return;
    this.secondsUntilScan = RESPAWN_SCAN_SECONDS;
    this.despawnDistantCreatures();
    this.spawnNearbyCreatures();
  }

  private despawnDistantCreatures(): void {
    const limit = ACTIVE_RADIUS_TILES + DESPAWN_MARGIN_TILES;
    for (const [key, creature] of this.creatures) {
      if (this.chebyshevFromNearestActor(creature.x, creature.y) > limit) this.creatures.delete(key);
    }
  }

  private spawnNearbyCreatures(): void {
    for (const spawn of this.spawnsAroundActors()) {
      if (this.creatures.size >= MAX_ACTIVE_CREATURES) return;
      this.spawnIfNew(spawn);
    }
  }

  private spawnIfNew(spawn: CreatureSpawn): void {
    const key = spawnKeyOf(spawn.tag, spawn.x, spawn.y);
    if (this.creatures.has(key) || this.deps.slain.isSlain(key)) return;
    const def = this.deps.creatureAssets.byId(spawn.creatureId);
    if (!def) return;
    this.creatures.set(key, spawnedCreature(key, spawn.creatureId, spawn.x, spawn.y, def.maxHp));
  }

  private spawnsAroundActors(): CreatureSpawn[] {
    const spawns = new Map<string, CreatureSpawn>();
    for (const actor of this.deps.world.actors()) {
      for (const spawn of this.deps.sampler.creatureSpawnsIn(
        actor.x - ACTIVE_RADIUS_TILES,
        actor.y - ACTIVE_RADIUS_TILES,
        actor.x + ACTIVE_RADIUS_TILES,
        actor.y + ACTIVE_RADIUS_TILES,
      )) {
        spawns.set(spawnKeyOf(spawn.tag, spawn.x, spawn.y), spawn);
      }
    }
    return [...spawns.values()];
  }

  private chebyshevFromNearestActor(x: number, y: number): number {
    let nearest = Infinity;
    for (const actor of this.deps.world.actors()) {
      nearest = Math.min(nearest, Math.max(Math.abs(x - actor.x), Math.abs(y - actor.y)));
    }
    return nearest;
  }
}
