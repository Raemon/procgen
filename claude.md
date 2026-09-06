This is an engine and editor for rapidly prototyping procedural worlds whose generation remains legible to the people using it.

The product goal is to generate worlds worth exploring, with distinct histories and adventure hooks. Current models need strong, composable building blocks rather than being asked to one-shot a whole world or puzzle.

RULES

Keep the source tree aligned with the rendered home-page tree:

- `src/app` contains only Next.js pages, layouts, and `route.ts` adapters.
- `src/features/app-shell` owns shared controls, layout, tooltips, client state, persistence, and composition.
- `src/features/asset-library` owns editable definitions. Detail is its React child and folder. World seeds, saved worlds, and node groups are editable library assets.
- `src/features/agents` owns Agents. Agent Log is its React child and folder.
- `src/features/game` owns the running world: input, inventory, lighting, simulation, rendering, capture, puzzles, performance, and multiplayer. Worlds is its React child and folder.
- `src/infrastructure` owns database, process startup, HTTP adapters, and WebSocket attachment.
- `src/worlds/<name>` owns one world, and every world has the same shape. `index.ts` only registers: the node types under `node/`, the overlay from `rules/` through `registerWorldRules`, the shipped seed under `node/` through `registerExampleWorldSeed`, and any feature extractor. `node/` holds node types, knob specs, the seed and serialization. `rules/` holds the overlay: `overlay.ts` exports `<name>Rules(context)` and `describe<Name>State`, with `markers.ts`, `circuits.ts` and `snapshot.ts` beside it. `art/` holds the functions returning a `FixtureLook` for every marker the world draws. `generate/` holds how the world is laid out and furnished, with `generate/layout/` as the maze-shape contract, and `play/` holds runtime interaction helpers. `__tests__/` holds the world's tests, each exporting a `check` function registered in `src/features/app-shell/__tests__/app.test.ts`. A world registers itself through `src/worlds/client.ts` and `src/worlds/server.ts`, never imports another world, and reaches the engine through named seams: `src/features/game/worldRules.ts`, `src/features/game/sharedSnapshot.ts`, `src/features/game/sharedRevision.ts`, `src/features/game/circuits/circuit.ts`, `src/features/game/fixtures/fixtureAppearance.ts`, `src/features/asset-library/worlds/seeds/examplePipelines.ts`, `src/features/asset-library/worlds/features/featureExtractorRegistry.ts`, and `src/features/game/__tests__/rulesFixtures.ts` in tests. The engine reaches into `src/worlds` only from `src/features/asset-library/worlds/nodes/index.ts` and `src/infrastructure/server/procgenServices.ts`.
- The engine owns the cue, sound and animation vocabularies; a world contributes state through `markersIn`, `circuitsIn`, `cratesIn` and `items`. A new mechanic is one cue in `src/features/game/circuits/puzzleCues.ts`, one file under `src/features/game/sound/cues/` listed in `src/features/game/sound/soundCues.ts`, and one file under `src/features/game/render/view3d/animations/` listed in `src/features/game/render/view3d/animations/puzzleAnimations.ts`.

Do not add generic `components`, `lib`, `assets`, `abilities`, `commands`, `common`, or `misc` feature roots. Put a product operation beside the UI or runtime concept that owns it. Direct cross-feature imports must name that owning feature explicitly; do not hide dependencies behind catch-all barrels.

All server mutations cross the canonical API. Persistent Asset Library changes use Route Handlers under `/api/v1/asset-library`. Live Game input uses `/api/v1/game/socket`. Agents and humans share the same contracts exposed at GET `/api/v1/openapi.json`, written out for an LLM as plain text at GET `/docs`. Add an HTTP contract before adding a Route Handler, and do not add compatibility aliases for removed URLs.

Use ETags for persistent edits. Send `If-Match`, return `412` for stale writes, refetch, and reconcile. Keep resource functions private to their owning feature; use named POST commands only for procedural work such as randomize, undo, stamp, capture, run, move, turn, interact, and reset.

Do not write explanatory comments or extra docs. Prefer names and small files that make responsibility obvious. Split a function when it crosses more than one reason to change.

Put tests beside their feature under `__tests__` with `*.test.ts` or `*.test.tsx` names. Run `npm test`, `npm run typecheck`, and `npm run build` before handing work back.

When adding or changing procgen node types, preserve determinism, add coverage under `src/features/asset-library/worlds/__tests__`, and register it in `src/features/app-shell/__tests__/app.test.ts`.

A world seed is the recipe — a named pipeline of nodes with a seed number — and lives under `worlds/seeds`. A world is what a seed grows plus what the player has done in it; a saved world is that kept, and lives under `worlds/saved`. Name things for which of the two they are: the sampler, renderers, coordinates and the game `World` are worlds, the library rows and the lab's candidates are world seeds.

Every world is a pipeline. What a world can do beyond walking is a rules overlay registered per node type with `registerWorldRules` in `src/features/game/worldRules.ts`; the engine composes the running pipeline's overlays in `src/features/game/worldRulesSet.ts` and asks them about steps, jumps, fixtures, markers, and shared state. Shared state has no owner: every player and agent works the same crates and doors, and what one overlay keeps per player lives in that actor's `mine` slot.

Node fields are numeric knobs, tile links, or node links. Do not add text, booleans, or string-enum parameters; sizes are numeric knobs. `registerNodeType` enforces this at compile time and runtime. `registerScriptNodeType` is the sole escape hatch.

Prefer scripts and API probes for behavior verification. Finish UI changes with one rendered browser check after the scripted checks pass.

Whenever you report back to a user, end with a direct link to the running server.

Production at https://procgen.onrender.com auto-deploys from `origin/main` and takes about three minutes to build; a merge is not live until `GET /api/health` reports the merged commit. Run `npm run deploy:wait` after merging before telling anyone the change is in production.
