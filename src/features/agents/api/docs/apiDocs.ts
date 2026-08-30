import { commandsForMode } from '@/features/app-shell/runtime/commands/commandCatalog';
import type { CommandGroup, CommandMode, CommandParamSpec, CommandSpec } from '@/features/app-shell/runtime/commands/command';
import { allNodeTypes } from '@/features/asset-library/worlds/nodeRegistry';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
} from '@/features/game/vision/characterSight';
import {
  CLIMB_STEPS_PER_JUMP,
  CLIMB_STEPS_PER_WALK,
  climbStepsOf,
} from '@/features/game/climbing';
import { EYE_HEIGHT, OPAQUE_SIGHT_HEIGHT } from '@/features/asset-library/worlds/walkingSim/isovist';
import { GOD_VIEW_SIZE } from '../../observation';
import { FAILURES } from '../../failures';
import { everyRegisteredRoute } from '../everyRoute';
import { metaTools } from '../agentTools';

const CLIMB_STEPS_PER_TILE_HEIGHT = climbStepsOf(EYE_HEIGHT);
const OPAQUE_SIGHT_DIGITS = climbStepsOf(OPAQUE_SIGHT_HEIGHT);

const TEMPLATE = `# Procgen world — agent API

You are an agent in an infinite, procedurally generated world. Everything you
can know about the world arrives as an ASCII grid plus a legend; everything you
can do goes through one action at a time.

This page is the whole contract, served as plain text at GET /docs. Every URL
below is relative to this server, and every request and response is JSON.

**Every command in this application is one of the actions below.** The human
sitting at the browser has no powers you lack: their buttons, knobs and drags
call exactly the same actions with the same validation, and each action's row
names the control they would use. A human in an agent view mode reads exactly
the text you receive — nothing more.

## Two ways in

- **Autopilot** — \`POST /api/v1/agents/{id}/run\` drives the agent with an LLM
  that is handed this page, one tool per action below, and the meta tools at the
  end. Inside a run an action is a tool call, and every tool result carries a
  fresh observation.
- **By hand** — the endpoint table below is the whole HTTP surface: create an
  agent, read its observations, start and stop runs, read transcripts, and edit
  the asset library. Library documents are ETagged: send \`If-Match\` on a write,
  expect \`412\` when it is stale, refetch and reconcile.

## Getting started

1. \`POST /api/v1/agents\` with \`{"mode": "god"}\` or \`{"mode": "character"}\`.
   The answer carries the agent's id and the URLs it uses.
2. \`GET /api/v1/agents/{id}/observe\` for the grid, its legend, and your pose;
   add \`?format=text\` for the grid an agent view renders.
3. \`POST /api/v1/agents/{id}/run\` with a goal to have a model drive it, or read
   \`GET /api/v1/agents/{id}/transcript\` to watch what it did.

## Coordinate system (read this first)

- x grows EAST, y grows SOUTH. The grid is always drawn north-up; it never
  rotates.
- Every observation tells you its own top-left origin: row r, col c of the grid
  is world tile (origin_x + c, origin_y + r).
- You are the '@' at the center of the grid.

## Modes

An agent is created in one of two modes and stays in it for life.

- **god** — a {{GOD_SIZE}}x{{GOD_SIZE}} window centered on you. You see every
  generated tile in the window, and your facing is stated in the observation.
  You move by absolute compass steps, and you can REBUILD THE WORLD: the
  pipeline, asset, world seed and saved world actions below are the whole editor.
- **character** — a {{CHARACTER_SIZE}}x{{CHARACTER_SIZE}} window centered on
  you, but you only see the half-disc in front of you: tiles behind you are
  blank, and so is everything past your {{SIGHT_RADIUS}}-tile sight radius,
  which is why the corners of the grid are blank too. Ground standing twice
  your height or taller blocks the line of sight: you see the wall, never past
  it, so what lies behind stays blank until you walk around. The land itself
  blocks sight the same way once it rises: ground standing twice your height
  above the tile you stand on is a ridge — you see every tile of the climb up to its
  crest, but past the crest only ground at least as high shows, so the far
  slope and the valley beyond stay blank until you top it, and a crater rim
  walls in everything you see from inside the bowl. The blank half is how you
  know which way you face — the observation never states it. That half-disc is
  exactly the ground the 2.5D character view renders before its fog closes in,
  which is first person and shows no more of the world than you are told. You move
  relative to your facing and turn in 45-degree steps. Characters can move and
  can change how far they see.

## Reading the ground's height

When the ground in view varies in height, the observation carries an
\`elevation\` grid the same shape as the view: one digit per tile — how many
climb steps that tile stands above the lowest ground you can see, written
base-36 (0-9 then a-z, capped at z) — blank exactly where the view is blank.
The label states how high that lowest ground itself stands, so two
observations can be compared by adding their two floors back on. Flat views
omit the grid entirely, so it costs nothing where it says nothing. One digit
is exactly the tallest rise a single walking step can make, which is what
makes the digits the truth movement runs on: a step onto ground ${CLIMB_STEPS_PER_WALK} digit above
your own succeeds, a jump reaches ${CLIMB_STEPS_PER_JUMP}, anything taller refuses you, and stepping
down any drop is always allowed — so a route is walkable exactly when its
digits never rise by more than ${CLIMB_STEPS_PER_WALK} per step. You stand ${CLIMB_STEPS_PER_TILE_HEIGHT} digits tall, and ground
${OPAQUE_SIGHT_DIGITS} or more digits above your own tile is a ridge that hides lower ground
behind it.

## Sight range, and what it costs

{{SIGHT_RADIUS}} tiles is only the default. A character's sight radius is a
parameter you control, anywhere from {{MIN_SIGHT_RADIUS}} to
{{MAX_SIGHT_RADIUS}} tiles, and there are three ways to set it:

- at birth — \`POST /api/v1/agents\` with \`"sight_radius_tiles": 24\`
- for the rest of the session — the \`set_sight_radius\` action below, which the
  autopilot gets as a tool like any other
- on one read — \`GET /api/v1/agents/{id}/observe?sight_radius_tiles=24\`, which
  also becomes the agent's radius from then on

Values outside the range are clamped rather than rejected. Every observation
reports the radius in force as \`sight_radius_tiles\`, and the grid resizes with
it: the window is always \`radius * 2 + 1\` on a side, so it runs from
{{MIN_SIGHT_RADIUS}}x… up to {{MAX_CHARACTER_SIZE}}x{{MAX_CHARACTER_SIZE}}.

Seeing farther is a trade, not a free upgrade. The tiles you must read grow
with the SQUARE of the radius — doubling it quadruples the grid, and an
autopilot run pays for that grid in tokens on every single turn — and the 2.5D
view has to stream and draw everything inside the new fog distance, so the
frame rate falls off the same way. The point is that you can choose when to pay:
widen your sight where the ground ahead decides your route, get the layout, then
narrow it again and travel cheaply on what you learned.

## Endpoints

| method and path | body | query | what it does |
| --- | --- | --- | --- |
{{ENDPOINTS}}

## The asset library over HTTP

Every editable document is one URL. GET answers \`{ data, revision }\` and puts
that revision in an ETag; PUT replaces the whole document and must carry it as
\`If-Match\` — \`428\` means you sent none, \`412\` means someone edited first, so
refetch, reconcile and send again. These are the same documents the actions
above edit a piece at a time.

| method and path | what it holds |
| --- | --- |
| GET, PUT /api/v1/asset-library/world-seeds/current | the running world seed: its pipeline nodes, seed number, daylight and time |
| GET, PUT /api/v1/asset-library/world-seeds | the world seed library — every named recipe |
| GET, PUT /api/v1/asset-library/world-seeds/thumbnails | one rendered thumbnail per world seed |
| GET, PUT /api/v1/asset-library/saved-worlds | saved worlds: a frozen seed plus what the player did there |
| GET, PUT /api/v1/asset-library/tiles | the tile vocabulary a pipeline draws from |
| GET, PUT /api/v1/asset-library/items | item definitions: art, how it is drawn, how much inventory room it takes |
| GET, PUT /api/v1/asset-library/pieces | piece definitions: the structures a pipeline stamps |
| GET, PUT /api/v1/asset-library/creatures | creature and character definitions |
| GET, PUT /api/v1/asset-library/cultures | cultures: which tiles, pieces and creatures a settlement is built from |
| GET, PUT /api/v1/asset-library/node-groups | saved node groups, ready to paste into a pipeline |
| GET, PUT /api/v1/asset-library/folders | how the library rows are foldered |
| GET, PUT /api/v1/app-shell/state | the editor's own persisted state: what is open, selected and toggled |
| GET /api/v1/asset-library/node-types | every node type with its params and inputs, read only |
| GET /api/v1/game/performance | what the running world costs to draw and simulate |
| GET /api/v1/openapi.json | this same contract as a machine-readable schema |
| GET /api/health | whether the server is up, and which commit it is running |
| WS /api/v1/game/socket | the live game: player input in, world and puzzle state out |

## Actions — moving

God mode moves by compass; character mode moves relative to its facing.
Diagonal steps slide: if the diagonal is blocked on one axis, you still move
along the other.

| action | params | the human control | what it does |
| --- | --- | --- | --- |
{{MOVEMENT_ACTIONS}}

## Actions — your senses (character mode)

| action | params | the human control | what it does |
| --- | --- | --- | --- |
{{SENSES_ACTIONS}}

## Actions — building a world seed (god mode)

A world is grown from a world seed: an ordered pipeline of nodes plus a seed number. Each node outputs a
field (numbers per tile), tiles (a tile id per cell), or points (tagged
markers); a node may consume the outputs of EARLIER nodes only. A display
binding maps a node into the world: tile layers stack in list order, elevation
shapes the ground, markers draw glyphs, pieces stamp structures, creatures
spawn life, items float loot above the ground. Every act that edits echoes the full pipeline back, and every later
observation is regenerated from it.

| action | params | the human control | what it does |
| --- | --- | --- | --- |
{{PIPELINE_ACTIONS}}

## Actions — the assets (god mode)

Tiles, items, pieces, creatures and characters are the vocabulary the pipeline
draws from. A node references them by id, so create the definition first, then
point a node at it.

An item is pixel art on a transparent background plus how it is drawn — a
billboard (the sprite extruded to a slight thickness, standing up or lying flat,
its rim painted with the edge color) or a floating cube painted face by face —
and how much room it takes in an inventory: 1x1, 1x2, 2x2, or any size up to
8x8. A character is a creature that additionally carries an inventory: a grid
whose slots can each be switched off or tagged, so a tagged slot only accepts
items carrying one of its tags, with a sprite layered underneath.

| action | params | the human control | what it does |
| --- | --- | --- | --- |
{{ASSET_ACTIONS}}

## Actions — whole world seeds and saved worlds (god mode)

A world seed is the recipe: a named pipeline that always grows the same world.
A saved world is a world you have been in, keeping the seed frozen as it stood
plus what the player did there — what they picked up, which fixtures they
worked, where they are standing. Running a seed grows a fresh world; running a
save puts you back where it left off.

| action | params | the human control | what it does |
| --- | --- | --- | --- |
{{WORLD_ACTIONS}}

## Example bodies

One per action that takes params:

{{EXAMPLES}}

## Failure codes

| code | meaning | recovery |
| --- | --- | --- |
{{FAILURES}}

## Node types you can add

Full param and input details: GET /api/v1/asset-library/node-types.

| type | output | category | when to use |
| --- | --- | --- | --- |
{{NODE_TYPES}}

## Legend (current tileAssets)

{{LEGEND}}

Marker glyphs placed by the world's pipeline can also appear; each observation's
legend names every glyph visible in that observation.

## The loop

Observe, decide, act, repeat. Inside a run every tool result carries a fresh
observation, so one tool call is one whole step. Nothing moves while you think:
the world only changes when someone acts on it.

## Autopilot runs

A run started through POST .../run drives the agent with an LLM. It gets one tool
per action above, plus these of its own:

| tool | what it does |
| --- | --- |
{{AUTOPILOT_TOOLS}}

Notes and scripts outlive the run, and both are repeated back in every
observation the model sees, along with what is left of the run's dollar budget.
A script is a list of these same actions — one per line, params as key=value,
optionally prefixed with "repeat N" — so it can do nothing an agent could not do
a step at a time. Scripts are checked against this mode's actions and their
params when they are written, not when they are run.
`;

