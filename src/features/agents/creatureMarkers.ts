import type { ReadOnlyCreatureAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { CreatureId } from '@/features/asset-library/asset';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { spawnKeyOf } from '@/features/game/creatureSim/creatureInstance';
import type { CreatureSim } from '@/features/game/creatureSim/creatureSim';
import type { MarkerSource } from '@/features/game/render/markerSource';
import type { ObservedOverlay } from './observation';

export type LiveCreatures = Pick<CreatureSim, 'active'>;

const NOTHING_LIVE: LiveCreatures = { active: () => [] };

export interface CreatureHabitat {
  puzzles: ObservedOverlay;
  sampler: WorldSampler;
  creatures: ReadOnlyCreatureAssets;
}

export function creatureAwareOverlay(
  world: CreatureHabitat,
  sim: LiveCreatures = NOTHING_LIVE,
): ObservedOverlay {
  const creatures = creatureMarkers(world.sampler, world.creatures, sim);
  return {
    markersIn: (minX, minY, maxX, maxY) => [
      ...world.puzzles.markersIn(minX, minY, maxX, maxY),
      ...creatures.markersIn(minX, minY, maxX, maxY),
    ],
    actionAt: (x, y) => world.puzzles.actionAt(x, y),
  };
}

export function creatureMarkers(
  sampler: WorldSampler,
  creatures: ReadOnlyCreatureAssets,
  sim: LiveCreatures = NOTHING_LIVE,
): MarkerSource {
  return {
    markersIn: (minX, minY, maxX, maxY) => {
      const markers: Marker[] = [];
      const simulated = new Set<string>();
      for (const creature of sim.active()) {
        simulated.add(creature.key);
        const x = Math.round(creature.x);
        const y = Math.round(creature.y);
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        appendCreatureMarker(markers, creatures, creature.creatureId, x, y);
      }
      for (const spawn of sampler.creatureSpawnsIn(minX, minY, maxX, maxY)) {
        if (simulated.has(spawnKeyOf(spawn.tag, spawn.x, spawn.y))) continue;
        appendCreatureMarker(markers, creatures, spawn.creatureId, spawn.x, spawn.y);
      }
      return markers;
    },
  };
}

function appendCreatureMarker(
  markers: Marker[],
  creatures: ReadOnlyCreatureAssets,
  creatureId: CreatureId,
  x: number,
  y: number,
): void {
  const def = creatures.byId(creatureId);
  if (!def) return;
  markers.push({ x, y, glyph: def.symbol, color: def.color, faceArt: null, tag: def.name });
}
