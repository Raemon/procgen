import { CHASE, FLEE, GUARD, WANDER } from './behaviorKinds';
import type { CreatureDef } from './creatureDef';

export function defaultCreatures(): CreatureDef[] {
  return [
    creature(0, 'deer', 'd', '#c9a06a', WANDER, { speed: 1.4, sight: 9, roam: 10, size: 0.75 }),
    creature(1, 'rabbit', 'r', '#d8d2c4', FLEE, { speed: 3.2, sight: 7, roam: 5, size: 0.4 }),
    creature(2, 'wolf', 'w', '#8f95a3', CHASE, { speed: 2.6, sight: 12, roam: 14, size: 0.7 }),
    creature(3, 'sentry', 's', '#c05a4a', GUARD, { speed: 1.8, sight: 8, roam: 6, size: 0.9 }),
    creature(4, 'ash hound', 'h', '#c25b3d', CHASE, { speed: 3.0, sight: 13, roam: 13, size: 0.65 }),
    creature(5, 'ember wisp', '✦', '#ffb347', WANDER, { speed: 1.1, sight: 6, roam: 8, size: 0.35, phasing: 1 }),
    creature(6, 'fen heron', 'y', '#a8bfb2', FLEE, { speed: 2.4, sight: 8, roam: 6, size: 0.6 }),
  ];
}

function creature(
  id: number,
  name: string,
  symbol: string,
  color: string,
  behavior: number,
  motion: { speed: number; sight: number; roam: number; size: number; phasing?: 0 | 1 },
): CreatureDef {
  return { id, name, symbol, color, faceArt: null, behavior, phasing: 0, ...motion };
}
