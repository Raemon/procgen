import type { CellPoint } from '@/features/game/nearestWalkable';
import { cellKey } from '../cellGrid';
import type { NearbySpawnsProbe } from '../nearbySpawnsProbe';
import { shareOf } from './meanOf';

export interface Discoveries {
  encountersPer100Steps: number;
  discoveryKinds: number;
}

export function discoveriesAlongPath(
  path: readonly CellPoint[],
  spawnsNear: NearbySpawnsProbe,
): Discoveries {
  const met = new Set<string>();
  const kinds = new Set<string>();
  for (const cell of path) {
    for (const sighting of spawnsNear(cell.x, cell.y)) {
      met.add(cellKey(sighting.x, sighting.y));
      kinds.add(sighting.kind);
    }
  }
  return {
    encountersPer100Steps: shareOf(met.size, path.length) * 100,
    discoveryKinds: kinds.size,
  };
}
