import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { rotated } from './kitRandom';

const KIT_SYMBOL_POOL: readonly string[] = [
  '▒', '▄', '▀', '▐', '▌', '▖', '▗', '▘', '▝', '▚', '▞',
  '╱', '╲', '╳', '┼', '┤', '├', '┬', '┴', '╋', '╂', '┿',
  '◧', '◨', '◩', '◪', '◫', '▣', '▢', '▩', '▨', '▧',
  '⊞', '⊟', '⊠', '⊡', '⊓', '⊔', '⋈', '⌗', '⌸', '⌷',
  '⍁', '⍂', '⍚', '⎔', '⏢', '⏣', '✦', '✧', '❖', '❑', '❒',
  '⬒', '⬓', '⬔', '⬕', '⬖', '⬗', '⬚', '⌇',
];

export function chosenTileSymbols(
  random: RandomStream,
  count: number,
  takenSymbols: readonly string[],
): string[] {
  const taken = new Set(takenSymbols);
  return Array.from({ length: count }, () => {
    const symbol = firstFreeSymbol(random(), taken);
    taken.add(symbol);
    return symbol;
  });
}

function firstFreeSymbol(roll: number, taken: ReadonlySet<string>): string {
  const pool = rotated(KIT_SYMBOL_POOL, Math.floor(roll * KIT_SYMBOL_POOL.length));
  return pool.find((symbol) => !taken.has(symbol)) ?? (pool[0] as string);
}
