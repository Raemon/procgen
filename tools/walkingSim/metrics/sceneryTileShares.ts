import type { TileIdProbe } from '../../explore/cachedWorldProbes';
import { cellFromKey } from '../../explore/explorationTrace';

export function tileCountsOverSeenCells(
  seen: Set<string>,
  tileIdAt: TileIdProbe,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const key of seen) {
    const cell = cellFromKey(key);
    const tileId = tileIdAt(cell.x, cell.y);
    counts.set(tileId, (counts.get(tileId) ?? 0) + 1);
  }
  return counts;
}

export function sharesOfCounts(counts: Map<number, number>): Map<number, number> {
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const shares = new Map<number, number>();
  if (total === 0) return shares;
  for (const [tileId, count] of counts) shares.set(tileId, count / total);
  return shares;
}
