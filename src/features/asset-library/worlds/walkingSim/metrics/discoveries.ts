import type { CellPoint } from '@/features/game/nearestWalkable';
import { cellKey } from '../cellGrid';
import type { NearbySpawnsProbe } from '../nearbySpawnsProbe';
import { shareOf } from './meanOf';

export interface Discoveries {
  encountersPer100Steps: number;
  discoveryKinds: number;
  eventGapCv: number;
}

const FEWEST_EVENTS_FOR_RHYTHM = 4;

export function discoveriesAlongPath(
  path: readonly CellPoint[],
  spawnsNear: NearbySpawnsProbe,
): Discoveries {
  const met = new Set<string>();
  const kinds = new Set<string>();
  const eventSteps: number[] = [];
  path.forEach((cell, step) => {
    const metBefore = met.size;
    for (const sighting of spawnsNear(cell.x, cell.y)) {
      met.add(cellKey(sighting.x, sighting.y));
      kinds.add(sighting.kind);
    }
    if (met.size > metBefore) eventSteps.push(step);
  });
  return {
    encountersPer100Steps: shareOf(met.size, path.length) * 100,
    discoveryKinds: kinds.size,
    eventGapCv: gapVariationOf(eventSteps),
  };
}

function gapVariationOf(eventSteps: readonly number[]): number {
  if (eventSteps.length < FEWEST_EVENTS_FOR_RHYTHM) return 0;
  const gaps = eventSteps.slice(1).map((step, at) => step - eventSteps[at]!);
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  if (mean === 0) return 0;
  const variance = gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length;
  return Math.sqrt(variance) / mean;
}
