import { ringOf } from './chunkRing';
import { hashUnit } from './hashUnit';

export interface DenizenLair {
  x: number;
  y: number;
}

export interface DenizenKnobs {
  rarity: number;
  safeRings: number;
}

export function lairInCell(
  cx: number,
  cy: number,
  seed: number,
  denizens: DenizenKnobs,
  floors: readonly DenizenLair[],
): DenizenLair | null {
  if (ringOf(cx, cy) <= denizens.safeRings) return null;
  if (hashUnit(`${seed}:denizen:${cx},${cy}`) >= denizens.rarity) return null;
  if (floors.length === 0) return null;
  const pick = hashUnit(`${seed}:lair:${cx},${cy}`);
  return floors[Math.min(floors.length - 1, Math.floor(pick * floors.length))]!;
}
