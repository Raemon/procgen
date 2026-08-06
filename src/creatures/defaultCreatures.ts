import { CHASE, FLEE, GUARD, WANDER } from './behaviorKinds';
import type { CreatureDef } from './creatureDef';

export function defaultCreatures(): CreatureDef[] {
  return [
    creature(0, 'deer', 'd', '#c9a06a', WANDER, { speed: 1.4, sight: 9, roam: 10, size: 0.75 }),
    creature(1, 'rabbit', 'r', '#d8d2c4', FLEE, { speed: 3.2, sight: 7, roam: 5, size: 0.4 }),
    creature(2, 'wolf', 'w', '#8f95a3', CHASE, { speed: 2.6, sight: 12, roam: 14, size: 0.7 }),
    creature(3, 'sentry', 's', '#c05a4a', GUARD, { speed: 1.8, sight: 8, roam: 6, size: 0.9 }),
    creature(4, 'keeper', 'k', '#e8c86a', FLEE, { speed: 3, sight: 7, roam: 6, size: 0.5 }),
  ];
}

function creature(
  id: number,
  name: string,
  symbol: string,
  color: string,
  behavior: number,
  motion: { speed: number; sight: number; roam: number; size: number },
): CreatureDef {
  return { id, name, symbol, color, faceArt: null, behavior, phasing: 0, ...motion };
}
