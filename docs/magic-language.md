# The spoken world: a design for procedural magical language

Design proposal — nothing here is built yet. A throwaway generator
(`scripts/sketchProtoLanguage.mjs`) produced the word tables below; everything
else is paper.

## The conceit

The seed is the First Word. The pipeline is its grammar. Every field the world
computes — uplift, flow accumulation, warmth, moisture — is a *domain of
speech*, and each domain has a true name in the proto-language the world was
uttered in. The world is not *described* by the language; the world is what the
language, fully spoken, evaluates to.

Mortal languages are descendants of that proto-language, worn down by regular
sound change as they spread across the map. Magic is joining the world's
ongoing utterance: speak a word aloud and the field it descends from is tugged
toward what you said. How hard it is tugged depends on how *true* your form of
the word is — how close it lies to the proto-form along the tree of descent —
and how well your utterance fits the poetics of the land you stand in.

This engine is unusually suited to making that deep rather than cosmetic,
because of one architectural fact: **the world is lazily re-derived from its
causes**. `PipelineEvaluator` pulls each chunk through the whole causal graph —
uplift → warp → depressions → flow → rivers → biomes → towns — and caches by
signature. Most games can only let magic repaint outputs. Here, a spell can
perturb an *upstream* field and let the world's own physics recompute every
consequence: raise stone across a valley and the river backs into a lake, the
downstream bed runs dry, the marsh biome creeps in, and the confluence town's
site stops being a confluence. Magic edits causes; hydrology does the rest.

## Part 1 — The languages

### An infinite family tree, computed lazily

The world is infinite, so the family tree must be too. Descent follows the same
trick the terrain already uses for region-coherent structure (`ctx.rngAt` over
region lattices): a hierarchy of nested region lattices, coarse to fine.

- At the coarsest scale (something like 64×64 chunks — an *age*), each cell
  holds an ancient tongue derived directly from the proto-language.
- Each cell at the next scale down descends from its parent cell's language by
  a seeded, ordered chain of sound laws, 2–5 per generation.
- Three or four levels down you reach the *vernacular* — the living language of
  that region, the one its places are named in.

`languageAt(x, y)` is then a pure function of `(seed, x, y)`: hash your way
down the lattice hierarchy, deriving each generation on demand. No global
pass, no storage, same answer forever — a Tolkien legendarium of unbounded
size that costs nothing until someone reads from it.

The proto-language itself is never fully reachable — it sits above the top
lattice scale, the limit of the tree. You can reconstruct toward it; you
cannot walk to a place that still speaks it. (Whether *anything* still speaks
it is good lore material.)

### Phonology grown from the land

A language's sound inventory is biased by the terrain statistics of its
homeland cell, sampled from the same fields the pipeline computes —
aggregate uplift, coast distance, flow accumulation, the warmth idiom from the
`pole to equator` preset:

| terrain signal | phonological lean |
| --- | --- |
| high uplift, steep slopes | hard codas, stop clusters, ejective-flavored consonants |
| high flow accumulation, valleys | liquids and glides, open CV syllables |
| coastline | large vowel inventories, diphthongs |
| cold (low warmth) | breathy fricatives, `th` / `kh` / `hl` |

So mountain speech crunches, river speech runs, and a traveler can *hear*
geography before they understand a word — which matters, because hearing
geography in words is the first skill the learning game teaches.

### Regular sound change, the way Tolkien did it

Daughter languages are not re-rolled word lists. Each branch applies an
ordered chain drawn from a catalog of real diachronic changes — lenition,
spirantization, umlaut, monophthongization, final-vowel loss, nasal
assimilation, liquid shifts — as rewrite rules over phoneme strings. Cognates
therefore stay *recognizably* related, and the relationships are systematic
enough to be reverse-engineered. Sample output from the sketch generator, one
proto-language and four vernaculars two generations down:

```
concept     proto      mountain   rivervale  coast      marsh
water       houkhar    houkar     houkar     huukhar    huukhar
river       kho        ko         ko         khuu       khu
stone       banbei     banb       banbi      baenbei    banbei
land        goun       goun       goun       guun       guun
dark        gouya      gouy       gouya      guuya      guuya
meet        nago       nag        naghuu     naghuu     naghu
sleep       khalei     kal        kali       khaelei    khalei

mountain:  final vowel loss, kh > h
rivervale: s > h, w-fortition, final consonant loss, kh > h
coast:     w-fortition, u-breaking, o-raising, i-umlaut
marsh:     th-stopping, final consonant loss, sh > s
```

A player who notices that mountain-speech drops final vowels and turns `kh`
into `k` is doing philology. That observation is a *spell component*: it is
how you run words backward toward truer forms.

