import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import type {
  ReadOnlyCreatureAssets,
  ReadOnlyItemAssets,
  ReadOnlyTileAssets,
} from '@/features/app-shell/runtime/readOnlyAssets';
import type { LiveCreature } from '../creatureSim/creatureInstance';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { carriedLightSourceOf, carriedLightSourcesOfCreatures } from './characterLightSources';
import { itemLightSourcesInRect } from './itemLightSources';
import type { LightSource } from './lightEmission';
import { tileLightSourcesInRect, type LightRect } from './tileLightSources';

const STATIC_LIGHT_RECT_TILES = 24;

export interface LitScene {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  creatures: ReadOnlyCreatureAssets;
  items: ReadOnlyItemAssets;
  activeCreatures(): readonly LiveCreature[];
}

export class SceneLightSources {
  private staticSources: LightSource[] = [];
  private staticRectKey = '';

  constructor(private readonly scene: LitScene) {}

  invalidate(): void {
    this.staticRectKey = '';
    this.staticSources = [];
  }

  around(playerX: number, playerY: number): LightSource[] {
    this.refreshStaticSources(playerX, playerY);
    return [...this.staticSources, ...this.carriedSources(playerX, playerY)];
  }

  private refreshStaticSources(playerX: number, playerY: number): void {
    const rect = rectAround(playerX, playerY);
    const key = `${rect.minX},${rect.minY}`;
    if (key === this.staticRectKey) return;
    this.staticRectKey = key;
    this.staticSources = [
      ...tileLightSourcesInRect(this.scene.sampler, this.scene.tileAssets, rect),
      ...itemLightSourcesInRect(this.scene.sampler, this.scene.items, rect),
    ];
  }

  private carriedSources(playerX: number, playerY: number): LightSource[] {
    const others = carriedLightSourcesOfCreatures(
      this.scene.activeCreatures(),
      this.scene.creatures,
      this.scene.items,
      this.scene.sampler,
    );
    const player = this.playerSource(playerX, playerY);
    return player ? [player, ...others] : others;
  }

  private playerSource(playerX: number, playerY: number): LightSource | null {
    const player = playerCharacterDef(this.scene.creatures);
    if (!player) return null;
    return carriedLightSourceOf(
      player.id,
      playerX,
      playerY,
      this.scene.creatures,
      this.scene.items,
      this.scene.sampler,
    );
  }
}

function rectAround(playerX: number, playerY: number): LightRect {
  const x = Math.round(playerX);
  const y = Math.round(playerY);
  return {
    minX: x - STATIC_LIGHT_RECT_TILES,
    minY: y - STATIC_LIGHT_RECT_TILES,
    maxX: x + STATIC_LIGHT_RECT_TILES,
    maxY: y + STATIC_LIGHT_RECT_TILES,
  };
}
