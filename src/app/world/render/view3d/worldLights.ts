import * as THREE from 'three';
import type { LightSource } from '../../light/lightEmission';
import { SceneLightSources } from '../../light/sceneLightSources';
import type { WorldViewDeps } from '../worldViewDeps';
import { PointLightPool } from './pointLightPool';

const MAX_LIVE_LIGHTS = 24;

export class WorldLights {
  private readonly pool: PointLightPool;
  private readonly sources: SceneLightSources;

  constructor(root: THREE.Object3D, deps: WorldViewDeps) {
    this.pool = new PointLightPool(root, MAX_LIVE_LIGHTS);
    this.sources = new SceneLightSources({
      sampler: deps.sampler,
      tileAssets: deps.tileAssets,
      creatures: deps.creatures,
      items: deps.items,
      activeCreatures: () => deps.sim.active(),
    });
  }

  dispose(): void {
    this.pool.dispose();
  }

  invalidate(): void {
    this.sources.invalidate();
  }

  syncAround(playerX: number, playerY: number): void {
    const lit = this.sources.around(playerX, playerY);
    this.pool.show(nearestSources(lit, playerX, playerY, this.pool.capacity));
  }
}

function nearestSources(
  sources: readonly LightSource[],
  playerX: number,
  playerY: number,
  limit: number,
): LightSource[] {
  if (sources.length <= limit) return [...sources];
  return [...sources]
    .sort((a, b) => distanceSquared(a, playerX, playerY) - distanceSquared(b, playerX, playerY))
    .slice(0, limit);
}

function distanceSquared(source: LightSource, playerX: number, playerY: number): number {
  return (source.x - playerX) ** 2 + (source.y - playerY) ** 2;
}
