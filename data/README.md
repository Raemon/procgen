# data

Committed save files for the app, written by the dev server.

- `pipeline.json` — the procgen node pipeline shown in the panel.
- `tileset.json` — the tile definitions from the tile editor, including pixel face art.
  `npm run tiles:write` regenerates it from the shipped catalog in
  `src/world/tiles/defaultTiles.ts`, discarding tile edits made in the app
  (see `docs/authoring-tile-art.md`).
- `prefabs.json` — the prefab library: voxel stamps painted in the prefabs tab
  or captured out of the world view.
- `creatures.json` — the creature library: looks plus behavior knobs, and for
  characters the name of their built-in billboard art rather than its pixels.
  `npm run creatures:write` regenerates it from `src/creatures/defaultCreatures.ts`,
  discarding creature edits made in the app.

While `npm run dev` is running, every edit in the app is saved here (via the
`/persist/*` middleware in `vite.config.ts`); commit these files to keep your
world. On the first run after this directory is empty, any state you had in
localStorage is migrated into it automatically. Static deploys have no write
endpoint, so the deployed site falls back to localStorage as before.
