# Light and darkness

A world decides how much light falls out of the sky; everything else that is
lit, lights itself. The two halves meet in the 2.5D view, where the sky is one
ambient level and every emitter is a point light.

## Daylight is a world setting

`daylight` sits next to the seed on `PipelineState` — a number from 0 to 1, set
from the procgen panel's *daylight* row or with `set_daylight`. It is a world
setting rather than a node because it is not spatial: no chunk generates it and
no node consumes it.

- **1** is the sun overhead. Every existing world loads at 1, because that is
  what a missing field sanitizes to.
- **0** is an underground world. The ambient light drops to almost nothing and
  the sun is switched off, so the only things you can see are the ones that
  emit light and the things standing near them.

## Anything can emit light

Two fields, the same pair on both a tile and an item:

| field | meaning |
| --- | --- |
| `light` | radius in tiles the thing lights, 0-24. `0` means it emits nothing. |
| `lightInk` | the colour of the light cast, independent of the colour of the art. |

They are edited from the tile row's art panel and the item row's knobs panel,
or through `update_tile` / `update_item` with `light` and `light_ink`.

Where the light comes from:

- **blocks** — any tile with a radius lights the cell it sits in, whether it is
  ground or hanging in a ceiling. Lava ships lit; every other default tile is
  dark.
- **items** — an item lying in the world lights the ground around it. The torch
  in the default library is the worked example.
- **characters** — a character carrying a lit item in its inventory casts that
  item's light from wherever it is standing, and the light walks with it. If a
  character carries several, the brightest wins
  (`brightestCarriedLight`).

The view keeps a pool of point lights (`WorldLights`) and hands it the nearest
emitters to the player, so a world with thousands of glowing tiles still costs
a fixed number of lights per frame. Tile and item emitters are gathered once per
patch of ground; carried lights are recomputed every frame because they move.

## Picking things up

An item scattered by a points node is part of the generated world, so "taking"
one is a fact the world has to remember: `TakenItemSpawns` records the spawns
that have been picked up and `WorldSampler` stops reporting them.

`pick_up` (character mode) and `pick_up_item` (god mode) — both bound to **G** —
take whatever lies on the tile the player stands on and place it in the first
slot of the player character's bag that accepts it. They fail with
`nothing_to_pick_up` when the tile is bare and `placement_refused` when the bag
is full. Picking up a torch is how a dark world becomes navigable.

## Ceilings

A world can only be underground if something is over your head. Any node whose
output is `tiles` can be bound to the **ceiling** display instead of a tile
layer: every non-empty cell hangs as a block that many tiles above the ground,
and empty cells leave a hole. Ceilings never affect walkability or the ground
tile — they are drawn, not stood on.

Ceilings are drawn in first person only. The god camera looks down from above,
where a roof would hide the entire world, so the streamer keeps the ceiling
group hidden until the camera goes inside the character.
