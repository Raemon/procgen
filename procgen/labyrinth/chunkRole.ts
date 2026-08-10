import { ringOf } from './chunkRing';
import { hashUnit } from './hashUnit';
import type { LabyrinthKnobs } from './labyrinthKnobs';

export const ROOM = 0;
export const SUBMAZE = 1;

export function roleOf(cx: number, cy: number, knobs: LabyrinthKnobs): number {
  if (ringOf(cx, cy) <= knobs.tutorialRings) return ROOM;
  const h = hashUnit(`${knobs.seed}:role:${cx},${cy}`);
  return h < knobs.roomFraction ? ROOM : SUBMAZE;
}
