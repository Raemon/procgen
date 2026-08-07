import type { WorldSampler } from '../../procgen/worldSampler';
import type { ReadOnlyItemLibrary } from '../../app/readOnlyLibraries';
import { emitsLight, lightSourceAt, type LightSource } from './lightEmission';
import type { LightRect } from './tileLightSources';

export function itemLightSourcesInRect(
  sampler: WorldSampler,
  items: ReadOnlyItemLibrary,
  rect: LightRect,
): LightSource[] {
  const sources: LightSource[] = [];
  for (const spawn of sampler.itemSpawnsIn(rect.minX, rect.minY, rect.maxX, rect.maxY)) {
    const item = items.byId(spawn.itemId);
    if (!item || !emitsLight(item)) continue;
    const elevation = sampler.elevationAt(spawn.x, spawn.y) + item.hover;
    sources.push(lightSourceAt(item, spawn.x, spawn.y, elevation));
  }
  return sources;
}
