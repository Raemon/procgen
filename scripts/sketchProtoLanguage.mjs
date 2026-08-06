const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngFor = (label) => mulberry32(hash(label));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const pickW = (rng, pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
};

const STOPS = ['p', 't', 'k', 'b', 'd', 'g'];
const FRICS = ['f', 'th', 's', 'sh', 'kh', 'v', 'dh', 'z', 'h'];
const NASALS = ['m', 'n', 'ng'];
const LIQUIDS = ['l', 'r', 'rh', 'hl'];
const GLIDES = ['w', 'y'];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'ai', 'au', 'ei', 'ia', 'ou'];

const makePhonology = (label, bias) => {
  const rng = rngFor('phonology:' + label);
  const take = (pool, n) => {
    const out = []; const p = [...pool];
    for (let i = 0; i < n && p.length; i++) out.push(p.splice(Math.floor(rng() * p.length), 1)[0]);
    return out;
  };
  return {
    onsets: [
      ...take(STOPS, 3 + Math.floor(bias.hard * 3)),
      ...take(FRICS, 2 + Math.floor(bias.breath * 3)),
      ...take(NASALS, 2), ...take(LIQUIDS, 1 + Math.floor(bias.flow * 3)), ...take(GLIDES, bias.flow > 0.5 ? 2 : 1),
    ],
    vowels: take(VOWELS, 4 + Math.floor(bias.open * 4)),
    codas: bias.hard > 0.5 ? [...take(STOPS, 2), ...take(NASALS, 2), 'l', 'r', 's', ''] : ['n', 'l', 'r', 's', '', '', ''],
    codaChance: 0.25 + bias.hard * 0.5,
  };
};

const smoothVowelRuns = (w) => w.replace(/([aeiou])\1+/g, '$1$1').replace(/([aeiou]{2})[aeiou]+/g, '$1');
const makeRoot = (ph, rng, taken) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const syllables = pickW(rng, [[1, 4], [2, 5]]);
    let word = '';
    for (let i = 0; i < syllables; i++) {
      const onset = i === 0 && rng() < 0.15 ? '' : pick(rng, ph.onsets);
      const coda = rng() < ph.codaChance ? pick(rng, ph.codas) : '';
      word += onset + pick(rng, ph.vowels) + coda;
    }
    word = smoothVowelRuns(word);
    const distinctEnough = word.length >= 3 && /[^aeiou]/.test(word);
    const fresh = ![...taken].some((t) => t === word || t.startsWith(word) || word.startsWith(t));
    if (distinctEnough && fresh) { taken.add(word); return word; }
  }
  throw new Error('root space exhausted');
};

const CONCEPTS = [
  'water', 'river', 'stone', 'mountain', 'land', 'fire', 'tree', 'wind',
  'deep', 'high', 'cold', 'dark', 'light', 'still', 'swift',
  'gather', 'flow', 'rise', 'fall', 'bind', 'break', 'meet', 'sleep', 'wake',
];

