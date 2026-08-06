import type { LanguageConcept } from './concepts';
import type { Lexicon } from './lexicon';
import { smoothVowelRuns } from './wordShapes';

export function compoundWord(lexicon: Lexicon, modifier: LanguageConcept, head: LanguageConcept): string {
  const joined = clipForJoining(lexicon[modifier]) + lexicon[head];
  return smoothVowelRuns(joined.replace(/(.)\1/g, '$1'));
}

function clipForJoining(word: string): string {
  const clipped = word.replace(/[aeiou]+$/, '');
  return /[aeiou]/.test(clipped) ? clipped : word;
}
