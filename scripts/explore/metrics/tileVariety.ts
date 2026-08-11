import type { TileIdProbe } from '../cachedWorldProbes';
import { cellFromKey, cellKey, type ExplorationTrace } from '../explorationTrace';

export function tileEntropyBits(trace: ExplorationTrace, tileIdAt: TileIdProbe): number {
  const counts = tileCountsOverSeenCells(trace, tileIdAt);
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  let bits = 0;
  for (const count of counts.values()) {
    const share = count / total;
    bits -= share * Math.log2(share);
  }
  return bits;
}

export function seenCellKeys(trace: ExplorationTrace): Set<string> {
  const seen = new Set<string>();
  for (const key of trace.visited) {
    const cell = cellFromKey(key);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) seen.add(cellKey(cell.x + dx, cell.y + dy));
    }
  }
  return seen;
}

function tileCountsOverSeenCells(
  trace: ExplorationTrace,
  tileIdAt: TileIdProbe,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const key of seenCellKeys(trace)) {
    const cell = cellFromKey(key);
    const tileId = tileIdAt(cell.x, cell.y);
    counts.set(tileId, (counts.get(tileId) ?? 0) + 1);
  }
  return counts;
}
