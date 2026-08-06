# procgen

A playground for procedurally generated worlds. Vanilla TypeScript + Vite +
three.js, no server.

Three panels:

1. **Tile editor** — create/edit tile types (name, ascii symbol, color,
   walkable), plus optional 8×8 pixel art per cube face (top/sides/bottom)
   painted in an inline editor. Persisted to localStorage.
2. **Generation panel** — knobs feeding a pass pipeline (seeded noise →
   terrain thresholds → cellular-automata smoothing → tree scatter).
3. **World view** — toggle between ASCII (one colored glyph per tile, `@` is
   you — doubles as an LLM-agent observation format) and a 2.5D three.js view.
   WASD/arrows to walk, Q/E to rotate the 2.5D camera, wheel to zoom.
   Regenerate button re-rolls the world.

## Layout

```
src/random      seeded streams (hash, mulberry32, per-label streams)
src/noise       value + fractal noise built on the lattice hash
src/gen         GenParams, the pass pipeline, and one file per pass
src/world       Grid, Tileset, walkability, spawn, player state + events
src/views       ascii (canvas + pure-text form) and view3d (camera, meshes)
src/input       key tracking and camera-relative step math
src/ui          panels: tile editor, generation knobs, layout, view toggle
src/styles      one stylesheet per panel, combined by index.css
scripts         headless checks over the DOM-free core (`npm run check`)
```

## Run

```
npm ci --ignore-scripts
npm run dev
```

Dev server: http://localhost:5174. Node >= 22. Dependencies are exact-pinned;
`--ignore-scripts` is deliberate (npm supply-chain hygiene) and everything
works without lifecycle scripts.