### Interbreeding: rivers connect, mountains divide

Contact between languages is weighted by travel cost read from the terrain
fields. Adjacent cells joined by a river or a shared coast borrow vocabulary
freely; cells separated by uplift belts barely touch. Consequences that fall
out for free:

- **Creoles at confluences.** `riverTowns` already places towns at mouths and
  confluences — exactly where contact peaks. Town vernaculars are mixed
  lexicons: mostly the local tongue, salted with borrowed trade words.
- **Archaic enclaves in the mountains.** Isolated cells apply fewer laws per
  generation. High valleys preserve older forms — which, since older is
  truer, means mountain hermits speak words that still bite. (This is why the
  wizard lives up there.)
- **Borrowed words are shallow.** A loanword arrived sideways, not down the
  tree of descent, so it carries less depth than its native cognate. Trade
  towns are fluent and magically thin; that tension is setting texture the
  system generates by itself.

### Names are true descriptions

The lexicon's root inventory is not fantasy set dressing — it is the
pipeline's own vocabulary: *stone, water, gather, flow, rise, fall, still,
swift, deep, high, meet, bind, break, sleep, wake, dark, light, cold...* —
roots for the fields the world computes and the operations its nodes perform.

Place names are compounds of those roots, chosen by *reading the local
fields at the named point*. A town where two rivers join is literally named
"meet-water" in the local tongue — `naghoukar` in one valley, `naghukhar`
across the ridge. A peak is "high-stone", a lake "still-deep". Names gloss
themselves once you know a handful of roots, and every signpost is a
vocabulary lesson — exactly how Tolkien's nomenclature works (Mordor is just
"black-land"), and exactly how real toponymy works.

Better: when magic later reroutes a river, the town keeps its old name. Names
fossilize dead geography. The map becomes an archaeological record of both
world history and your own spellwork.

## Part 2 — Learning: the comparative method as gameplay

There is no spellbook and no dictionary. The world exposes language the way a
country you've moved to does:

1. **Immersion.** Town names, peak names, creature names, and inscriptions on
   standing stones all render in the local vernacular — in the observation
   text the agent views already emit, and on the map. No glosses.
2. **Grounding.** Names describe their sites, so meaning is inferable from
   geography: three lakeside places sharing the element `rus-` is data.
3. **Comparison.** Cross a ridge and the names shift systematically:
   `banbi` / `banbei` / `baenbei`. Aligning cognates reveals the sound laws.
4. **Reconstruction.** Run the laws backward toward the ancestor form. The
   game never tells you whether your reconstruction is right. The land does,
   by how deeply it answers when you speak it.

Note what this rewards: pattern-hearing, not syntax-memorizing. The endgame
skill is the comparative method — the actual technique Tolkien practiced
professionally and built his legendarium on.

This is also a perfect fit for the repo's LLM-first design. Character agents
already receive pure-text observations; a language that must be acquired by
fieldwork is a genuinely novel agent benchmark, and an LLM slowly working out
that `-gou-` means "dark" from twenty place names is exactly the kind of thing
this playground exists to watch.

## Part 3 — Speaking: poetry, not programming

An utterance is one or more roots with inflections, spoken at a place. What
keeps it from becoming a command line:

**No syntax errors.** Any well-formed word in a real tongue of the world does
*something*. Failure is drift, not rejection: a mispronounced "still-water"
doesn't error, it half-lands — mist instead of calm, a shiver instead of a
freeze. The feedback channel is the world's response, never a message.

**Meaning from roots, magnitude from music.** Roots and affixes select *what*
(domain, direction: rise/fall, gather/scatter, bind/loose). But scope, power,
and permanence come from prosody — and each language has its own seeded
poetics defining what the land it shaped listens for: this valley answers to
alliteration, that coast to long-vowel meter, the marshes to parallel
phrasing. A single whispered word touches a point. A well-turned couplet in
the local mode moves a valley. The same syllables, flat and unmetered, barely
stir. Composing a strong spell *is* composing a small poem in a language you
had to learn from stones.

**Depth gates the strata of reality.** The vernacular is young; it can touch
young, fast fields — moisture, growth, light, creature mood. Older
reconstructed forms reach older strata: the ancient tongue moves water and
weather; anything near the proto-form can touch uplift itself. Power is
etymological depth, so the progression system *is* the philology, with no
separate skill tree needed. And because "closeness to the true form" is
string distance along the descent chain, grading it is cheap and continuous.

