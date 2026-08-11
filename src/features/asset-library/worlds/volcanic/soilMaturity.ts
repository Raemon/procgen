import { VOLCANIC_ERA_SPAN } from '../time/worldTime';

const BARE_ROCK = 0.1;
const LEACHED = 0.3;

export function soilMaturity(age: number, peakAge: number): number {
  if (age <= peakAge) return BARE_ROCK + (1 - BARE_ROCK) * (age / peakAge);
  const fade = (age - peakAge) / Math.max(1, VOLCANIC_ERA_SPAN - peakAge);
  return Math.max(LEACHED, 1 - (1 - LEACHED) * fade);
}

export function ashFalloff(distance: number, ashRadius: number): number {
  return Math.max(0, 1 - distance / ashRadius);
}
