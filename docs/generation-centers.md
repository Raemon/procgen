# Puzzle-, adventure-, and narrative-centric generation

Design notes for three new "centers" of procedural generation and how each
maps onto the existing node/pipeline architecture. Nothing here changes the
engine's contract: the world stays a pure function of
`(seed, pipeline, chunk)`, nodes stay an acyclic dataflow of
`field | tiles | points` chunks, and everything large-scale rides on the
region-keyed determinism pattern the labyrinth already proves out.

## What each center means

The three centers differ in *what the generator has to reason about*:

| center | reasons about | defining guarantee |
| --- | --- | --- |
| puzzle | reachability and ordering | every challenge is solvable |
| adventure | gradients and destinations | pacing: safety → danger, landmarks worth walking to |
| narrative | history and meaning | the world's contents imply a coherent past |

- **Puzzle-centric** generation produces challenges with structure: locked
  doors whose keys are reachable first, switch circuits, one-way drops,
  sokoban rooms. The hard requirement is a *solvability guarantee*, which
  points at constructive generation — derive the solution first, then build
  the level around it — rather than generate-and-test.
- **Adventure-centric** generation organizes the world for a journey: a calm
  region near the origin, danger rising with distance, sparse landmarks that
  pull the player outward, trails that connect them, dungeons and loot as
  destinations. Everything is a gradient or a destination relative to some
  reference (the origin, or a landmark layer).
- **Narrative-centric** generation makes the world legible as a story:
  factions with territory and borders, ruins that evidence past events,
  regions with a consistent theme and era, story sites arranged in a
  meaningful sequence. The trick is deriving a compact latent "history" from
  the seed per region, then expressing it spatially through the ordinary
  value kinds.

## How they interface with the node structure

Almost everything needed already has a home. The mapping:

### Existing affordances each center rides on

