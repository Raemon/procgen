import type { RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { rotated } from './kitRandom';
import type { KitPalette } from './kitPalette';
import type { TileSlot } from './kitTileSlots';
import { FINISH_ADJECTIVES, materialWordsOf } from './tileWordLists';

export function composedTileNames(
  random: RandomStream,
  slots: readonly TileSlot[],
  palette: KitPalette,
  takenNames: readonly string[],
): string[] {
  const taken = new Set(takenNames);
  return slots.map((slot) => {
    const name = firstFreeName(candidateNamesFor(slot, palette, random()), taken);
    taken.add(name);
    return name;
  });
}

function candidateNamesFor(slot: TileSlot, palette: KitPalette, roll: number): string[] {
  const words = materialWordsOf(palette.materials[slot.material]);
  const start = Math.floor(roll * FINISH_ADJECTIVES.length);
  return rotated(FINISH_ADJECTIVES, start).flatMap((finish) =>
    words.map((word) => `${finish} ${word} ${slot.form}`),
  );
}

function firstFreeName(candidates: readonly string[], taken: ReadonlySet<string>): string {
  return candidates.find((candidate) => !taken.has(candidate)) ?? (candidates[0] as string);
}