export function buildApiDocs(tileAssets: ReadOnlyTileAssets): string {
  const filled = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    placeholderValue(tileAssets, key),
  );
  const unfilled = filled.match(/\{\{\w+\}\}/);
  if (unfilled) throw new Error(`unfilled docs placeholder ${unfilled[0]}`);
  return filled;
}

export function everyCommand(): CommandSpec[] {
  const modes: CommandMode[] = ['god', 'character'];
  return modes.flatMap((mode) => commandsForMode(mode));
}

function placeholderValue(tileAssets: ReadOnlyTileAssets, key: string): string {
  if (key === 'GOD_SIZE') return String(GOD_VIEW_SIZE);
  if (key === 'CHARACTER_SIZE') return String(characterViewSize());
  if (key === 'SIGHT_RADIUS') return String(DEFAULT_CHARACTER_SIGHT_RADIUS_TILES);
  if (key === 'MIN_SIGHT_RADIUS') return String(MIN_CHARACTER_SIGHT_RADIUS_TILES);
  if (key === 'MAX_SIGHT_RADIUS') return String(MAX_CHARACTER_SIGHT_RADIUS_TILES);
  if (key === 'MAX_CHARACTER_SIZE') return String(characterViewSize(MAX_CHARACTER_SIGHT_RADIUS_TILES));
  if (key === 'ENDPOINTS') return endpointsTable();
  if (key === 'AUTOPILOT_TOOLS') return autopilotToolsTable();
  if (key === 'EXAMPLES') return examples();
  if (key === 'FAILURES') return failuresTable();
  if (key === 'NODE_TYPES') return nodeTypesTable();
  if (key === 'LEGEND') return legendBlock(tileAssets);
  return actionsTableFor(key);
}

