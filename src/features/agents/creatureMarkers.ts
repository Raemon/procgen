import type { CreatureId } from '@/features/asset-library/asset';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { spawnKeyOf, type CreatureInstance } from '@/features/game/creatureSim/creatureInstance';
import type { MarkerSource } from '@/features/game/render/markerSource';
import type { ObservedOverlay } from './observation';

export interface CreatureSpawnSource {
  creatureSpawnsIn: WorldSampler['creatureSpawnsIn'];
}

export interface LiveCreatures {
  active(): readonly CreatureInstance[];
}

export interface CreatureLookup {
  byId(id: CreatureId): CreatureDef | undefined;
}

export function overlayWithCreatures(
  base: ObservedOverlay,
  creatures: MarkerSource,
): ObservedOverlay {
  return {
    markersIn: (minX, minY, maxX, maxY) => [
      ...base.markersIn(minX, minY, maxX, maxY),
      ...creatures.markersIn(minX, minY, maxX, maxY),
    ],
    actionAt: (x, y) => base.actionAt(x, y),
  };
}

export function spawnedCreatureMarkers(
  sampler: CreatureSpawnSource,
  creatures: CreatureLookup,
): MarkerSource {
  return {
    markersIn: (minX, minY, maxX, maxY) => {
      const markers: Marker[] = [];
      for (const spawn of sampler.creatureSpawnsIn(minX, minY, maxX, maxY)) {
        appendCreatureMarker(markers, creatures, spawn.creatureId, spawn.x, spawn.y);
      }
      return markers;
    },
  };
}

export function liveCreatureMarkers(
  sim: LiveCreatures,
  sampler: CreatureSpawnSource,
  creatures: CreatureLookup,
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
  creatures: CreatureLookup,
  creatureId: CreatureId,
  x: number,
  y: number,
): void {
  const def = creatures.byId(creatureId);
  if (!def) return;
  markers.push({ x, y, glyph: def.symbol, color: def.color, faceArt: null, tag: def.name });
}
