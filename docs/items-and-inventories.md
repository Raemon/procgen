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

An item can also emit light: `light` is the radius it lights in tiles and
`light ink` the colour of that light. A lit item lights the ground where it
lies, and lights the way for any character carrying it —
`docs/light-and-darkness.md` covers the whole model.

The art lives in two fields, and the editor shows whichever the render mode
uses: `sprite` is a single square grid of colors and nulls (null is
transparent), `face_art` is the same six-face cube art tiles and creatures use.

## Transparent colors

Every color control in the app — tile, creature, item, edge, marker and the
paint color itself — has a checkerboard toggle beside its swatch that makes the
color transparent, written as `#rrggbbaa` with `aa` = `00`. Toggling back
restores the hue you had.

What transparent means depends on where the color is used:

- **the paint color** — the stroke punches a hole instead of storing a color,
  the same thing `erase` does. Picking a hole with the eyedropper hands you the
  transparent color back.
- **a tile, creature or item color** — the flat color under the art. Transparent
  makes the art's empty pixels see-through, and a tile with no art at all is
  simply not drawn.
- **an item's edge color** — the extruded rim of a billboard disappears, leaving
  the sprite alone.

### Putting items in the world

Bind a `points` node to display `items` and pick one, exactly as you would bind
prefabs or creatures. Every point floats a copy. In the ASCII and agent views an
item draws its symbol in its own color, and the observation legend names it.

## Characters

A character is a creature in every respect — same behavior, same spawning from a
points node — that additionally renders as a billboard and carries an
inventory. Any creature can be promoted with `+bag` on its row, or created
directly with `+ add character`.

### Billboard sprites

A character's quad turns to face the camera every frame; which sprite it wears
depends on the angle between the way it is walking and the way the camera looks.
There are **five rotations**:

| rotation | what you see |
| --- | --- |
| `front` | walking toward the viewer |
| `frontQuarter` | 45° off, turned toward the viewer |
| `side` | in profile, crossing the view |
| `backQuarter` | 45° off, turned away |
| `back` | walking away from the viewer |

Those five cover all eight compass facings: the far half of the turn reuses the
same sprites flipped, so you only ever paint one side. Turning the god camera
turns every character with it.

**Each rotation has two animations**: `idle`, played while the character stands
still, and `moving`, played while it walks — each its own list of frames with
its own frames-per-second. A rotation or animation with no frames falls back to
one that has them, so a single front-facing idle frame is a valid character.
Characters start their animations at staggered phases so a crowd does not march
in lockstep, and a character with no sprites at all falls back to the cube art
creatures use.

Open `sprites` on a character row: pick a rotation, pick idle or moving, then
add, select, paint and drop frames. New characters ship with a generated
humanoid — five rotations, a two-frame idle and a four-frame walk cycle — as a
starting point to paint over (`npm run characters:preview` renders the sheet to
`docs/character-sheet-preview.png`).

## Inventories

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
`GET /api/v1/creatures` says which creatures are characters, how big their grids
are, and how many frames each rotation and animation holds; `GET /api/v1/creatures/{id}/inventory` returns the grid itself —
every slot with its usable flag and tags, and every placement.

The actions, all god mode:

| action | what it does |
| --- | --- |
| `add_item`, `duplicate_item`, `remove_item` | manage definitions |
| `update_item` | name, symbol, color, render, orientation, thickness, edge_color, size, hover, light, light_ink, sprite, face_art, grid_width, grid_height, tags |
| `add_character` | a creature that starts with a 6×4 inventory and a generated humanoid billboard |
| `set_character_frame` | paint one frame of one animation of one rotation; the frame after the last one appends |
| `remove_character_frame` | drop one frame; dropping the last one anywhere removes the billboard |
| `set_character_animation_fps` | how fast `idle` or `moving` plays, 0-30 |
| `clear_character_billboard` | back to cube art |
| `update_creature` with `kind` | promote a creature to a character (it gains an empty grid) or demote it |
| `set_inventory` | create or resize the grid |
| `update_inventory_slot` | one slot's usable flag and tags |
| `set_inventory_background` | the sprite under the grid |
| `place_inventory_item`, `remove_inventory_item` | put items in and take them out |
| `set_display` with `display: "items"` | scatter an item through the world from a points node |
| `pick_up_item` (god) / `pick_up` (character) | take the item under the player into the player character's bag |

A refused placement comes back as `placement_refused` with a hint naming which
of the four rules stopped it.
