# Authoring procgen nodes

Everything in the world is produced by a **pipeline** of nodes shown in the
procgen panel. Each node is an instance of a **node type**. This guide is how
to write your own node types.

## The model in one paragraph

The world is an infinite grid of cells, split into 32×32 **chunks**. A node
type implements one function, `generateChunk(ctx)`, which produces that node's
value for a single chunk — a `field` (one float per cell), `tiles` (one tile id
per cell, `-1` = empty), or `points` (a list of tagged positions). Nodes are
listed top to bottom in the panel; a node's inputs wire to nodes **above** it,
so the pipeline is always an acyclic dataflow. Everything must be a pure
function of `(world seed, node, chunk coordinates, inputs)` — never of time,
`Math.random`, or which chunks happened to be generated first. That is what
makes the world infinite, stable, and scrubbable.

## The knob typology

Every node type is built from exactly three kinds of field. This is the
contract that keeps vibecoded nodes uniform, serializable, and tunable from
the panel:

1. **Numeric knobs** — every param value is a number. Continuous quantities
   use `number`, counts and sizes use `int`, named alternatives use `choice`
   (a dropdown whose stored value is a small integer), on/off uses `toggle`
   (a checkbox stored as 0/1).
2. **Tile links** — params of kind `tile` hold a tile id from the tileset
   (`-1` = empty). Anything about appearance/material should be a tile link,
   never a color or name string.
3. **Node links** — `inputs` wire to upstream nodes by value kind. Anything
   spatial a node consumes (a heightfield, a mask, another layer) comes in as
   an input, never as a param.

There are **no free-text, boolean, or string-enum params** on normal nodes.
`registerNodeType` throws at registration if a param is not one of the knob
kinds, the `StandardNodeTypeDef` type rejects it at compile time, and
`npm run check` fails if any node type other than `custom script` breaks the
rule. The `custom script` node is the single escape hatch (it needs a `code`
param and a `select` for its output kind) and registers through
`registerScriptNodeType`.

Consequences worth knowing when writing a node:

- Sizes are numbers, not presets. The labyrinth exposes `corridor width` /
  `wall thickness` / `chunks per maze` instead of named lattice styles;
  follow that pattern rather than baking size tables into a `choice`.
- A `choice` is for genuinely discrete *behaviors* (which carving algorithm),
  not for anything a slider could express.
- Points don't take a tag param: generic scatterers tag points with
  `ctx.nodeId`, special-purpose nodes hardcode a semantic tag (`'town'`).

## Two ways to build a node

1. **A TypeScript file** (real nodes): add a file under `src/procgen/nodes/`,
   call `registerNodeType(...)`, and add one import line to
   `src/procgen/nodes/index.ts`. The panel picks it up automatically —
   parameters, wiring dropdowns, and display controls are all derived from the
   declaration.
2. **The `custom script` node** (in-browser experiments): add a
   *custom script* node in the panel and write the body of
   `generateChunk(ctx)` directly in its code box (`ctx` is in scope; `return`
   your result). Press *apply code* or Ctrl+Enter. Errors show up on the node
   card. When a script stabilizes, promote it to a TypeScript node.

## A complete node type

```ts
import { registerNodeType } from '../nodeRegistry';
import { fieldValue } from '../values/chunkValues';

registerNodeType({
  type: 'myNode',            // unique id, stored in saved pipelines
  title: 'my node',          // shown in the panel
  category: 'terrain',       // grouping in the add-node menu (any string)
  description: 'What it does — first line of the add-menu tooltip.',
  whenToUse: 'When/why to reach for it — the tooltip\'s "when to use" line.',
  inputs: {
    source: { kind: 'field', label: 'source', help: 'Tooltip for the wiring row.' },
    mask: { kind: 'field', label: 'mask', help: 'Optional inputs say what unwired means.', optional: true },
  },
  params: {
    strength: { kind: 'number', label: 'strength', help: 'Tooltip for the param row.', min: 0, max: 1, step: 0.01, default: 0.5 },
  },
  output: 'field',
  generateChunk(ctx) {
    const out = ctx.newField();
    const source = ctx.fieldInput('source');
    if (!source) return fieldValue(out);
    for (let i = 0; i < out.length; i++) out[i] = source[i] * (ctx.params.strength as number);
    return fieldValue(out);
  },
});
```

## Value kinds

| kind     | per chunk                        | helpers                        | displays as |
|----------|----------------------------------|--------------------------------|-------------|
| `field`  | `Float32Array(1024)`, row-major  | `ctx.newField()`, `fieldValue` | elevation   |
| `tiles`  | `Int32Array(1024)`, `-1` empty   | `ctx.newTiles()`, `tilesValue` | tile layer  |
| `points` | `{x, y, tag}[]` (world coords)   | `pointsValue`                  | markers     |

