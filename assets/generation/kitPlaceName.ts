import type { RandomStream } from '../../procgen/random/mulberry32';
import { rotated } from './kitRandom';

const OPENING_SYLLABLES: readonly string[] = [
  'ash', 'brack', 'cal', 'dun', 'el', 'fen', 'gor', 'hal',
  'kirk', 'lin', 'mor', 'oke', 'pen', 'ram', 'sel', 'tarn', 'vale', 'wyn',
];

const CLOSING_SYLLABLES: readonly string[] = [
  'der', 'ling', 'mer', 'ric', 'stan', 'thorn', 'wen', 'bur', 'dale', 'holm',
];

const PLACE_SUFFIXES: readonly string[] = [
  'wold', 'mere', 'fen', 'tor', 'by', 'ness', 'holt', 'garth',
];

export function generatedPlaceName(random: RandomStream, takenNames: readonly string[]): string {
  const taken = new Set(takenNames);
  return firstFreeName(candidatePlaceNames(random), taken);
}

function candidatePlaceNames(random: RandomStream): string[] {
  const openings = rotated(OPENING_SYLLABLES, Math.floor(random() * OPENING_SYLLABLES.length));
  const closings = rotated(CLOSING_SYLLABLES, Math.floor(random() * CLOSING_SYLLABLES.length));
  const suffixes = rotated(PLACE_SUFFIXES, Math.floor(random() * PLACE_SUFFIXES.length));
  return openings.flatMap((opening) =>
    closings.flatMap((closing) => suffixes.map((suffix) => `${opening}${closing}${suffix}`)),
  );
}

function firstFreeName(candidates: readonly string[], taken: ReadonlySet<string>): string {
  return candidates.find((candidate) => !taken.has(candidate)) ?? (candidates[0] as string);
}
