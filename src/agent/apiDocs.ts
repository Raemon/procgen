import type { Tileset } from '../world/tiles/tileset';
import { CHARACTER_VIEW_SIZE, GOD_VIEW_SIZE } from './observation';
import { FAILURES } from './failures';
import { verbsForMode } from './controls';

const TEMPLATE = `# Procgen world — agent API

You are an agent in an infinite, procedurally generated world. Everything you
can know about the world arrives as an ASCII grid plus a legend; everything you
can do goes through one action verb per request. A human playing this world in
agent mode sees exactly the text you receive — nothing more.

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
  You move by absolute compass steps.
- **character** — a {{CHARACTER_SIZE}}x{{CHARACTER_SIZE}} window centered on
  you, but only the tiles IN FRONT of you are drawn; the half of the grid
  behind you is blank. The blank side is how you know which way you face — the
  observation never states it. You move relative to your facing and turn in
  45-degree steps.

## Endpoints

| method and path | body | what it does |
| --- | --- | --- |
| GET /api/v1/docs | — | this document |
| POST /api/v1/agents | {"mode": "god" or "character", "name": optional} | create an agent; responds with its id and urls |
| GET /api/v1/agents | — | list agents |
| GET /api/v1/agents/{id} | — | the agent's current state |
| DELETE /api/v1/agents/{id} | — | remove the agent |
| GET /api/v1/agents/{id}/observe?format=json or text | — | a fresh observation |
| POST /api/v1/agents/{id}/act | {"action": "..."} | perform one action; responds with the outcome and a fresh observation |
| POST /api/v1/agents/{id}/run | {"goal": "...", "model": optional, "max_steps": optional, "anthropic_api_key": optional} | start an autopilot run that drives this agent with an LLM |
| POST /api/v1/agents/{id}/stop | — | stop the autopilot run |
| GET /api/v1/agents/{id}/transcript?after=seq | — | the autopilot transcript |

## Actions — god mode

| action | human control | what it does |
| --- | --- | --- |
{{GOD_ACTIONS}}

## Actions — character mode

| action | human control | what it does |
| --- | --- | --- |
{{CHARACTER_ACTIONS}}

Diagonal steps slide: if the diagonal is blocked on one axis, you still move
along the other.

## Failure codes

| code | meaning | recovery |
| --- | --- | --- |
{{FAILURES}}

## Legend (current tileset)

{{LEGEND}}

Marker glyphs placed by the world's pipeline can also appear; each observation's
legend names every glyph visible in that observation.

## The loop

Observe, decide, act, repeat. Every act response carries a fresh observation,
so a simple loop needs only POST .../act. Nothing moves while you think: the
world only changes when someone acts on it.
`;

export function buildApiDocs(tileset: Tileset): string {
  const filled = TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key: string) => placeholderValue(tileset, key));
  const unfilled = filled.match(/\{\{\w+\}\}/);
  if (unfilled) throw new Error(`unfilled docs placeholder ${unfilled[0]}`);
  return filled;
}

function placeholderValue(tileset: Tileset, key: string): string {
  if (key === 'GOD_SIZE') return String(GOD_VIEW_SIZE);
  if (key === 'CHARACTER_SIZE') return String(CHARACTER_VIEW_SIZE);
  if (key === 'GOD_ACTIONS') return actionsTable('god');
  if (key === 'CHARACTER_ACTIONS') return actionsTable('character');
  if (key === 'FAILURES') return failuresTable();
  if (key === 'LEGEND') return legendBlock(tileset);
  throw new Error(`unknown docs placeholder ${key}`);
}

function actionsTable(mode: 'god' | 'character'): string {
  return verbsForMode(mode)
    .map((verb) => `| \`${verb.action}\` | ${verb.humanControl} | ${verb.description} |`)
    .join('\n');
}

function failuresTable(): string {
  return FAILURES.map(
    (failure) => `| \`${failure.code}\` | ${failure.meaning} | ${failure.recovery} |`,
  ).join('\n');
}

function legendBlock(tileset: Tileset): string {
  const tiles = tileset
    .all()
    .map(
      (tile) =>
        `- '${tile.symbol}' = ${tile.name} (${tile.walkable ? 'you can walk here' : 'blocks you'})`,
    );
  return [
    "- '@' = you",
    "- ' ' = nothing generated here (in character mode, also: behind you)",
    "- '?' = unrecognized tile",
    ...tiles,
  ].join('\n');
}
