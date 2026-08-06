# View modes and the agent API

The world panel has exactly four view modes, and two of them are windows onto
the agent API rather than renderings of the world:

| mode | what it draws | movement |
| --- | --- | --- |
| 3-D God | Three.js follow camera, free pan/zoom, Q/E rotates the camera in quarter turns | WASD camera-relative |
| Agent God | the literal text a god-mode API agent receives for the player's position | WASD compass |
| 2.5D Character | first-person Three.js camera at the player's eye, fogged out at the sight radius, Q/E turns the player in 45° steps | W/S forward/back, A/D strafe |
| Agent Character | the literal text a character-mode API agent receives for the player's pose | same as 2.5D Character |

## Parity rule

`src/agent/observation.ts` builds one observation object; `observationText.ts`
renders it to text. The UI agent views and the HTTP API both call those same
two functions, so what a human reads in an agent mode is byte-identical to what
an LLM is sent. Never render agent-mode information through any other path.

## The blank back and the fog

A character sees the half-disc in front of it, and nothing else. Both halves of
that rule live in `src/world/vision/characterSight.ts`, which is the single
place either view learns how far a character can see:

- the front half-plane of the facing (`isInFrontHalfPlane` in
  `src/world/facing.ts`) — everything behind is the blank glyph, and the
  observation deliberately never states the facing, so the rotating blank half
  is the only way an agent knows which way it points;
- `CHARACTER_SIGHT_RADIUS_TILES` — beyond it the tile is blank too, which is
  why a character grid has blank corners. The agent grid is sized
  `2 * radius + 1` from the same constant, so it is exactly wide enough to hold
  what can be seen and no wider.

God mode sees its full window and is told its facing.

The 2.5D character view is **first person** for the same reason. Its camera
stands in the player's own tile at eye height and looks along the facing, so a
third-person camera can no longer pull back far enough to show ground the agent
is told is behind it, and the player mesh is hidden while that camera is live.
Because the eye is the player, three.js fog — which measures from the camera —
measures from the player too: `createCharacterFog` is just the two constants,
`CHARACTER_HAZE_START_TILES` to `CHARACTER_SIGHT_RADIUS_TILES`, with no
distance correction to get wrong. The camera's far plane is the sight radius as
well, so geometry is culled exactly where it would have been painted pure fog,
and the chunk streamer is asked for the sight radius rather than anything
derived from zoom, which is why character mode streams a couple of chunks
instead of the dozens the old third-person camera asked for. The wheel narrows
the field of view instead of pulling the camera back; that changes how much of
the half-disc is on screen at once and never how far the player can see.

What still differs: the human's field of view is narrower than the agent's flat
180°, and in first person terrain and prefabs occlude, so the human sometimes
sees *less* than the grid shows. Never more.

Changing what a character can see therefore means changing one constant.
`npm run check` asserts the grid size, the fog distances, the camera's far
plane, the eye's position and facing, and the blanked tiles all still agree
with it.

## The API

`GET /api/v1/docs` is the reference, and it is rendered from the registries the
app itself runs on (`src/abilities/`, `failures.ts`, the live tileset and node
registry), so it cannot drift: an unfilled placeholder throws, and
`npm run check` asserts every ability, its example, its human control, every
failure code, node type and tileset symbol appears. Add an ability to the
registry — never prose to the docs.

The server side is the game server (`server/`, which mounts
`src/agent/api/nodeEntry.ts` at `/api/v1`; the Vite dev server proxies to it),
so the exact TypeScript the browser runs also evaluates the pipeline in Node
against the `data/*.json` files (re-read when their mtimes change), and writes
every library back there after an edit. Agents are in-memory sessions; they do
not survive a server restart, and the bot API itself has no auth.

Autopilot (`src/agent/api/autopilot.ts`) drives an agent with the Anthropic
API — key from the run request or `ANTHROPIC_API_KEY` — one `act` tool call per
step, transcript readable at `.../transcript` and streamed into the agent log
panel. God-mode runs also get `inspect_pipeline` and `inspect_node_types`
tools.

## God agents build the world

Every ability in the app is an agent action — see
[`abilities.md`](abilities.md) for the registry and the rules that keep it that
way. God mode owns all of them beyond movement: nodes and wiring, knobs,
displays, the seed, the tile/prefab/creature libraries, templates, presets,
world rolls and region capture. `GET /api/v1/pipeline`, `/node-types`,
`/tiles`, `/prefabs`, `/creatures`, `/templates` and `/presets` are the reads
that make those actions usable, all rendered from the same registries the app
runs on. Every failure hint names the real options so an agent can self-correct
from the response alone. Character agents own nothing but movement.

A successful edit persists to `data/`, rebuilds the server world
(so the next observation shows the new terrain), and broadcasts `docChanged`
over the multiplayer WebSocket — every connected browser reloads the pipeline
into its store live, so you can watch an agent terraform in any view mode.
Concurrent human + agent edits are last-writer-wins; there is no merge.

## Known asymmetry

Prefab stamps are part of the generated terrain, so the server loads
`data/prefabs.json` and agents see them like any tile. Creatures are not:
their simulation (`CreatureClock`/`CreatureSim`) runs only in the browser, so
neither the API nor the UI agent views show creature positions — the parity
rule (UI agent text ≡ API payload) is kept by leaving them out of both. Giving
agents creatures means simulating server-side, which is future work.

Human players and API agents now share the game server's world: player poses
sync over the multiplayer WebSocket, and agent sessions ride the same snapshot
feed, so agents appear as capsules in the 3-D views alongside other players
(see `docs/multiplayer.md`). Agent *observations* still come from the sampler
only — an agent is not told about players or other agents standing nearby.
