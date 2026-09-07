import type { CreatureSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { climbGateFrom, type ClimbGate } from '../climbing';
import type { Fight } from '../combat/fight';
import {
  creatureStruckBy,
  type StrikePose,
  type StruckCreature,
  type StrikeableCreatures,
} from '../combat/strikes';
import { blowLanded, recoilFrom } from './creatureStrikes';
import { spawnedCreature, spawnKeyOf, type CreatureInstance } from './creatureInstance';
import { retargetCreature, type SimWorldView } from './creatureTargets';
import { moveCreatureTowardTarget } from './moveCreatureTowardTarget';
import type { WalkabilityProbe } from '../tileWalkability';

const ACTIVE_RADIUS_TILES = 40;
const DESPAWN_MARGIN_TILES = 16;
const RESPAWN_SCAN_SECONDS = 0.5;
const MAX_ACTIVE_CREATURES = 400;

export interface CreatureSimDeps {
  sampler: WorldSampler;
  creatureAssets: CreatureAssets;
  world: SimWorldView;
  isWalkableAt: WalkabilityProbe;
  fight: Fight;
}

export class CreatureSim implements StrikeableCreatures {
  private readonly creatures = new Map<string, CreatureInstance>();
  private secondsUntilScan = 0;
  private readonly climbGate: ClimbGate;

  constructor(private readonly deps: CreatureSimDeps) {
    this.climbGate = climbGateFrom((x, y) => deps.sampler.elevationAt(x, y));
  }

  active(): readonly CreatureInstance[] {
    return [...this.creatures.values()];
  }

  isSlain(key: string): boolean {
    return this.deps.fight.creatureIsSlain(key);
  }

  forget(): void {
    this.creatures.clear();
    this.secondsUntilScan = 0;
    this.deps.fight.forget();
  }

  step(dtSeconds: number): void {
    this.rescanSpawnsPeriodically(dtSeconds);
    for (const creature of this.creatures.values()) this.stepOne(creature, dtSeconds);
    this.deps.fight.recover(dtSeconds);
  }

  strikeFrom(pose: StrikePose): StruckCreature | null {
    const target = creatureStruckBy(pose, [...this.creatures.values()]);
    const def = target && this.deps.creatureAssets.byId(target.creatureId);
    if (!target || !def) return null;
    const at = { x: Math.round(target.x), y: Math.round(target.y) };
    const outcome = this.deps.fight.strikeCreature(
      target.key,
      def.vigor,
      this.deps.fight.playerStrength(),
      at,
    );
    if (outcome === 'slain') this.creatures.delete(target.key);
    else recoilFrom(target, pose);
    return { name: def.name, outcome, at };
  }

  private stepOne(creature: CreatureInstance, dtSeconds: number): void {
    const def = this.deps.creatureAssets.byId(creature.creatureId);
    if (!def) return;
    retargetCreature(creature, def, this.deps.world, dtSeconds);
    if (blowLanded(creature, def, dtSeconds)) {
      this.deps.fight.strikePlayer(def.strength, {
        x: this.deps.world.playerX,
        y: this.deps.world.playerY,
      });
    }
    const fromX = Math.round(creature.x);
    const fromY = Math.round(creature.y);
    const walkableAndClimbable = (x: number, y: number) =>
      this.deps.isWalkableAt(x, y) && this.climbGate(fromX, fromY, x, y);
    moveCreatureTowardTarget(creature, def, walkableAndClimbable, dtSeconds);
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
      if (this.chebyshevFromPlayer(creature.x, creature.y) > limit) this.creatures.delete(key);
    }
  }

  private spawnNearbyCreatures(): void {
    for (const spawn of this.spawnsAroundPlayer()) {
      if (this.creatures.size >= MAX_ACTIVE_CREATURES) return;
      this.spawnIfNew(spawn);
    }
  }

  private spawnIfNew(spawn: CreatureSpawn): void {
    const key = spawnKeyOf(spawn.tag, spawn.x, spawn.y);
    if (this.creatures.has(key) || this.deps.fight.creatureIsSlain(key)) return;
    if (!this.deps.creatureAssets.byId(spawn.creatureId)) return;
    this.creatures.set(key, spawnedCreature(key, spawn.creatureId, spawn.x, spawn.y));
  }

  private spawnsAroundPlayer(): CreatureSpawn[] {
    const { playerX, playerY } = this.deps.world;
    return this.deps.sampler.creatureSpawnsIn(
      playerX - ACTIVE_RADIUS_TILES,
      playerY - ACTIVE_RADIUS_TILES,
      playerX + ACTIVE_RADIUS_TILES,
      playerY + ACTIVE_RADIUS_TILES,
    );
  }

  private chebyshevFromPlayer(x: number, y: number): number {
    return Math.max(
      Math.abs(x - this.deps.world.playerX),
      Math.abs(y - this.deps.world.playerY),
    );
  }
}
