# Items and inventories

Two library tabs sit alongside tiles, prefabs and creatures: **items** are
things you can pick up, **characters** are creatures that can carry them.
Everything here is a definition — a pure function of the library plus the seed —
and everything here is an ability, so the browser panels and the agent API drive
exactly the same code.

## Items

An item is pixel art on a transparent background plus a decision about how that
art becomes geometry.

- **billboard** — the sprite on a flat quad extruded to a slight `thickness`.
  Transparent pixels stay see-through; the rim that the thickness exposes is
  painted flat with the `edge color`. A billboard is **vertical** (standing up,
  read face on) or **horizontal** (lying flat, read from above). It does not
  turn to face the camera: the thickness is there to be seen from the side.
- **cube** — the item's cube face art wrapped onto a cube, painted face by face
  exactly like a tile.

Either way the item floats: `float` is how far above the ground it hangs, and
`size` is how large it is drawn, in tiles. Items never block movement.

The art lives in two fields, and the editor shows whichever the render mode
uses: `sprite` is a single square grid of colors and nulls (null is
transparent), `face_art` is the same six-face cube art tiles and creatures use.

### Putting items in the world

Bind a `points` node to display `items` and pick one, exactly as you would bind
prefabs or creatures. Every point floats a copy. In the ASCII and agent views an
item draws its symbol in its own color, and the observation legend names it.

## Inventories

A character is a creature in every respect — same look, same behavior, same
spawning from a points node — that additionally carries an inventory. Any
creature can be promoted with `+bag` on its row, or created directly with
`+ add character`.

An inventory is a `width × height` grid, up to 16 on a side.

- **Every slot can be switched off.** A dead slot is drawn sunken and nothing
  may cover it, which is how you carve a bag into a non-rectangular shape.
- **Every slot can carry tags.** A slot with no tags accepts anything; a tagged
  slot only accepts items carrying one of its tags. Tags are free-form strings
  on both sides, lowercased and de-duplicated.
- **The whole grid can have pixel art layered under it.** The square sprite is
  stretched across the grid and the slots draw on top of it.

Items take up cells the Diablo way: `1×1` for a potion, `1×2` for a sword,
`2×2` for a shield — and any size up to `8×8` if you want it. An item is placed
by its top-left corner and is refused if any cell of its footprint would fall
off the grid, land on a dead slot, land on a slot that does not accept its tags,
or overlap an item already placed. Resizing keeps the slot flags and tags that
still fit and drops the items that no longer do.

## Editing an inventory

Open a character's `bag`. The grid has three modes:

- **slots** — click a cell to switch it between usable and dead.
- **tags** — click a cell to select it, then edit its tags below.
- **items** — pick an item, then click where its top-left corner goes; click a
  placed item to take it back out.

`backdrop` opens the same pixel art editor on the art under the grid, and
`grid` resizes.

## From the API

`GET /api/v1/items` lists every item with its render mode, footprint and tags.
`GET /api/v1/creatures` says which creatures are characters and how big their
grids are; `GET /api/v1/creatures/{id}/inventory` returns the grid itself —
every slot with its usable flag and tags, and every placement.

The actions, all god mode:

| action | what it does |
| --- | --- |
| `add_item`, `duplicate_item`, `remove_item` | manage definitions |
| `update_item` | name, symbol, color, render, orientation, thickness, edge_color, size, hover, sprite, face_art, grid_width, grid_height, tags |
| `add_character` | a creature that starts with a 6×4 inventory |
| `update_creature` with `kind` | promote a creature to a character (it gains an empty grid) or demote it |
| `set_inventory` | create or resize the grid |
| `update_inventory_slot` | one slot's usable flag and tags |
| `set_inventory_background` | the sprite under the grid |
| `place_inventory_item`, `remove_inventory_item` | put items in and take them out |
| `set_display` with `display: "items"` | scatter an item through the world from a points node |

A refused placement comes back as `placement_refused` with a hint naming which
of the four rules stopped it.