1. **Region-keyed rng is the coherence mechanism.** Puzzles, quests, and
   histories are region-scale artifacts, exactly like a multi-chunk maze:
   every chunk of a region calls `ctx.rngAt(regionX, regionY, label)` and
   re-derives the same plan (`mazeChunkNode.ts` is the reference
   implementation, and `regionBorderDoors` shows cheap re-derivation of a
   *neighbor's* plan). A lock-and-key layout, a landmark, or a region's
   founding legend is just another value derived this way.
2. **Fields are gradients.** Danger, difficulty, faction influence, and
   "story tension" are ordinary fields. Downstream nodes already consume
   fields as masks (`scatterPoints` has `maskAtLeast`/`maskAtMost`), so an
   encounter gradient composes with existing scatter, biome, and blend nodes
   with zero new machinery.
3. **Point tags are the semantics channel.** `'town'` set the precedent:
   special-purpose nodes hardcode meaningful tags. Puzzle elements
   (`key:2`, `door:2`, `goal`), adventure sites (`landmark`, `dungeon`),
   and narrative sites (`ruin`, `shrine`, `battlefield`) are tagged points.
   Display bindings already turn tagged points into markers, prefabs, or
   creatures — so a `ruin` point becomes a collapsed-cottage prefab without
   any new rendering path.
4. **Tiles are the physical expression.** Doors are tiles; walkability is
   already derived from tiles, so a painted door blocks exactly as a wall
   does.
5. **Templates are the assembly layer.** Per the existing rule ("Andes is a
   template, not a node"), *a locked dungeon*, *a frontier journey*, and *a
   fallen kingdom* are assemblies of small operation-named nodes, shipped as
   built-in templates.
6. **Randomize recipes are the modes.** `mazeRecipe`/`terrainRecipe` get
   siblings: `puzzleRecipe`, `adventureRecipe`, `narrativeRecipe`, each a
   pool that stamps a plausible pipeline of the new nodes.
7. **Invariant checks carry the guarantees.** Solvability is asserted in
   `scripts/checkProcgenInvariants.ts`: BFS the painted tiles from the
   entrance, unlocking doors only after touching their key points, and fail
   the build if the goal is unreachable. Determinism checks come for free
   from the existing order-independence harness.

### Gaps, and how to bridge them

1. **Structural values (graphs, paths) don't fit field/tiles/points.**
   Lock-and-key dependencies and trails are relational. Two-step plan:
   start with *shared pure derivations* — a `regionPlan(ctx, params)`
   function in a shared file that sibling nodes each call (one paints door
   tiles, one emits key points); identical inputs + identical rng labels ⇒
   identical plan, no engine change. If re-derivation cost or wiring
   awkwardness starts to bite, promote to a real value kind (`paths` for
   polylines — also useful to rivers, roads, patrol routes — or
   `regionGraph`) following the "adding a new value kind" recipe in
   `authoring-nodes.md`.
2. **Interactivity is out of scope for the pipeline.** A door that opens
   when the player collects a key is game state, not worldgen. Creature
   time is the sanctioned impurity precedent: a thin, explicitly impure
   layer above a deterministic substrate. Phase 1 keeps puzzles structural
   (visible lock/key ordering, doors as terrain); a later `quest state`
   layer can toggle door overlays the way life animates creatures, without
   touching pipeline purity.
3. **Adventure needs a reference point.** Distance-from-origin is a pure
   function of coordinates, so a journey field is deterministic; a variant
   takes a `points` input and measures distance to the nearest landmark
   (chamfer machinery from `coastDistance` reused with a window radius as
   the cost knob).
4. **Names and lore must be derived, not authored.** The knob typology
   forbids string params — correctly, here: place names and legends should
   be *outputs* hashed from position and seed (`hash01`/`hashSeed` feeding
   a syllable table), surfaced on the display side (marker hover, a lore
   panel), never stored in params.

## Concrete first nodes

### Adventure (build first — pure composition, no new machinery)

- `distanceField` — field: distance from origin, or from the nearest point
  of a wired `points` input, normalized by a `range` knob. The universal
  pacing input.
- `landmarkLattice` — points: one jittered point per large lattice cell
  (`spacing` knob, `ctx.rngAt` per lattice cell), tagged `landmark`;
  display as prefabs for towers/dungeon entrances.
- `trailTiles` — tiles: paths connecting each landmark to its nearest
  neighbors, walked greedily over an elevation input the way rivers trace
  downhill.
- Template **frontier journey**: distance field → biome bands keyed to
  danger → masked creature/loot scatters per band → landmarks + trails.

### Puzzle (second — region re-derivation pattern, plus solvability checks)

- `gateMaze` — tiles: the labyrinth derivation, then on the region's
  spanning tree pick entrance and goal, place `gates` doors on the
  entrance→goal path and paint them with per-gate door tiles.
- `gateKeys` — points: the *same* plan re-derived, emitting `key:N` points
  in side branches reachable before gate N (classic lock-and-key on a
  spanning tree). Sibling-node pairing per the shared-derivation pattern
  above.
- Invariant: ordered-BFS solvability check in `checkProcgenInvariants.ts`.
- Later: `sokobanRooms`, `switchCircuits`, one-way ledges via elevation.

### Narrative (third — needs latent-history derivations)

- `factionField` — field/tiles: Voronoi lattice like `plateLattice`, each
  seat a faction with hashed traits; output influence field or territory
  tiles for borders.
- `ruinSites` — points: each region hashes an era and a fate (thrived,
  burned, abandoned); fate selects tag mix and density, so a burned region
  scatters `ruin` points where a thriving one scatters `village`. Display
  bindings pick matching prefabs.
- `storyPath` — points: ordered beat sites between two landmarks
  (`beat:0..n` tags), giving quest scaffolding a spatial spine.
- Template **fallen kingdom**: faction field → territory tiles → ruin sites
  masked to one faction → story path from the border to the throne.

## Phasing

1. **Adventure** — lowest risk, exercises masking/points/prefab display
   end-to-end, immediately playable with creatures.
2. **Puzzle** — introduces the shared-plan idiom and the solvability
   invariant; defers interactivity.
3. **Narrative** — builds on both (factions want territory gradients, story
   paths want landmarks), adds latent-history derivation and derived
   naming.

Each phase lands as: node files under `src/procgen/nodes/<center>/`, a
built-in template, a randomize recipe, and invariant checks — no changes to
the evaluator, cache, wiring, or panel.

## Revisions after merging the agents & view-modes work

Main landed the agent API, the four view modes, world presets, and two big
example worlds (`poleToEquator`, `fallenMetropolis`). Four things change:

1. **Two proposed nodes already exist as custom scripts — promote them.**
   `poleToEquator` hand-rolls a latitude gradient (`LATITUDE_SCRIPT`) and
   `fallenMetropolis` hand-rolls per-district latent history
   (`DISTRICT_FATE_SCRIPT`). Per the promote-stable-scripts rule these
   become the first two center nodes, generalized:
   - `gradientField` — one coordinate-gradient node with a `direction`
     choice (*distance from origin* / *north→south* / *west→east*), `range`,
     `invert`, and center offset ints. The radial mode is `journeyField`
     from the preset designs; the linear mode retro-serves `poleToEquator`.
   - `regionFate` — per-region hash blended with per-cell wear (`span`,
     `blend` knobs), i.e. latent history as a **field**. This is simpler
     than the points-based `ruinSites` sketch: fate-as-field feeds ordinary
     thresholds and masks, so the narrative phase gets cheaper.
2. **Agents are now players, and the tag channel is literally readable.**
   Marker points render into agent observations as glyph + tag in the
   legend (`observation.ts` → `collectLegend(legend, marker.glyph,
   marker.tag, …)`), so `key:2` or `landmark` is text an LLM character
   agent is sent. Creatures are the opposite — browser-only, invisible to
   the API and both agent views — so **a preset's payoff must be carried by
   tiles, prefabs, and tagged markers**; creatures are human-view garnish,
   never the load-bearing challenge.
3. **Node metadata is now functional, not documentation.** God agents build
   pipelines by reading `GET /api/v1/node-types`, rendered straight from
   `registerNodeType` metadata, and `editActions` failure hints are how
   they self-correct. `description`/`whenToUse`/`help` on the new nodes are
   part of the agent-facing API surface and should be written as such.
4. **Quest state got more expensive, which vindicates deferring it.** The
   parity rule means anything affecting movement must exist identically in
   the browser and the dev-server world. Creatures dodge this by being
   excluded from both agent paths, but an openable door blocks walking —
   it cannot be excluded. Key-pickup/door state therefore has to be a
   shared module used by both `serverWorld` and the browser walkability
   probe. The walkable-gate v0 of the puzzle preset stands as the right
   first ship; blocking gates wait for that shared layer.

Unchanged: the phasing order, the region-keyed-rng idiom, tags as the
semantics channel (now strengthened), and `checkProcgenInvariants.ts` as
the home for solvability — it now exists on main with maze determinism
checks to build on.