Cell `(x, y)` inside a chunk lives at index `y * ctx.size + x`. World
coordinates are `ctx.originX + x, ctx.originY + y`. Keep generated points
inside the chunk's own bounds so they aren't produced twice by neighboring
chunks.

`output` may also be a function of params — the custom script node uses
`output: (params) => params.outputKind` — for node types whose kind is chosen
in the panel.

## The ctx you generate with

- `ctx.chunkX/chunkY` — chunk coordinates; `ctx.originX/originY` — world
  coordinates of the chunk's top-left cell; `ctx.size` — 32.
- `ctx.params` — current parameter values.
- `ctx.input(name)` / `ctx.fieldInput(name)` / `ctx.tilesInput(name)` /
  `ctx.pointsInput(name)` — the wired upstream node's value for **this**
  chunk (`null` when unwired). **Never mutate inputs** — they are shared
  cached buffers.
- `ctx.inputAt(name, chunkX, chunkY)` — an upstream value for **any** chunk.
  This is how algorithms that need context beyond the chunk edge (rivers,
  region labeling, wall continuity) read a halo of neighboring input chunks
  while staying deterministic. `worldFieldReader(ctx, name)` /
  `worldTileReader(ctx, name)` in `values/worldInputReaders.ts` wrap it as
  world-coordinate lookups — see the river nodes for the pattern.
- `gatherFieldWindow(ctx, name, radius)` in `values/fieldWindow.ts` — the same
  halo, copied once into a flat `Float32Array` covering the chunk plus `radius`
  tiles on every side. Use it instead of per-cell `inputAt` whenever an
  algorithm sweeps the halo (flood fill, distance transform, flow routing):
  it reads each upstream chunk once instead of once per cell.
  `gatherFieldWindowRect(ctx, name, originX, originY, width, height)` gathers
  an arbitrary rect instead — gather only the cells the algorithm will
  actually read (see `domainWarpNode.ts`, which bounds the rect by the real
  offsets instead of the worst-case strength).
- `ctx.memo(key, compute)` — a cache shared by every chunk of this node
  instance, invalidated whenever the node's params, inputs, or seed change.
  `compute` must be a pure function of `(key, params, inputs, seed)` — never
  of the calling chunk — so any chunk may fill it and every chunk reads the
  same value. This is how windowed nodes share one expensive whole-array
  computation across a region of chunks instead of redoing it per chunk
  (see `flowAccumulationNode.ts` and `coastDistanceNode.ts`).
- `ctx.rng(label)` — a seeded random stream unique to (seed, node, chunk,
  label). Use for anything "random"; same seed ⇒ same world.
- `ctx.rngAt(gridX, gridY, label)` — like `ctx.rng` but keyed to coordinates
  you choose instead of the current chunk. This is how structures larger than
  a chunk stay coherent: every chunk of a maze region calls
  `ctx.rngAt(regionX, regionY, 'carve')` and gets the same stream, so they
  all agree on the same maze (see `mazeChunkNode.ts`).
- `ctx.nodeId` — this node instance's id; generic points nodes use it as the
  point tag.
- `ctx.hash01(worldX, worldY, label)` — deterministic per-cell value in
  [0, 1), independent of chunk boundaries. Use for scatter-style decisions so
  results don't change when the same cell is viewed from another chunk.
- `ctx.hashSeed(label)` — a stable integer seed for noise functions.

## Windowed nodes

Some questions cannot be answered inside one chunk: *how much water flows
through this cell*, *how far is this cell from the coast*, *is this hollow
closed*. Those nodes gather a window around the chunk and run a normal
whole-array algorithm on it — priority flood in `fillDepressions`, a chamfer
distance transform in `coastDistance`, a sorted downhill sweep in
`flowAccumulation`.

`flowAccumulation` and `coastDistance` share one window per aligned 4×4-chunk
region through `ctx.memo`: the first chunk of a region runs the whole-array
algorithm on a window covering the region plus the radius, and the other 15
chunks slice their cells out of the cached result. That makes the window
~5-15× cheaper at streaming scale and keeps the answer seam-free inside each
region. Prefer this pattern for any new windowed node.

Two rules keep that honest:

