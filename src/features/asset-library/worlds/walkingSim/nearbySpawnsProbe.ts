import type { WorldSampler } from '../worldSampler';
import { cellKey } from './cellGrid';

export interface SpawnSighting {
  x: number;
  y: number;
  kind: string;
}

export type NearbySpawnsProbe = (x: number, y: number) => SpawnSighting[];

export const NO_SPAWNS_ANYWHERE: NearbySpawnsProbe = () => [];

export function spawnSitsAtCell(spawnsNear: NearbySpawnsProbe, x: number, y: number): boolean {
  return spawnsNear(x, y).some((sighting) => sighting.x === x && sighting.y === y);
}

const BLOCK_SPAN = 32;
const REACH = 1;

export function nearbySpawnsProbe(sampler: WorldSampler): NearbySpawnsProbe {
  const blocks = new Map<string, Map<string, SpawnSighting>>();
  return (x, y) => sightingsAround(x, y, blocks, sampler);
}

function sightingsAround(
  x: number,
  y: number,
  blocks: Map<string, Map<string, SpawnSighting>>,
  sampler: WorldSampler,
): SpawnSighting[] {
  const found: SpawnSighting[] = [];
  for (let dy = -REACH; dy <= REACH; dy++) {
    for (let dx = -REACH; dx <= REACH; dx++) {
      const sighting = blockOfCell(x + dx, y + dy, blocks, sampler).get(cellKey(x + dx, y + dy));
      if (sighting) found.push(sighting);
    }
  }
  return found;
}

function blockOfCell(
  x: number,
  y: number,
  blocks: Map<string, Map<string, SpawnSighting>>,
  sampler: WorldSampler,
): Map<string, SpawnSighting> {
  const blockX = Math.floor(x / BLOCK_SPAN);
  const blockY = Math.floor(y / BLOCK_SPAN);
  const key = `${blockX},${blockY}`;
  const cached = blocks.get(key);
  if (cached) return cached;
  const loaded = loadBlockSightings(sampler, blockX, blockY);
  blocks.set(key, loaded);
  return loaded;
}

function loadBlockSightings(
  sampler: WorldSampler,
  blockX: number,
  blockY: number,
): Map<string, SpawnSighting> {
  const minX = blockX * BLOCK_SPAN;
  const minY = blockY * BLOCK_SPAN;
  const maxX = minX + BLOCK_SPAN - 1;
  const maxY = minY + BLOCK_SPAN - 1;
  const sightings = new Map<string, SpawnSighting>();
  for (const marker of sampler.markersIn(minX, minY, maxX, maxY)) {
    sightings.set(cellKey(marker.x, marker.y), { x: marker.x, y: marker.y, kind: marker.tag });
  }
  for (const spawn of sampler.creatureSpawnsIn(minX, minY, maxX, maxY)) {
    sightings.set(cellKey(spawn.x, spawn.y), { x: spawn.x, y: spawn.y, kind: spawn.tag });
  }
  for (const spawn of sampler.itemSpawnsIn(minX, minY, maxX, maxY)) {
    sightings.set(cellKey(spawn.x, spawn.y), { x: spawn.x, y: spawn.y, kind: spawn.name });
  }
  return sightings;
}
