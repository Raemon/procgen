import type { CellCharacterProbe } from '../cellCharacter';
import { cellFromKey } from '../cellGrid';

export type ShareTally = Map<string, number>;

export function characterCountsOverCells(
  cells: Iterable<string>,
  characterAt: CellCharacterProbe,
): ShareTally {
  const counts: ShareTally = new Map();
  for (const key of cells) {
    const cell = cellFromKey(key);
    const character = characterAt(cell.x, cell.y);
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }
  return counts;
}

export function sharesOfCounts(counts: ShareTally): ShareTally {
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const shares: ShareTally = new Map();
  if (total === 0) return shares;
  for (const [character, count] of counts) shares.set(character, count / total);
  return shares;
}

export function entropyBitsOfShares(shares: ShareTally): number {
  let bits = 0;
  for (const share of shares.values()) {
    if (share > 0) bits -= share * Math.log2(share);
  }
  return bits;
}

export function entropyBitsOverCells(
  cells: Iterable<string>,
  characterAt: CellCharacterProbe,
): number {
  return entropyBitsOfShares(sharesOfCounts(characterCountsOverCells(cells, characterAt)));
}
