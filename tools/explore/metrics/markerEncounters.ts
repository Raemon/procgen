import type { CellPoint } from '../../../world/nearestWalkable';
import type { Marker, WorldSampler } from '../../../procgen/worldSampler';
import { cellKey, type ExplorationTrace } from '../explorationTrace';

const SIGHT_RADIUS = 2;

export interface MarkerEncounter {
  x: number;
  y: number;
  tag: string;
  step: number;
}

export function markerEncountersAlongPath(
  trace: ExplorationTrace,
  sampler: WorldSampler,
): MarkerEncounter[] {
  const markerAt = markersAroundVisitedRegion(trace, sampler);
  const claimed = new Set<string>();
  const encounters: MarkerEncounter[] = [];
  trace.path.forEach((cell, step) =>
    collectNearbyMarkers(markerAt, cell, step, claimed, encounters),
  );
  return encounters;
}

function markersAroundVisitedRegion(
  trace: ExplorationTrace,
  sampler: WorldSampler,
): Map<string, Marker> {
  const bounds = visitedBounds(trace);
  const markers = sampler.markersIn(
    bounds.minX - SIGHT_RADIUS,
    bounds.minY - SIGHT_RADIUS,
    bounds.maxX + SIGHT_RADIUS,
    bounds.maxY + SIGHT_RADIUS,
  );
  return new Map(markers.map((marker) => [cellKey(marker.x, marker.y), marker]));
}

function collectNearbyMarkers(
  markerAt: Map<string, Marker>,
  cell: CellPoint,
  step: number,
  claimed: Set<string>,
  into: MarkerEncounter[],
): void {
  for (let dy = -SIGHT_RADIUS; dy <= SIGHT_RADIUS; dy++) {
    for (let dx = -SIGHT_RADIUS; dx <= SIGHT_RADIUS; dx++) {
      const key = cellKey(cell.x + dx, cell.y + dy);
      const marker = markerAt.get(key);
      if (!marker || claimed.has(key)) continue;
      claimed.add(key);
      into.push({ x: marker.x, y: marker.y, tag: marker.tag, step });
    }
  }
}

function visitedBounds(trace: ExplorationTrace) {
  let { x: minX, y: minY } = trace.spawn;
  let { x: maxX, y: maxY } = trace.spawn;
  for (const cell of trace.path) {
    minX = Math.min(minX, cell.x);
    maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y);
    maxY = Math.max(maxY, cell.y);
  }
  return { minX, minY, maxX, maxY };
}
