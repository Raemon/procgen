# data

Committed save files for the app, written by the dev server.

- `pipeline.json` — the procgen node pipeline shown in the panel.
- `tileset.json` — the tile definitions from the tile editor, including pixel face art.

While `npm run dev` is running, every edit in the app is saved here (via the
`/persist/*` middleware in `vite.config.ts`); commit these files to keep your
world. On the first run after this directory is empty, any state you had in
localStorage is migrated into it automatically. Static deploys have no write
endpoint, so the deployed site falls back to localStorage as before.
