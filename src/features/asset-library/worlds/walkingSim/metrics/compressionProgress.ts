import { deflateRawSync } from 'node:zlib';
import type { CellPoint } from '@/features/game/nearestWalkable';
import type { CellCharacterProbe } from '../cellCharacter';
import { postcardsAlongPath } from './viewDistinctness';

const STEPS_BETWEEN_GLIMPSES = 4;
const FEWEST_GLIMPSES_TO_JUDGE = 24;

export function learningCurveDrop(
  path: readonly CellPoint[],
  characterAt: CellCharacterProbe,
): number {
  const glimpses = postcardsAlongPath(path, characterAt, STEPS_BETWEEN_GLIMPSES);
  if (glimpses.length < FEWEST_GLIMPSES_TO_JUDGE) return 0;
  const half = Math.floor(glimpses.length / 2);
  const firstHalf = glimpses.slice(0, half).join('\n');
  const secondHalf = glimpses.slice(half).join('\n');
  const soloBits = deflatedBits(secondHalf);
  if (soloBits <= 0) return 0;
  const conditionalBits = Math.max(
    0,
    deflatedBits(`${firstHalf}\n${secondHalf}`) - deflatedBits(firstHalf),
  );
  return Math.max(0, 1 - conditionalBits / soloBits);
}

function deflatedBits(text: string): number {
  return deflateRawSync(Buffer.from(text), { level: 9 }).length * 8;
}