const GROUP_OF_PLACEHOLDER: Readonly<Record<string, CommandGroup>> = {
  MOVEMENT_ACTIONS: 'movement',
  SENSES_ACTIONS: 'senses',
  PIPELINE_ACTIONS: 'pipeline',
  ASSET_ACTIONS: 'assets',
  WORLD_ACTIONS: 'world',
};

function actionsTableFor(key: string): string {
  const group = GROUP_OF_PLACEHOLDER[key];
  if (!group) throw new Error(`unknown docs placeholder ${key}`);
  return actionsTable(everyCommand().filter((spec) => spec.group === group));
}

function actionsTable(specs: readonly CommandSpec[]): string {
  return specs
    .map(
      (spec) =>
        `| \`${spec.action}\` | ${paramsCell(spec)} | ${spec.humanControl} | ${spec.description} |`,
    )
    .join('\n');
}

function paramsCell(spec: CommandSpec): string {
  const entries = Object.entries(spec.params);
  if (entries.length === 0) return '—';
  return entries
    .map(([name, param]) => `\`${name}\`${param.optional ? ' (optional)' : ''}: ${param.help}`)
    .join('; ');
}

function autopilotToolsTable(): string {
  return metaTools('god')
    .map((tool) => `| ${tool.name} | ${firstSentenceOf(tool.description)} |`)
    .join('\n');
}

