This is an engine and editor for rapidly prototyping procedural worlds whose generation remains legible to the people using it.

The product goal is to generate worlds worth exploring, with distinct histories and adventure hooks. Current models need strong, composable building blocks rather than being asked to one-shot a whole world or puzzle.

RULES

Keep the source tree aligned with the rendered home-page tree:

- `src/app` contains only Next.js pages, layouts, and `route.ts` adapters.
- `src/features/app-shell` owns shared controls, layout, tooltips, client state, persistence, and composition.
- `src/features/asset-library` owns editable definitions. Detail is its React child and folder. Worlds and node groups are editable library assets.
- `src/features/agents` owns Agents. Agent Log is its React child and folder.
- `src/features/game` owns the running world: input, inventory, lighting, simulation, rendering, capture, puzzles, performance, and multiplayer.
- `src/infrastructure` owns database, process startup, HTTP adapters, and WebSocket attachment.

Do not add generic `components`, `lib`, `assets`, `abilities`, `commands`, `common`, or `misc` feature roots. Put a product operation beside the UI or runtime concept that owns it. Direct cross-feature imports must name that owning feature explicitly; do not hide dependencies behind catch-all barrels.

All server mutations cross the canonical API. Persistent Asset Library changes use Route Handlers under `/api/v1/asset-library`. Live Game input uses `/api/v1/game/socket`. Agents and humans share the same contracts exposed at GET `/api/v1/openapi.json`. Add an HTTP contract before adding a Route Handler, and do not add compatibility aliases for removed URLs.

Use ETags for persistent edits. Send `If-Match`, return `412` for stale writes, refetch, and reconcile. Keep resource functions private to their owning feature; use named POST commands only for procedural work such as randomize, undo, stamp, capture, run, move, turn, interact, and reset.

Do not write explanatory comments or extra docs. Prefer names and small files that make responsibility obvious. Split a function when it crosses more than one reason to change.

Put tests beside their feature under `__tests__` with `*.test.ts` or `*.test.tsx` names. Run `npm test`, `npm run typecheck`, and `npm run build` before handing work back.

When adding or changing procgen node types, preserve determinism, add coverage under `src/features/asset-library/worlds/__tests__`, and register it in `src/features/app-shell/__tests__/app.test.ts`.

Node fields are numeric knobs, tile links, or node links. Do not add text, booleans, or string-enum parameters; sizes are numeric knobs. `registerNodeType` enforces this at compile time and runtime. `registerScriptNodeType` is the sole escape hatch.

Prefer scripts and API probes for behavior verification. Finish UI changes with one rendered browser check after the scripted checks pass.

Whenever you report back to a user, end with a direct link to the running server.

Production at https://procgen.onrender.com auto-deploys from `origin/main` and takes about three minutes to build; a merge is not live until `GET /api/health` reports the merged commit. Run `npm run deploy:wait` after merging before telling anyone the change is in production.