const SOUND_LAWS = [
  ['lenition of medial stops', (w) => w.replace(/(?<=[aeiou])p(?=[aeiou])/g, 'b').replace(/(?<=[aeiou])t(?=[aeiou])/g, 'd').replace(/(?<=[aeiou])k(?=[aeiou])/g, 'g')],
  ['spirantization', (w) => w.replace(/(?<=[aeiou])b(?=[aeiou])/g, 'v').replace(/(?<=[aeiou])d(?=[aeiou])/g, 'dh').replace(/(?<=[aeiou])g(?=[aeiou])/g, 'gh')],
  ['final vowel loss', (w) => w.length > 3 ? w.replace(/[aeiou]$/, '') : w],
  ['final consonant loss', (w) => w.length > 3 ? w.replace(/[ptkbdg]$/, '') : w],
  ['a-fronting', (w) => w.replace(/a/g, 'e')],
  ['o-raising', (w) => w.replace(/o/g, 'u')],
  ['u-breaking', (w) => w.replace(/(?<![aeiou])u(?![aeiou])/g, 'uo')],
  ['i-umlaut', (w) => /i/.test(w.slice(2)) ? w.replace(/a/, 'ae').replace(/o/, 'oe') : w],
  ['monophthongization', (w) => w.replace(/ai/g, 'e').replace(/au/g, 'o').replace(/ei/g, 'i')],
  ['diphthongization', (w) => w.replace(/(?<![aeiou])e(?=[^aeiou])/g, 'ie')],
  ['h-loss', (w) => w.replace(/(?<=.)h(?=[aeiou])/g, '')],
  ['w-fortition', (w) => w.replace(/^w/, 'v')],
  ['s to h shift', (w) => w.replace(/^s(?=[aeiou])/, 'h')],
  ['th-stopping', (w) => w.replace(/th/g, 't').replace(/dh/g, 'd')],
  ['nasal assimilation', (w) => w.replace(/n(?=[pb])/g, 'm').replace(/ng(?=[td])/g, 'n')],
  ['liquid shift r>l', (w) => w.replace(/r/g, 'l')],
  ['cluster simplification', (w) => w.replace(/([lnr])[ptk](?=[aeiou])/g, '$1d')],
  ['kh to h', (w) => w.replace(/kh/g, 'h')],
  ['sh to s', (w) => w.replace(/sh/g, 's')],
  ['gemination loss', (w) => w.replace(/(.)\1/g, '$1')],
];

const descend = (parentLexicon, label, lawCount) => {
  const rng = rngFor('descent:' + label);
  const laws = [];
  const pool = [...SOUND_LAWS];
  for (let i = 0; i < lawCount && pool.length; i++) laws.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const lexicon = {};
  for (const [concept, word] of Object.entries(parentLexicon)) {
    lexicon[concept] = smoothVowelRuns(laws.reduce((w, [, law]) => law(w), word));
  }
  return { lexicon, laws: laws.map(([name]) => name) };
};

const borrow = (lexicon, donor, concepts) => {
  for (const c of concepts) lexicon[c] = donor[c];
};

const seed = process.argv[2] ?? 'first-word';
const protoPh = makePhonology(seed + ':proto', { hard: 0.4, breath: 0.4, flow: 0.5, open: 0.5 });
const protoRng = rngFor(seed + ':roots');
const proto = {};
const taken = new Set();
for (const c of CONCEPTS) proto[c] = makeRoot(protoPh, protoRng, taken);

const branchA = descend(proto, seed + ':A', 3);
const branchB = descend(proto, seed + ':B', 3);
const mountain = descend(branchA.lexicon, seed + ':A:mountain', 2);
const rivervale = descend(branchA.lexicon, seed + ':A:rivervale', 4);
const coast = descend(branchB.lexicon, seed + ':B:coast', 4);
const marsh = descend(branchB.lexicon, seed + ':B:marsh', 3);
borrow(rivervale.lexicon, coast.lexicon, ['meet', 'swift']);

const langs = { 'proto': { lexicon: proto, laws: [] }, mountain, rivervale, coast, marsh };

console.log('seed:', seed, '\n');
for (const [name, { laws }] of Object.entries(langs)) {
  if (laws.length) console.log(`${name}: ${laws.join(', ')}`);
}
console.log('\nconcept        proto        mountain     rivervale    coast        marsh');
for (const c of CONCEPTS) {
  const row = [c, proto[c], mountain.lexicon[c], rivervale.lexicon[c], coast.lexicon[c], marsh.lexicon[c]];
  console.log(row.map((w) => w.padEnd(13)).join(''));
}

const clipForCompounding = (w) => { const clipped = w.replace(/[aeiou]+$/, ''); return /[aeiou]/.test(clipped) ? clipped : w; };
const compound = (lex, a, b) => (clipForCompounding(lex[a]) + lex[b]).replace(/(.)\1/g, '$1');
console.log('\nplace names (compounds):');
for (const [name, { lexicon }] of Object.entries(langs)) {
  if (name === 'proto') continue;
  console.log(`  ${name.padEnd(10)} ${compound(lexicon, 'meet', 'water')} "meet-water" (confluence town), ${compound(lexicon, 'high', 'stone')} "high-stone" (peak), ${compound(lexicon, 'still', 'deep')} "still-deep" (lake)`);
}
