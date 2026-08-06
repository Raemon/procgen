import type { LanguageConcept } from './concepts';
import { compoundWord } from './compounds';
import type { Lexicon } from './lexicon';

export interface SiteTraits {
  nearWater: boolean;
  height: number;
}

export function placeNameFor(lexicon: Lexicon, traits: SiteTraits, pick01: number): string {
  return compoundWord(lexicon, modifierFor(traits, pick01), headFor(traits));
}

export function headFor(traits: SiteTraits): LanguageConcept {
  if (traits.nearWater) return 'water';
  if (traits.height > 0.7) return 'stone';
  return 'land';
}

function modifierFor(traits: SiteTraits, pick01: number): LanguageConcept {
  const options = modifierOptions(traits);
  return options[Math.floor(pick01 * options.length) % options.length]!;
}

function modifierOptions(traits: SiteTraits): LanguageConcept[] {
  if (traits.nearWater) return ['meet', 'still', 'swift', 'deep', 'cold'];
  if (traits.height > 0.7) return ['high', 'cold', 'dark'];
  return ['high', 'still', 'dark', 'meet'];
}
