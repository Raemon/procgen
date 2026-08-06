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
  description: 'What it does — shown as the add-menu tooltip.',
  inputs: {
    source: { kind: 'field', label: 'source' },              // required
    mask: { kind: 'field', label: 'mask', optional: true },  // optional
  },
  params: {
    strength: { kind: 'number', label: 'strength', min: 0, max: 1, step: 0.01, default: 0.5 },
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
  while staying deterministic.
- `ctx.rng(label)` — a seeded random stream unique to (seed, node, chunk,
  label). Use for anything "random"; same seed ⇒ same world.
- `ctx.hash01(worldX, worldY, label)` — deterministic per-cell value in
  [0, 1), independent of chunk boundaries. Use for scatter-style decisions so
  results don't change when the same cell is viewed from another chunk.
- `ctx.hashSeed(label)` — a stable integer seed for noise functions.

## Determinism rules

- No `Math.random`, no `Date`, no module-level mutable state.
- Derive every random decision from `ctx.rng`, `ctx.hash01`, or
  `ctx.hashSeed`.
- A chunk's output may depend only on params + inputs (any chunk of them) +
  the seed. The engine caches per `(node content, chunk)` and re-runs nodes
  in any order; `npm run check` fails if chunk evaluation order changes the
  result.

## Param spec kinds

| kind      | value    | UI               |
|-----------|----------|------------------|
| `number`  | number   | slider (`min`, `max`, `step`, `default`) |
| `int`     | number   | slider, step 1   |
| `boolean` | boolean  | checkbox         |
| `select`  | string   | dropdown (`options`, `default`) |
| `tile`    | tile id  | dropdown of the tileset (+ empty = -1) |
| `text`    | string   | text input       |
| `code`    | string   | code editor with apply button |

## Display bindings

Display is how a node's value maps into the ASCII and 2.5D views; it never
affects dataflow. Each node card has a display selector:

- `tiles` → **tile layer**: layers paint in list order, later non-empty cells
  win. Use `-1` to let lower layers show through.
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

## Example pipelines

`src/procgen/presets/examplePipelines.ts` holds the presets in the panel's
*examples* dropdown. They are plain serialized pipelines built only from the
example nodes — read them to see how primitives compose into something bigger,
and add your own the same way.
