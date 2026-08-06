# View modes and the agent API

The world panel has exactly four view modes, and two of them are windows onto
the agent API rather than renderings of the world:

| mode | what it draws | movement |
| --- | --- | --- |
| 3-D God | Three.js follow camera, free pan/zoom, Q/E rotates the camera in quarter turns | WASD camera-relative |
| Agent God | the literal text a god-mode API agent receives for the player's position | WASD compass |
| 2.5D Character | Three.js camera locked behind the player's facing, Q/E turns the player in 45° steps | W/S forward/back, A/D strafe |
| Agent Character | the literal text a character-mode API agent receives for the player's pose | same as 2.5D Character |

## Parity rule

`src/agent/observation.ts` builds one observation object; `observationText.ts`
renders it to text. The UI agent views and the HTTP API both call those same
two functions, so what a human reads in an agent mode is byte-identical to what
an LLM is sent. Never render agent-mode information through any other path.

## The blank back

Character-mode observations only draw tiles in the front half-plane of the
agent's facing (`isInFrontHalfPlane` in `src/world/facing.ts`); everything
behind is the blank glyph, and the observation deliberately never states the
facing — the rotating blank half is the only way an agent knows which way it
points. God mode sees the full window and is told its facing. `npm run check`
enforces both.

## The API

`GET /api/v1/docs` is the reference, and it is rendered from the same tables
the server dispatches on (`src/agent/controls.ts`, `failures.ts`, the live
tileset), so it cannot drift: an unfilled placeholder throws, and
`npm run check` asserts every verb, failure code and tileset symbol appears.
Add a verb to the table — never to the docs prose.

The server side is a vite dev-server plugin (`vite.config.ts` → `agentApi()`)
that `ssrLoadModule`s `src/agent/api/nodeEntry.ts`, so the exact TypeScript the
browser runs also evaluates the pipeline in Node against `data/pipeline.json` +
`data/tileset.json` (re-read when their mtimes change). Agents are in-memory
sessions; they do not survive a server restart. There is no auth: this is a
local dev tool.

Autopilot (`src/agent/api/autopilot.ts`) drives an agent with the Anthropic
API — key from the run request or `ANTHROPIC_API_KEY` — one `act` tool call per
step, transcript readable at `.../transcript` and streamed into the agent log
panel. God-mode runs also get `inspect_pipeline` and `inspect_node_types`
tools.

## God agents build the world

God mode's verb table has a second group: editing verbs (`add_node`,
`set_param`, `wire_input`, `set_display`, `move_node`, `set_seed`, …) that
manipulate the same procgen node pipeline the human edits in the panel — the
whole app is LLM-first. `GET /api/v1/pipeline` lists every node;
`GET /api/v1/node-types` renders the registry (descriptions, param ranges,
choices, input kinds) straight from `registerNodeType` metadata. Validation
lives in `src/agent/editActions.ts` and every failure hint names the real
options so an agent can self-correct. Character agents own no editing verbs.

A successful edit persists to `data/pipeline.json`, rebuilds the server world
(so the next observation shows the new terrain), and pushes an
`agent-pipeline-changed` event over the vite websocket — the browser reloads
the pipeline into its store live, so you can watch an agent terraform in any
view mode. Concurrent human + agent edits are last-writer-wins; there is no
merge.

## Known asymmetry

The human player's pose lives in the browser; API agents live in the dev
server. Both walk the same generated world (same data files, same sampler),
but they do not see each other. Making agents visible in the human views (and
vice versa) would mean syncing the player pose to the server — deliberately
not done yet.
