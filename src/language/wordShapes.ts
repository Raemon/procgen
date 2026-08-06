import type { RandomStream } from '../random/mulberry32';
import type { Phonology } from './phonology';

export function smoothVowelRuns(word: string): string {
  return word.replace(/([aeiou])\1+/g, '$1').replace(/([aeiou]{2})[aeiou]+/g, '$1');
}

export function shapeWord(phonology: Phonology, rng: RandomStream): string {
  const syllables = rng() < 0.45 ? 1 : 2;
  let word = '';
  for (let i = 0; i < syllables; i++) word += shapeSyllable(phonology, rng, i === 0);
  return smoothVowelRuns(word);
}

function shapeSyllable(phonology: Phonology, rng: RandomStream, isFirst: boolean): string {
  const onset = isFirst && rng() < 0.15 ? '' : pickFrom(phonology.onsets, rng);
  const vowel = pickFrom(phonology.vowels, rng);
  const coda = rng() < phonology.codaChance ? pickFrom(phonology.codas, rng) : '';
  return onset + vowel + coda;
}

function pickFrom(options: readonly string[], rng: RandomStream): string {
  return options[Math.floor(rng() * options.length)]!;
}
