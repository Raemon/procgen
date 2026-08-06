import { LANGUAGE_CONCEPTS, type LanguageConcept } from './concepts';
import { languageStream, phonologyForSeed, type Phonology } from './phonology';
import { shapeWord } from './wordShapes';
import type { RandomStream } from '../random/mulberry32';

export type Lexicon = Record<LanguageConcept, string>;

export function buildLexicon(seed: number): Lexicon {
  const phonology = phonologyForSeed(seed);
  const rng = languageStream(seed, 'roots');
  const taken = new Set<string>();
  const entries = LANGUAGE_CONCEPTS.map((concept) => [concept, nextRoot(phonology, rng, taken)]);
  return Object.fromEntries(entries) as Lexicon;
}

function nextRoot(phonology: Phonology, rng: RandomStream, taken: Set<string>): string {
  let word = shapeWord(phonology, rng);
  for (let attempt = 0; attempt < 64 && !isUsableRoot(word, taken); attempt++) {
    word = attempt < 48 ? shapeWord(phonology, rng) : word + shapeWord(phonology, rng);
  }
  taken.add(word);
  return word;
}

function isUsableRoot(word: string, taken: Set<string>): boolean {
  if (word.length < 3 || !/[^aeiou]/.test(word)) return false;
  return ![...taken].some((held) => held.startsWith(word) || word.startsWith(held));
}
