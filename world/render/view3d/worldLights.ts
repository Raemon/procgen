import * as THREE from 'three';
import { playerCharacterDef } from '../../../library/characters/playerCharacter';
import type { LightSource } from '../../light/lightEmission';
import { carriedLightSourceOf, carriedLightSourcesOfCreatures } from '../../light/characterLightSources';
import { itemLightSourcesInRect } from '../../light/itemLightSources';
import { tileLightSourcesInRect, type LightRect } from '../../light/tileLightSources';
import type { WorldViewDeps } from '../worldViewDeps';
import { PointLightPool } from './pointLightPool';

const MAX_LIVE_LIGHTS = 24;
const STATIC_LIGHT_RECT_TILES = 24;

export class WorldLights {
  private readonly pool: PointLightPool;
  private staticSources: LightSource[] = [];
  private staticRectKey = '';

  constructor(root: THREE.Object3D, private readonly deps: WorldViewDeps) {
    this.pool = new PointLightPool(root, MAX_LIVE_LIGHTS);
  }

  dispose(): void {
    this.pool.dispose();
  }

  invalidate(): void {
    this.staticRectKey = '';
    this.staticSources = [];
  }

  syncAround(centerX: number, centerY: number): void {
    this.refreshStaticSources(centerX, centerY);
    const sources = [...this.staticSources, ...this.carriedSources()];
    this.pool.show(nearestSources(sources, centerX, centerY, this.pool.capacity));
  }

  private refreshStaticSources(centerX: number, centerY: number): void {
    const rect = rectAround(centerX, centerY);
    const key = `${rect.minX},${rect.minY}`;
    if (key === this.staticRectKey) return;
    this.staticRectKey = key;
    this.staticSources = [
      ...tileLightSourcesInRect(this.deps.sampler, this.deps.tileset, rect),
      ...itemLightSourcesInRect(this.deps.sampler, this.deps.items, rect),
    ];
  }

  private carriedSources(): LightSource[] {
    const carried = carriedLightSourcesOfCreatures(
      this.deps.sim.active(),
      this.deps.creatures,
      this.deps.items,
      this.deps.sampler,
    );
    const player = this.playerSource();
    return player ? [player, ...carried] : carried;
  }

  private playerSource(): LightSource | null {
    const def = playerCharacterDef(this.deps.creatures);
    if (!def) return null;
    return carriedLightSourceOf(
      def.id,
      this.deps.world.playerX,
      this.deps.world.playerY,
      this.deps.creatures,
      this.deps.items,
      this.deps.sampler,
    );
  }
}

function rectAround(centerX: number, centerY: number): LightRect {
  const x = Math.round(centerX);
  const y = Math.round(centerY);
  return {
    minX: x - STATIC_LIGHT_RECT_TILES,
    minY: y - STATIC_LIGHT_RECT_TILES,
    maxX: x + STATIC_LIGHT_RECT_TILES,
    maxY: y + STATIC_LIGHT_RECT_TILES,
  };
}

function nearestSources(
  sources: readonly LightSource[],
  centerX: number,
  centerY: number,
  limit: number,
): LightSource[] {
  if (sources.length <= limit) return [...sources];
  return [...sources]
    .sort((a, b) => distanceSquared(a, centerX, centerY) - distanceSquared(b, centerX, centerY))
    .slice(0, limit);
}

function distanceSquared(source: LightSource, centerX: number, centerY: number): number {
  return (source.x - centerX) ** 2 + (source.y - centerY) ** 2;
}
