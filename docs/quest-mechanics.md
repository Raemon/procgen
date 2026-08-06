# Quest mechanics

The quest layer is the second sanctioned piece of game state, alongside
[creature time](prefabs-and-creatures.md#creature-time): a thin, explicitly
impure layer over a world that stays a pure function of the seed. What is
locked, what unlocks it, and where everything sits all come from the
pipeline; the only mutable state is **which keys each actor holds**.

## The tag contract

Quest semantics ride the point-tag channel. Any points node — including a
custom script — participates by emitting tags with two prefixes:

| tag | meaning |
| --- | --- |
| `key:<id>` | a key at rest on that cell; stepping onto the cell takes it |
| `door:<id>` | that cell is impassable to an actor until they hold `key:<id>` |

Ids are free strings; the vault nodes use the district coordinate
(`key:3,-2` opens `door:3,-2`), but nothing cares about the format beyond
equality. Tags are read from every enabled points node **regardless of its
display mode** (`QuestPointsIndex` in `src/quest/`): display chooses the
skin, not the semantics. The same key point can be a `⚷` marker (a pickup
at rest), a creature (a keeper carrying it — see below), or hidden (an
invisible latch).

## Rules

- **Pickup is a movement side-effect, not a verb.** Arriving on a cell with
  a `key:` tag adds that key to the actor's inventory. Keys never run out
  and are never consumed; a door, once its key is held, is open for that
  actor forever.
- **Doors block per-actor.** `door:` cells are subtracted from walkability
  for any actor who lacks the key (`questWalkability`). The door *tile*
  should be walkable (the vault nodes use wood planks); the tag is the
  lock, so unlocking needs no tile rewrite and no cache invalidation.
- **Creatures never hold keys.** Every `door:` cell blocks every creature
  always (`creatureWalkability`) — a treasure room stays sealed even while
  its owner is out chasing you.
- **Inventories are ephemeral.** Like creature positions, they reset
  whenever the world is rebuilt (pipeline edit, seed change, reload).
  Agent-session inventories live for the session.

## Keepers: building quest mechanics on creatures

A points node with `key:` tags and a **creatures** display spawns a
creature at each key point — and the creature *is* the key. The
`CreatureSim` quest hooks (`questCreatureHooks`) add two rules:

- **Catch to collect.** Touching a creature spawned from a `key:` point
  (contact within ~1 tile) collects that key and despawns the creature.
  Give the keeper the `flee` behavior and collecting a key becomes a chase
  — corner it against a wall or the vault it guards.
- **No respawn once claimed.** Spawn points whose key is already held are
  suppressed on rescan, so a caught keeper stays gone until the inventory
  resets.

The key's resting cell still collects by stepping on it (that is what API
agents and life-off play use), so the keeper is an *animated alternative*,
not a requirement — the same point, two ways to claim it. Creatures exist
only in the browser, so keeper-catching is browser-only by the same
asymmetry that already governs creatures; determinism of *which* keeper
carries *which* key is untouched.

## Agents and parity

Both worlds run the same modules: the browser wraps the player's
walkability probe and the dev server wraps each agent session's steps with
the same `questRules`. Per the parity rule, everything an agent can sense
goes through the one observation path:

- observations carry `keys_held`, and the text header prints
  `keys held: ...`;
- a door marker's legend line says locked (`blocks you`) or
  `unlocked for you`, a key marker's says whether it is still there to
  take;
- stepping into a locked door fails with the `locked_door` code, whose
  hint names the exact `key:` tag to hunt for;
- a successful step onto a key reports `picked up key:<id>` in the act
  summary.

Collected keys keep their marker (think of it as the keeper's nest); the
legend annotation is what says it is spent.

## Shared plans and `worldRngAt`

The vault nodes are the reference for the **shared-plan idiom**: one pure
function (`vaultPlan.ts`) derives a district's whole layout, and sibling
nodes each re-derive it — `vaultWalls` paints it, three `vaultPoints`
instances emit its door, key and treasure. That only works if the plan's
randomness is independent of which node asks: `ctx.rngAt` is salted with
the node id (correct for single-node structures like the labyrinth), so
shared plans use **`ctx.worldRngAt(gridX, gridY, label)`** — keyed by seed,
coordinates and label only. Any node family that must agree on a structure
bigger than any one output kind should derive it from `worldRngAt` behind
a shared plan function, and knobs that feed the plan (district span, vault
size) must match across the family — say so in their `help`.

## The vault keepers preset

The `vault keepers` example is the minimum viable procedural demonstration:
an endless grass plain where every 96-tile district holds one walled vault
— stone ring, flagstone floor, plank door locked by `door:` tag, treasure
at the center, key resting somewhere in the district outside the walls,
carried by a fleeing keeper, with a sentry guarding each doorstep. Solvable
by construction (the key is always outside the walls it opens), verified in
`npm run check`: the treasure is BFS-unreachable until the key cell is
stepped on, and reachable after.
