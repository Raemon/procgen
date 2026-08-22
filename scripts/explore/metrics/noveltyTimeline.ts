import type { TileId } from '@/features/asset-library/asset';
import type { TileIdProbe } from '../cachedWorldProbes';
import { stepsTaken, type ExplorationTrace } from '../explorationTrace';
import type { MarkerEncounter } from './markerEncounters';

export interface NoveltyEvent {
  label: string;
  step: number;
}

export function noveltyTimeline(
  trace: ExplorationTrace,
  tileIdAt: TileIdProbe,
  encounters: MarkerEncounter[],
): NoveltyEvent[] {
  const events = [...firstTileSightings(trace, tileIdAt), ...firstTagSightings(encounters)];
  return events.sort((a, b) => a.step - b.step);
}

export function noveltySpread(events: NoveltyEvent[], trace: ExplorationTrace): number {
  const steps = stepsTaken(trace);
  const lastEvent = events[events.length - 1];
  if (steps === 0 || !lastEvent) return 0;
  return lastEvent.step / steps;
}

function firstTileSightings(trace: ExplorationTrace, tileIdAt: TileIdProbe): NoveltyEvent[] {
  const seen = new Set<number>();
  const events: NoveltyEvent[] = [];
  trace.path.forEach((cell, step) => {
    for (const tileId of sightedTileIds(cell, tileIdAt)) {
      if (seen.has(tileId)) continue;
      seen.add(tileId);
      events.push({ label: `tile ${tileId}`, step });
    }
  });
  return events;
}

function sightedTileIds(cell: { x: number; y: number }, tileIdAt: TileIdProbe): TileId[] {
  const tileIds: TileId[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) tileIds.push(tileIdAt(cell.x + dx, cell.y + dy));
  }
  return tileIds;
}

function firstTagSightings(encounters: MarkerEncounter[]): NoveltyEvent[] {
  const seen = new Set<string>();
  const events: NoveltyEvent[] = [];
  for (const encounter of encounters) {
    if (seen.has(encounter.tag)) continue;
    seen.add(encounter.tag);
    events.push({ label: `marker ${encounter.tag}`, step: encounter.step });
  }
  return events;
}
