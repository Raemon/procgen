# procgen

A playground for procedurally generated worlds. Vanilla TypeScript + Vite +
three.js, no server.

Three panels:

1. **Tile editor** — create/edit tile types (name, ascii symbol, color,
   walkable). Persisted to localStorage.
2. **Generation panel** — knobs feeding a pass pipeline (seeded noise →
   terrain thresholds → cellular-automata smoothing → tree scatter).
3. **World view** — toggle between ASCII (one colored glyph per tile, `@` is
   you — doubles as an LLM-agent observation format) and a 2.5D three.js view.
   WASD/arrows to walk, Q/E to rotate the 2.5D camera, wheel to zoom.
   Regenerate button re-rolls the world.

## Run

```
npm ci --ignore-scripts
npm run dev
```

Dev server: http://localhost:5174. Node >= 22. Dependencies are exact-pinned;
`--ignore-scripts` is deliberate (npm supply-chain hygiene) and everything
works without lifecycle scripts.
