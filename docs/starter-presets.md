# Starter presets for the three generation centers

Companion to `generation-centers.md`: one preset per center, each designed to
pay off in the first minute of a brand-new character's life. A new character
spawns at world origin `(0, 0)` (snapped to the nearest walkable cell within
64 tiles), so every preset is built outward from the origin: the payoff must
be standing at `(0, 0)` looking around, not somewhere the player has to find.

The shared trick is a tiny new node, **`gradientField`** (see the revisions
section of `generation-centers.md`) in its radial mode — called *journey*
below: a field that is 0 at the origin and rises to 1 at `range` tiles out;
a pure function of coordinates, no inputs, no windowing. `poleToEquator`
already hand-rolls this node's linear mode as a custom script, which is the
proof it earns promotion. Two of the three presets pace everything with the
radial mode: it is the "how far into the world are you" signal that masks,
rings, and story gradients all read.

Since the agents merge there are two kinds of new character: the human in
the 2.5D character view and an LLM autopilot reading text observations.
Tiles, prefabs, and tagged markers appear in both (markers arrive as
glyph + tag in the agent's legend); **creatures appear only in the human
views**, so each preset's payoff below is carried by the former and merely
garnished by the latter.

Tile ids referenced below are the default tileset (0 water, 2 grass, 4 rock,
10 marsh, 12 flowers, 13 bush, 14 pine, 16 flagstone, 17 stone wall, 18
brick wall, 19 wood planks). Prefabs: 0 cottage, 1 watchtower, 2 standing
stones. Creatures: 0 deer, 1 rabbit, 2 wolf, 3 sentry.

---

## Adventure — "the frontier"

**The first minute.** You spawn in a sunlit hamlet: a few cottages, deer and
rabbits, a ring of flowers marking the meadow's edge. Whichever direction
you walk, the world hardens on schedule — grass gives way to pine forest,
wolves start hunting, and on the horizon a watchtower marks the frontier.
Past the towers, sentries stand over treasure markers. The preset teaches
the game's core promise wordlessly: home is behind you, reward is out there,
and distance *is* difficulty.

**Pipeline** (all existing nodes except `gradientField`):

| node | type | purpose |
| --- | --- | --- |
| terrain | `noiseField` scale 0.045, oct 5 | elevation display; the land's shape |
| journey | `gradientField` radial, range 220 | hidden; the pacing signal |
| home | `gradientField` radial, range 220, invert | hidden; 1 at spawn falling to 0 |
| safe ground | `combineFields` max(terrain, home × ~0.6) | guarantees the origin sits at meadow height — the spawn is never underwater |
| land | `thresholdTiles` on safe ground: water < 0.45, grass above | base coat |
| flower ring | `thresholdTiles` on journey: flowers ≥ 0.28 | painted over by the next layer beyond 0.33, leaving a ring |
| ring cap | `thresholdTiles` on journey: grass ≥ 0.33 | the erase-by-repaint half of the ring trick |
| pines | `scatterPoints` mask journey 0.35–0.65, markers tile 14 | the forest belt that darkens the middle distance |
| hamlet | `scatterPoints` mask journey 0–0.12, prefab cottage | home, visible at spawn |
| towers | `scatterPoints` sparse, mask journey 0.5–0.7, prefab watchtower | landmarks that beckon (tall enough to read in 2.5D) |
| deer / rabbits | `scatterPoints` mask journey 0–0.3, creatures 0 / 1 | the safe zone feels alive |
| wolves | `scatterPoints` mask journey 0.45–1, creature 2 | danger arrives on schedule |
| hoards | `scatterPoints` very sparse, mask journey 0.75–1, gold `$` markers with sentries (creature 3) via a twin node on the same mask | the reason to go |

**Needs building:** `gradientField` only. Everything else ships today. For
an API agent the wolves and deer are invisible; the pacing it reads is the
flower ring, the pine belt, and the towers — which is why those are tiles
and prefabs, not creatures.

**Ring trick, for the record:** a band of tiles between two journey values is
two stacked thresholds — paint the band tile from the inner cut outward,
then repaint the base tile from the outer cut outward. Later layers win, so
what survives is the ring.

---

## Puzzle — "the sealed vaults"

**The first minute.** You spawn inside a vast maze of rock and flagstone.
Within a corridor or two you meet a brick-red door with a red `⚷` glyph
floating beside your map view — and deeper in, through a gap, you glimpse
the standing stones at the maze's heart. The world *is* the puzzle: every
4×4-chunk region is a self-contained vault with three color-coded gates
between its entrance and its heart, keys tucked in side branches, and a
sentry guarding each key. Solve one vault and the next region over is a
fresh one — the labyrinth's border doors already stitch them into an
endless world.

**Pipeline** (built on the phase-2 `gateMaze` / `gateKeys` pair):

| node | type | purpose |
| --- | --- | --- |
| vault | `gateMaze` mazeChunks 4, corridor 3, wall 1, braid 0, gates 3; wall rock, floor flagstone, gate tiles: wood planks / brick wall / stone wall | the maze with 3 gates placed on the entrance→heart path of its spanning tree |
| key 1..3 | `gateKeys` gate N, display markers `⚷` colored to match gate N's tile | each gate's key, placed in a side branch reachable before its gate |
| guards 1..3 | `gateKeys` gate N, display creatures → sentry | the same points with a creature display: a guard standing exactly on each key |
| heart | `gateKeys` emit = goal, display prefab standing stones | the visible prize at the region's center |

`braid 0` matters: a perfect maze means the gates genuinely order the route.
`gateKeys` re-derives the identical plan from identical knobs (the
shared-derivation idiom), so the preset ships as a template that stamps all
five nodes with matching params.

**Payoff before interactivity exists:** gate 1 is `wood planks` — walkable —
and gates 2–3 are painted walkable door tiles too in v0, so the vault is
traversable and reads as a sequence of thresholds guarded by sentries
(dodging a `guard`-behavior sentry is already a real game for the human
player). The three gate tiles have distinct symbols (`≡` `█` `▓`), so an
API agent reads the gate sequence and the tagged `⚷` key markers directly
from its observation legend — the vault is a legible text puzzle before it
is an interactive one. When the quest-state layer lands, the same preset
flips its gate tiles to blocking walls and becomes a true lock-and-key
crawl with zero other changes.

**Needs building:** `gateMaze` + `gateKeys`, plus the solvability check in
`checkProcgenInvariants.ts`. Quest state is a later, separable upgrade —
and since the agents merge it must be a shared module (browser walkability
*and* `serverWorld`, per the parity rule), which is exactly why v0 does not
wait for it.

---

## Narrative — "the dying river"

**The first minute.** You wake in the last living village: cottages on a
riverbank, deer at the treeline, the river sliding past toward the sea.
Walk upstream and the story tells itself — the next village is roofless
ruins, the grass sours into marsh, dead bushes and wolves take over, and
midway you pass a ring of standing stones, the old wards, beyond which
nothing living stands. No text anywhere, but every player invents the same
sentence: *something is coming down the river, the stones held it once, and
my village is next.*

**Pipeline:**

| node | type | purpose |
| --- | --- | --- |
| terrain | `noiseField` scale 0.05, oct 5 | elevation |
| journey | `gradientField` radial, range 300 | hidden; here it is decay-distance, not danger |
| land | `thresholdTiles` water < 0.45, grass | base coat (seed picked so the origin is a riverbank; the adventure preset's home-lift combine works here too) |
| rivers | `riverTiles` on terrain, water tile | the spine the story hangs on |
| blight | `combineFields` multiply(journey, `regionFate`) → `thresholdTiles` marsh ≥ 0.5 | corruption that creeps in patchily with distance — fate gives it district-sized clumps, journey gives it a direction |
| living towns | `riverTowns` mask journey ≤ 0.35, prefab cottage | home and its neighbors |
| ruined towns | `riverTowns` mask journey > 0.35, prefab **ruined cottage** | the same settlement logic, decayed — the story *is* this one mask |
| wards | `scatterPoints` very sparse, mask journey 0.4–0.5, prefab standing stones | the boundary made visible |
| dead bushes | `scatterPoints` mask on blight field, markers tile 13 | texture for the far zone |
| deer / wolves | `scatterPoints` masked journey low / high | living lands vs. dying lands |

The load-bearing move: **living and ruined towns come from the same
`riverTowns` logic split by one mask**. The player reads cause (river
connects them), sequence (decay grows with distance), and stakes (you are at
the end of the line) from pure placement.

`fallenMetropolis` (new on main) already tells a decay story with a hashed
per-district fate — that script is what `regionFate` promotes. The
difference here is direction: the metropolis's ruin is statistically the
same everywhere, while the dying river anchors the gradient at the spawn,
so the new character has a *place* in the story rather than a tour of one.

**Needs building:** `gradientField`, an optional `mask` field input +
`maskAtLeast`/`maskAtMost` knobs on `riverTowns` (mirroring
`scatterPoints`), and one new default prefab: a *ruined cottage* (the
cottage with broken wall stubs and no roof).

---

## Build order

`gradientField` unlocks two of the three presets by itself and is an
afternoon's node (its linear mode also retires `poleToEquator`'s latitude
script). The order that pays off fastest:

1. `gradientField` → ship **the frontier** (rest is existing nodes).
2. `regionFate` + `riverTowns` mask + ruined-cottage prefab → ship
   **the dying river**.
3. `gateMaze`/`gateKeys` + solvability check → ship **the sealed vaults**
   (walkable-gate v0), then flip to blocking gates when quest state lands.

Each preset lands in `src/procgen/presets/` as an `ExamplePipeline` with
per-node comments, like `settlementsAndWildlife.ts`, and doubles as the
acceptance test for its phase in `generation-centers.md`.