**Register over incantation.** Because effect strength is continuous in
truth-of-form and quality-of-poetics, two players (or agents) can cast "the
same spell" with completely different words — one muttering a borrowed trade
word for a flicker of the effect, one delivering a reconstructed verse that
rearranges the watershed.

## Part 4 — Touching the fabric

### The spoken-world ledger

Casting is an ability — `speak`, taking an utterance and a position — because
abilities are the only mutation path in this app, for the UI, the API, and
agents alike. Parsing, scoring, and effect resolution are pure functions of
`(seed, utterance, position, ledger-so-far)`; the ability appends the resolved
utterance to a **spoken-world ledger**, the only new mutable state, owned by
the runtime like every other library and persisted the same way. The world
remains fully determined by `(seed, pipeline, ledger)` — replay the ledger,
get the same world, deterministic to the last phoneme.

### Effects enter upstream

Each resolved utterance becomes a localized field delta bound to a *domain
tap*. Pipeline nodes gain an optional `attunement` choice knob (fits the knob
typology) declaring which domain of speech they embody — the uplift node is
*stone*, flow accumulation is *gather-water*, the warmth field is *cold/warm*,
biome growth is *green*. Templates ship pre-attuned; pipeline authors rewire
what words mean by rewiring what nodes they touch, which is a pleasingly
literal version of "the pipeline is the grammar".

At eval time, the evaluator adds the deltas of any ledger entries intersecting
the chunk to the attuned node's output before caching; attuned nodes carry the
ledger revision in their cache signature, so everything downstream of a
spoken change re-derives automatically and nothing else recomputes. Cache
correctness is exactly the existing signature mechanism, extended by one term.

Shallow domains (growth, light, moisture) tap close to the display bindings —
cheap, local, quick to render. Deep domains (stone, gather-water) tap above
the hydrology chain, where a small delta cascades: `fillDepressions` →
`flowAccumulation` → `carveValleys` → `riverFromFlow` → `biomeBands` →
`riverTowns` all re-derive. Speaking stone in the old tongue does not paint
rock on the map. It *changes what the world's physics has always concluded* —
downstream and out of sight, the river finds another way to the sea.

### Costs, limits, permanence

- **Radius and duration scale with poetic form**, not a mana pool: a whisper
  is an ephemeral touch (an overlay that fades from the ledger); a bound verse
  — one carrying the *bind* root — is permanent.
- **Deep words demand deep knowledge**: the truth-of-form gate means area and
  permanence on the old strata are simply unreachable until you have done the
  philology.
- **The land pushes back.** A delta fighting a strong gradient (raising stone
  mid-ocean, greening high snow) is discounted by the field's local magnitude
  — some poems the valley refuses to hear.

## Build order

1. **`src/language/`** — lattice family tree (`languageAt`), terrain-biased
   phonology, sound-law catalog, proto-root lexicon keyed to domain concepts,
   compounding morphology. Pure functions of `(seed, coords)`; promote the
   sketch script into tested modules. Determinism + cognate-regularity checks
   in `scripts/checkProcgenInvariants.ts`.
2. **Names in the world** — name `'town'` points (and peaks/lakes via local
   field reads) at the observation/view layer; standing-stone inscriptions as
   a points node. The world starts teaching before magic exists.
3. **`speak` ability + ledger + shallow domains** — parse/score/resolve,
   ledger in the runtime, effects as display-adjacent overlays (growth, light,
   calm water). API-testable end to end: speak via POST, read the ascii view.
4. **Deep taps** — `attunement` knob, evaluator delta injection, ledger
   revision in signatures. The river-reroute demo lives here.
5. **Poetics and depth scoring** — per-language aesthetics, truth-of-form
   grading, reconstruction, borrowing/creoles, name fossils.

Each phase ships something visible alone, and everything through phase 4 is
exercisable from scripts and the REST API without a browser.

## Open questions

- **Sound over text?** Everything above works purely in text, which suits the
  agent views. If humans should someday *hear* the languages, phonology
  should pick up per-language pitch/length conventions early so audio can be
  layered on without re-rolling every word.
- **Script and runes.** Phoneme→glyph mapping for inscriptions: procedural
  glyph shapes on standing stones, or the existing symbol catalog as a rune
  inventory? (Writing systems can also descend and diverge — a second tree.)
- **Does the world speak back?** Utterance drift (mist when you meant calm)
  could be the world *answering* in kind — emitting a nearby name or verse as
  a hint. That turns miscasting into a conversation, which fits the poetry
  goal, but needs care to avoid becoming an oracle that short-circuits the
  philology.
- **How much should agents be told?** Character agents learning by fieldwork
  is the pure version. Should god agents get a dictionary ability, or must
  gods do philology too?