function firstSentenceOf(description: string): string {
  const stop = description.indexOf('. ');
  return stop === -1 ? description.replace(/\.$/, '') : description.slice(0, stop);
}

function endpointsTable(): string {
  return everyRegisteredRoute()
    .map(
      (route) =>
        `| ${route.method} /api/v1${route.path} | ${paramsCellOf(route.body)} | ${paramsCellOf(route.query)} | ${route.summary} |`,
    )
    .join('\n');
}

function paramsCellOf(params: Record<string, CommandParamSpec>): string {
  const entries = Object.entries(params);
  if (entries.length === 0) return '—';
  return entries
    .map(([name, param]) => `\`${name}\`${param.optional ? ' (optional)' : ''}: ${param.help}`)
    .join('; ');
}

function examples(): string {
  return everyCommand()
    .filter((spec) => Object.keys(spec.params).length > 0)
    .map((spec) => `    ${JSON.stringify(spec.example)}`)
    .join('\n');
}

function failuresTable(): string {
  return FAILURES.map(
    (failure) => `| \`${failure.code}\` | ${failure.meaning} | ${failure.recovery} |`,
  ).join('\n');
}

function nodeTypesTable(): string {
  return allNodeTypes()
    .map(
      (def) =>
        `| \`${def.type}\` | ${typeof def.output === 'function' ? 'depends on params' : def.output} | ${def.category} | ${def.whenToUse} |`,
    )
    .join('\n');
}

function legendBlock(tileAssets: ReadOnlyTileAssets): string {
  const tiles = tileAssets
    .all()
    .map(
      (tile) =>
        `- '${tile.symbol}' = ${tile.name} (${tile.walkable ? 'you can walk here' : 'blocks you'})`,
    );
  return [
    "- '@' = you",
    "- ' ' = nothing generated here (in character mode, also: behind you, fogged out past your sight radius, or hidden behind tall ground or a ridge)",
    "- '?' = unrecognized tile",
    ...tiles,
  ].join('\n');
}
