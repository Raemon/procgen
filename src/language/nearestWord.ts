import { LANGUAGE_CONCEPTS, type LanguageConcept } from './concepts';
import type { Lexicon } from './lexicon';

export interface HeardWord {
  concept: LanguageConcept;
  word: string;
  distance: number;
}

export function hearUtterance(lexicon: Lexicon, utterance: string): HeardWord {
  let heard: HeardWord | null = null;
  for (const concept of LANGUAGE_CONCEPTS) {
    const word = lexicon[concept];
    const distance = editDistance(utterance, word);
    if (!heard || distance < heard.distance) heard = { concept, word, distance };
  }
  return heard!;
}

export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length]!;
}
