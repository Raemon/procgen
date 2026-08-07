# Multiplayer

The architecture is ported from chunkmaze (now deprecated in favor of this
project): one Node process, raw WebSockets, an authoritative server running a
20Hz tick, standing orders instead of input streams, HMAC resume tokens
instead of accounts, and optional Postgres persistence behind a write-behind
flush.

## The core bet: terrain never crosses the wire

A procgen world is a pure function of `(pipeline, seed, tileset, prefabs)`.
Every client generates its own terrain from the persisted docs, so the server
only syncs two things:

1. **Poses** — `(x, y, facing)` per entity, integer tiles, 8-way facing.
2. **Docs** — the persisted JSON files (`pipeline`, `tileset`, …). A `PUT
   /persist/:name` (or an agent pipeline edit) is written to `data/`, saved to
   the DB, and announced to every client as `docChanged`; clients refetch the
   pipeline and rebuild terrain locally.

## Process layout

`server/index.ts` (run with `tsx`) serves everything on port 8080:

- static client from `dist/` (production),
- `GET/PUT /persist/:name` — the persisted docs,
- `/api/v1/*` — the agent REST API (same code the Vite middleware used to
  host; it now lives in the game server so agents and humans share one world),
- `/healthz`,
- `WS /ws` — the game socket.

In dev, Vite (port 1111) proxies `/ws`, `/api/v1` and `/persist` to 8080;
`npm run dev` starts both.

## The tick and the order model

The server runs a drift-corrected 20Hz loop (`server/game/gameLoop.ts`,
`TICK_MS = 50`). Clients never send steps — they send **standing orders**,
idempotent latest-wins state: hold a direction (`[Order, 1, dir]` with dir an
8-way facing index) and the server walks you at the movement cadence until
you release (`[Order, 0, 0]`). Movement pacing is the cooldown in
`src/sim/movementOrder.ts`: 3 ticks (150ms) per cardinal tile, 4 ticks
(200ms) per diagonal. A blocked diagonal slides along a free axis. A tap
shorter than one hop is downgraded on release into a single one-tile step, so
tapping still moves you. The same `tickMovement` function is the server's
authority and the client's offline fallback (`src/net/localMovementSim.ts`),
which drives the world when no server is reachable.

## Protocol (`src/net/protocol.ts`, codec in `src/net/codec.ts`)

Hot messages are positional arrays with an opcode at index 0; rare messages
are `{t: ...}` objects. All (de)serialization goes through the codec file.

- client → server: `hello {v, name, token?}`, `[Order, kind, dir]`,
  `[Turn, ±1]` (turns are free and instant), `say {text}`
- server → client: `welcome {id, x, y, facing, token}`,
  `[Snapshot, tick, rows]` every tick (full roster, rows
  `[id, x, y, facing, cooldown, moveDir]` so a client can re-project an
  in-flight hop), `entityMeta {id, name, kind}` (once per entity per
  connection), `said {id, text}`, `docChanged {name}`, `kick {code}`

Online there is **zero client prediction**: the local player's tile position
comes from snapshots, exactly like every other entity (chunkmaze's rule). The
views ease all meshes — own player included — between tiles at the hop rate
(`src/views/view3d/easedPoint.ts`), so 20Hz tile updates render as smooth
walking. The only local echo is facing, which is applied immediately and
shielded from snapshot overwrite for a short quiet window.

## Chat: speech over the speaker's head, not a log

Chat is rare, so it rides the object half of the protocol rather than the
snapshot rows: a client sends `say {text}` and the server broadcasts
`said {id, text}` keyed by **entity id**, the same id the snapshot rows use.
Nothing about chat touches the tick.

The multiplayer rules shape it in five places:

- **No client prediction, chat included.** Your own line appears when the
  server echoes it back, exactly like everyone else's — the client never
  renders a bubble it hasn't been told about. The single exception is the
  offline fallback: when no server is reachable (`localMovementSim` is
  driving), `say` writes straight into the local bubble store, so a
  server-less world still talks.
- **The server owns the text.** `sanitizeChatText` (shared by client and
  server, but authoritative on the server) strips control characters,
  collapses whitespace and cuts to 140 characters; empty results are
  dropped. Bubbles are written with `textContent`, so a line is never markup.
- **Flooding throttles, it does not kick.** Each connection carries a token
  bucket (3 lines burst, one refilled every 1.5s). Over-budget lines are
  dropped silently — they are not counted as input violations, because a
  human typing fast is not an abuser.
- **Bubbles live and die with entities.** They are keyed by entity id, so
  every snapshot prunes speakers that left the roster, and `welcome` clears
  the store on reconnect (ids are minted per process, never reused). A
  duplicate login adopts the same entity, so its bubbles survive the swap.
- **Lines expire on their own**, 3s plus 45ms per character, capped at 9s,
  with the last three lines per speaker stacked over their head.

Rendering is a DOM overlay in the 3-D view (`speechBubbleLabels.ts`) that
projects each speaker's *eased* mesh position — the same eased point the
mesh uses, so bubbles ride along with the walk animation instead of
snapping at 20Hz. In first person your own bubble would sit inside the
camera, so it is pinned to the bottom of the viewport instead, and other
players' bubbles are culled past the sight radius, where the fog has
already hidden the speaker.

Input lives in `ChatComposer`: return opens the composer, return sends and
keeps it open for the next line, return on an empty box closes it, escape
closes it. While it is open movement input is suspended and any held
movement keys are released, so you never walk away mid-sentence — with
standing orders a held direction would otherwise keep walking the whole
time you typed.

`npm run check:chat` covers both halves headlessly: the bubble store and
sanitizer as pure functions, then two real WebSocket clients against a
booted server for the round trip, scrubbing and throttle.

## Identity

No accounts. A first connection mints an anonymous character id; `welcome`
returns an HMAC token (30-day TTL, signed with `SERVER_SECRET`) which the
client stores in localStorage and presents on later hellos to resume the same
character. A duplicate login evicts the older connection and adopts its
entity.

## Persistence

`DATABASE_URL` is optional. Without it the server runs fully in-memory; with
it, Prisma (dynamically imported, structurally typed) stores two tables,
`ProcgenDoc` and `ProcgenCharacter` — table names are namespaced so the
database can be shared with other projects' tables without `prisma db push`
touching them. Docs are materialized from the DB into `data/*.json` at boot
(and seeded from the files on first boot); characters flush on a 10s
write-behind timer, on disconnect, and on shutdown.

## Deploy

`render.yaml` is a single `runtime: node` web service (`numInstances: 1` is
load-bearing — world state is in-process). The start command runs
`prisma db push` when a `DATABASE_URL` is present, then `tsx server/index.ts`.
Set `DATABASE_URL` in the Render dashboard to reuse the existing Neon
database; `SERVER_SECRET` is generated by Render.