- **The window is a pure function of the chunk.** Every chunk computes its own
  window from its own coordinates (for region-shared windows, from its
  region's coordinates), so the result is still deterministic and
  order-independent, which is what `npm run check` verifies.
- **The window radius is a knob, and it is the cost knob.** The answer is only
  correct out to the radius: a catchment wider than the window is truncated at
  the window edge, and stacking windowed nodes multiplies how many upstream
  chunks a single output chunk needs. Say so in the param's `help`, keep the
  default modest, and prefer reading the *pre-erosion* field when a downstream
  node does not really need the eroded one — it cuts a whole branch out of the
  demand cascade.

## Determinism rules

- No `Math.random`, no `Date`, no module-level mutable state.
- Derive every random decision from `ctx.rng`, `ctx.hash01`, or
  `ctx.hashSeed`.
- A chunk's output may depend only on params + inputs (any chunk of them) +
  the seed. The engine caches per `(node content, chunk)` and re-runs nodes
  in any order; `npm run check` fails if chunk evaluation order changes the
  result.

## Param spec kinds

Knob kinds — the only kinds `registerNodeType` accepts:

| kind      | value        | UI               |
|-----------|--------------|------------------|
| `number`  | number       | slider (`min`, `max`, `step`, `default`) |
| `int`     | number       | slider, step 1   |
| `choice`  | number       | dropdown; `options` is a list of `{ value, label, help }` |
| `toggle`  | number (0/1) | checkbox         |
| `tile`    | tile id      | dropdown of the tileset (+ empty = -1) |

Script-only kinds, allowed solely on the `custom script` node via
`registerScriptNodeType`:

| kind      | value    | UI               |
|-----------|----------|------------------|
| `select`  | string   | dropdown (`options`, `optionHelp`, `default`) |
| `code`    | string   | code editor with apply button |

Every param and input spec carries a required `help` string, every `choice`
option a `help` of its own, and every `select` an `optionHelp` record — the
panel renders these as hover tooltips, and `npm run check` fails on empty
ones. Nodes placed
in the panel also have a free-form per-instance `comment` field (the italic
notes row on the card) for recording why that node is set up the way it is;
it is saved with the pipeline and never affects generation or caching.

## Display bindings

Display is how a node's value maps into the ASCII and 2.5D views; it never
affects dataflow. Each node card has a display selector:

- `tiles` → **tile layer**: layers paint in list order, later non-empty cells
  win. Use `-1` to let lower layers show through.
- `tiles` → **ceiling**: the same layering, hung a chosen number of tiles above
  the ground instead of painted on it. Ceilings are drawn in first person only,
  so the god camera can still see into a roofed world — see
  `docs/light-and-darkness.md`.
- `field` → **elevation**: shapes the 2.5D ground height (× height scale);
  the last enabled elevation node wins.
- `points` → **markers**: drawn as a glyph in ASCII and a small cone in 2.5D,
  with per-node glyph and color.
- anything → **hidden**: intermediate values you only wire onward.

## Testing without a browser

`npm run check` bundles `scripts/checkProcgenInvariants.ts` and runs it in
Node — no DOM. It asserts determinism, chunk-order independence, signature
invalidation, layering, custom-script behavior, and serialization. Add checks
for your own nodes there; `asciiSnapshot(...)` gives you a pure-text render of
any sampler for assertions or LLM-agent observation.

## World settings

Two numbers on `PipelineState` belong to the world rather than to any node,
because nothing spatial produces them: `seed`, and `daylight` (0-1, how much
light the sky gives — see `docs/light-and-darkness.md`). Add another only when
it genuinely cannot be a node's knob; a node is the default answer.

## Adding a new value kind

If a generator needs a shape that fields/tiles/points can't express (e.g.
polyline paths or region graphs):

1. Add the representation to `src/procgen/values/chunkValues.ts`
   (union member + constructor + empty value) and an accessor in
   `valueAccess.ts`.
2. Decide how it renders: extend `displayBinding.ts` with a mode, teach
   `worldSampler.ts` to expose it, and draw it in
   `views/ascii/asciiCells.ts` and `views/view3d/worldMeshes.ts`.
3. The pipeline, wiring, caching, and panel need no changes — they treat
   kinds as opaque strings.

## Folders and templates

Two panel-level ideas sit above node types, and neither one can change what is
generated:

- **Folders** are visual only. `NodeInstance.folder` is a free string; adjacent
  nodes sharing one fold into a single collapsible band. `computeNodeSignatures`
  never reads it, so renaming a folder cannot invalidate a cache or move a tile
  — `npm run check` asserts exactly that. Folders are authoring metadata, like
  `comment`.
- **Templates** are saved subgraphs: `{ name, description, nodes }` in
  `src/procgen/templates/`. Stamping one clones its nodes with fresh ids, remaps
  the wiring *inside* the template, and leaves wiring that pointed outside it
  unwired for you to connect. The stamped nodes land in a folder named after the
  template. Built-ins live in `builtInTemplates.ts`; user templates are saved
  from a folder in the panel into `data/templates.json`.

Templates are where geologic names belong. A node type should be named for the
operation it performs; the recognisable landform is the *assembly*, so ship it
as a template — "tectonic plates" is a template over uplift, noise and warp
nodes, not a node called Andes.

## Example pipelines

`src/procgen/presets/examplePipelines.ts` holds the presets in the panel's
*examples* dropdown. They are plain serialized pipelines built only from the
example nodes — read them to see how primitives compose into something bigger,
and add your own the same way. Each example has a `description` (shown in the
dropdown's tooltip) and a `comment` on every node explaining why it is built
that way; `npm run check` requires both.
