import type { TileIdProbe } from '../../explore/cachedWorldProbes';
import { sharesOfCounts, tileCountsOverSeenCells } from './sceneryTileShares';

export function sceneryEntropyBits(seen: Set<string>, tileIdAt: TileIdProbe): number {
  const shares = sharesOfCounts(tileCountsOverSeenCells(seen, tileIdAt));
  let bits = 0;
  for (const share of shares.values()) {
    bits -= share * Math.log2(share);
  }
  return bits;
}
