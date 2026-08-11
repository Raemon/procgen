import type { CreatureInstance } from '../creatureSim/creatureInstance';
import { brightestCarriedLight } from '@/features/asset-library/items/inventory/carriedLight';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type {
  ReadOnlyCreatureAssets,
  ReadOnlyItemAssets,
} from '@/features/app-shell/runtime/readOnlyAssets';
import { lightSourceAt, type LightSource } from './lightEmission';

const CARRIED_LIGHT_HEIGHT = 0.9;

export function carriedLightSourceOf(
  creatureId: number,
  x: number,
  y: number,
  creatures: ReadOnlyCreatureAssets,
  items: ReadOnlyItemAssets,
  sampler: WorldSampler,
): LightSource | null {
  const carried = brightestCarriedLight(creatures.byId(creatureId) ?? null, items);
  if (!carried) return null;
  const elevation = sampler.elevationAt(Math.round(x), Math.round(y)) + CARRIED_LIGHT_HEIGHT;
  return lightSourceAt(carried, x, y, elevation);
}

export function carriedLightSourcesOfCreatures(
  active: readonly CreatureInstance[],
  creatures: ReadOnlyCreatureAssets,
  items: ReadOnlyItemAssets,
  sampler: WorldSampler,
): LightSource[] {
  const sources: LightSource[] = [];
  for (const creature of active) {
    const source = carriedLightSourceOf(
      creature.creatureId,
      creature.x,
      creature.y,
      creatures,
      items,
      sampler,
    );
    if (source) sources.push(source);
  }
  return sources;
}
