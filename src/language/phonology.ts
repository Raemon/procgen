import { hashString } from '../random/hashString';
import { mulberry32, type RandomStream } from '../random/mulberry32';

export interface Phonology {
  onsets: string[];
  vowels: string[];
  codas: string[];
  codaChance: number;
}

const ONSET_POOL = ['p', 't', 'k', 'b', 'd', 'g', 'f', 'th', 's', 'sh', 'kh', 'v', 'z', 'h', 'm', 'n', 'ng', 'l', 'r', 'hl', 'w', 'y'];
const VOWEL_POOL = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'ai', 'au', 'ei', 'ou'];
const CODA_POOL = ['n', 'l', 'r', 's', 'm', 'th', 'k', 'sh'];

export function phonologyForSeed(seed: number): Phonology {
  const rng = languageStream(seed, 'phonology');
  return {
    onsets: drawDistinct(rng, ONSET_POOL, 12),
    vowels: drawDistinct(rng, VOWEL_POOL, 7),
    codas: drawDistinct(rng, CODA_POOL, 5),
    codaChance: 0.25 + rng() * 0.4,
  };
}

export function languageStream(seed: number, label: string): RandomStream {
  return mulberry32(hashString(`language:${seed}:${label}`));
}

function drawDistinct(rng: RandomStream, pool: readonly string[], count: number): string[] {
  const remaining = [...pool];
  const drawn: string[] = [];
  while (drawn.length < count && remaining.length > 0) {
    drawn.push(remaining.splice(Math.floor(rng() * remaining.length), 1)[0]!);
  }
  return drawn;
}
