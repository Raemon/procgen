import type { CreatureSpawn, WorldSampler } from '../../procgen/worldSampler';
import type { CreatureAssets } from '../../assets/creatures/creatureAssets';
import { spawnedCreature, spawnKeyOf, type CreatureInstance } from './creatureInstance';
import { retargetCreature, type SimWorldView } from './creatureTargets';
import { moveCreatureTowardTarget, type WalkabilityProbe } from './moveCreatureTowardTarget';

const ACTIVE_RADIUS_TILES = 40;
const DESPAWN_MARGIN_TILES = 16;
const RESPAWN_SCAN_SECONDS = 0.5;
const MAX_ACTIVE_CREATURES = 400;

export interface CreatureSimDeps {
  sampler: WorldSampler;
  creatureAssets: CreatureAssets;
  world: SimWorldView;
  isWalkableAt: WalkabilityProbe;
}

export class CreatureSim {
  private readonly creatures = new Map<string, CreatureInstance>();
  private secondsUntilScan = 0;

  constructor(private readonly deps: CreatureSimDeps) {}

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

  private stepOne(creature: CreatureInstance, dtSeconds: number): void {
    const def = this.deps.creatureAssets.byId(creature.creatureId);
    if (!def) return;
    retargetCreature(creature, def, this.deps.world, dtSeconds);
    moveCreatureTowardTarget(creature, def, this.deps.isWalkableAt, dtSeconds);
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
    if (this.creatures.has(key) || !this.deps.creatureAssets.byId(spawn.creatureId)) return;
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
