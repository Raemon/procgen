# Prefabs and creatures

The library panel (left) has five tabs over the same idea: reusable definitions
the world is assembled from. **Tiles** are materials, **prefabs** are voxel
stamps built out of tiles, **creatures** are things that move, and **items** and
**characters** are covered in [Items and inventories](items-and-inventories.md).
Prefabs, creatures and items are placed by the pipeline — each is a display
binding on a `points` node — so the world stays a pure function of the seed,
with the single exception noted under [Creature time](#creature-time).

## Prefabs

A prefab is a `width × depth × layers` box of tile ids, `-1` for empty.

- **Layer 1 in the stepper is the ground cell.** It replaces the terrain tile
  where the prefab lands, so a plank floor is walkable and a stone wall blocks
  exactly as it would if the terrain had painted it.
- **Layers above stack upward**, one cube per layer, resting on whatever the
  ground layer became. They render as blocks in 2.5D; the ASCII view shows the
  topmost voxel of the column, so a cottage reads as its roof from above.
- **The anchor** is the centre cell, outlined in the editor. That is the cell
  that lands on the point the pipeline scattered.

### Editing

Open a prefab with the `3D` button. The editor is one layer at a time — the
layer below is ghosted underneath so you can trace walls up a floor plan.

- `▾ ▴` step layers, `+ −` add or drop the top layer.
- palette swatches pick the tile to paint; the first swatch is empty.
- `paint / erase / fill / pick`, then `undo`, `rotate` (90° for the whole
  prefab), `copy`/`paste` (a whole layer), `clear` (this layer).
- `size` resizes in place, keeping every voxel that still fits.
- the preview at the bottom is the real thing in 3D — drag to orbit.

### Capturing out of the world

Press `capture` in the world view toolbar and drag a rectangle over either the
ASCII or the 2.5D view. The selection becomes a new prefab, opened in the
library, containing:

- the tile of every cell in the rectangle,
- any prefab voxels already standing there,
- terrain height, converted into stacked voxels relative to the lowest cell in
  the selection — so a hillside captures as a solid slope, not a flat plate.

`Esc` leaves capture mode. Panning is suspended while capture is on, so a drag
always means a selection.

### Placing prefabs

Set any `points` node's display to `prefabs`, choose the prefab, and choose a
rotation: one of the four quarter turns, or `random`, which hashes each point's
position — the same seed always turns each copy the same way.

Stamps are gathered per chunk from the points nodes in the surrounding chunks,
so a prefab may overhang chunk borders freely. Prefabs up to 48×48 in footprint
and 24 layers tall are supported.

## Creatures

A creature definition is a look (symbol, color, optional cube art painted in the
same pixel editor tiles use) plus a behavior and four numbers:

| knob | meaning |
| --- | --- |
| speed | tiles per second while moving |
| sight | how far it notices the player |
| roam | how far it strays from its spawn cell |
| size | cube size in the 2.5D view |

`phasing` lets it ignore walls and water; otherwise creatures are blocked by
anything the player cannot walk on, including prefab walls.

Behaviors: `idle`, `wander`, `patrol` (a fixed line through the spawn cell),
`chase`, `flee`, and `guard` (chases while both stay near home, then walks
back).

### Spawning

Set a `points` node's display to `creatures` and pick a creature. Every point
within 40 tiles of the player becomes one live creature; creatures more than 56
tiles away are dropped and respawn at their spawn cell when you return.

### Creature time

Creature positions are the one part of the world that is not a pure function of
the seed — they advance with wall-clock time while the `life` button in the
world toolbar is on. Everything upstream of that is deterministic: which cells
spawn creatures, which creature spawns there, and each creature's random stream
(seeded from its spawn cell) all come from the seed, so pausing life and
reloading gives back the same population in the same starting places. Any change
to the pipeline, tileset, prefabs or creatures resets live creatures to their
spawn cells.
