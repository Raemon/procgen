import { CARDINAL_STEPS } from '@/features/asset-library/worlds/walkingSim/cellGrid';
import { cellKeyOf } from '../circuits/circuit';
import type { Cell } from '../worldRules';

export function wiresJoin(joined: ReadonlySet<string>, from: Cell, to: Cell): boolean {
  const seen = new Set([cellKeyOf(from)]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head]!;
    if (at.x === to.x && at.y === to.y) return true;
    for (const step of CARDINAL_STEPS) {
      const next = { x: at.x + step.dx, y: at.y + step.dy };
      if (!joined.has(cellKeyOf(next)) || seen.has(cellKeyOf(next))) continue;
      seen.add(cellKeyOf(next));
      queue.push(next);
    }
  }
  return false;
}
