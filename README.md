# procgen

A playground for procedurally generated worlds. React + TypeScript + Tailwind +
Vite + three.js, no server. The world is infinite, chunked, and fully determined by a
seed — walk in any direction forever and the same seed always gives the same
world.

Three panels:

1. **Tile editor** — create/edit tile types (name, ascii symbol, color,
   walkable), plus optional pixel art per cube face painted in an inline
   editor: top/bottom plus either linked sides or each of N/E/S/W separately,
   draw/erase/flood-fill/color-pick tools with mirror-X/Y, undo, and
   copy/paste between faces, tiling helpers (live 3×3 seam preview and
   wrap-around shift), and a selectable resolution (4×4 to 32×32, art is
   rescaled on change). Persisted to localStorage; older top/sides/bottom
   art is migrated automatically.
2. **Procgen panel** — a layered pipeline of generator nodes. Each node
   produces a typed value per chunk (`field`, `tiles`, or `points`), wires its
   inputs to nodes above it, and can be mapped into the world via a display
   binding (tile layer / elevation / markers). Starts blank — build worlds up
   from zero, load an example pipeline, or write a `custom script` node in the
   browser. See `docs/authoring-nodes.md` for writing node types.
3. **World view** — toggle between ASCII (one colored glyph per tile, `@` is
   you — doubles as an LLM-agent observation format) and a 2.5D three.js view
   that streams chunk meshes around the player. WASD/arrows to walk, Q/E to
   rotate the 2.5D camera, wheel to zoom.

## Layout

`src/panels` mirrors what you see on screen: one folder per column panel, one
folder per section inside it, and each section's non-React code sits beside the
component that uses it. Everything under `src/panels` is app-specific; the
folders outside it are the shared core the panels are built on.

```
src/panels        one folder per column panel, sections nested inside:
  tiles/            TileEditorPanel — the tile list
    tileRow/          one row per tile: symbol, color, walkability
      symbolPicker/     glyph search popup
      pixelArtEditor/   cube-face art painting (ops/ = pure pixel edits)
  procgen/          ProcgenPanel — the pipeline editor
    worldSeed/        world seed row
    presets/          examples dropdown + the example pipelines it loads
    randomize/        randomize/permute buttons + the pipeline generators
                      they run (recipes/ = whole-world recipes)
    nodeList/         drag-ordered node list
      nodeCard/         one card per node: header, comment, error
        params/           knob/tile/code param rows
        wiring/           input (←) dropdowns + wire highlighting
        display/          display binding editor (tiles/elevation/markers)
    addNode/          add-node menu
  world/            WorldPanel — the world viewport
    toolbar/          ASCII / 2.5D view-mode buttons
    stage/            canvas slots + view mounting/teardown
    ascii/            canvas glyph view + pure-text snapshot
    view3d/           three.js chunk-mesh streamer, camera, face-art materials
    camera/           shared pan offset, zoom scale, drag/wheel listeners
    movement/         key tracking and camera-relative step math
src/app           React shell: app runtime (core objects + world-change wiring),
                  runtime context, re-render hooks, resizable panel layout
src/ui            cross-panel React pieces: shared controls, floating tooltips
src/random        seeded streams (hash, mulberry32, per-label streams)
src/noise         value, gradient and fractal noise built on the lattice hash
src/procgen       the node framework:
  chunk.ts          chunk math (32×32 cells)
  values/           typed per-chunk values: field, tiles, points
  nodeType.ts       node type declaration API + ctx interface
  nodeRegistry.ts   registerNodeType + lookup
  pipeline/         node instances, wiring rules, signatures, persistence
  eval/             lazy per-chunk evaluator + LRU cache + deterministic ctx
  display/          display bindings (tile layer / elevation / markers)
  worldSampler.ts   composes displayed nodes into tileAt/elevationAt/markersIn
  nodes/            node types: examples/ primitives, terrain/ (plates, ridged
                    noise, warp, curves), hydrology/ (drainage, erosion,
                    rivers), coast/, maze/, rivers/ + the custom script node
src/world         Tileset, tile art, walkability, infinite-world player state
src/persistence   repo-file + localStorage backed JSON stores
src/styles        index.css — the only stylesheet: Tailwind plus the @theme
                  color tokens. All other styling is utility classes.
scripts           headless checks over the DOM-free core (`npm run check`)
```

## Run

```
npm ci --ignore-scripts
npm run dev
```

Dev server: http://localhost:1111. Node >= 22. Dependencies are exact-pinned;
`--ignore-scripts` is deliberate (npm supply-chain hygiene) and everything
works without lifecycle scripts.
