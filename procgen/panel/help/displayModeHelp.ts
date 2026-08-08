import type { DisplayMode } from '../../display/displayBinding';
import { displayModesForKind } from '../../display/displayBinding';
import type { ValueKind } from '../../values/chunkValues';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';

export const MODE_LABELS: Record<DisplayMode, string> = {
  hidden: 'hidden',
  tileLayer: 'tile layer',
  ceiling: 'ceiling',
  elevation: 'elevation',
  markers: 'markers',
  prefabs: 'prefabs',
  creatures: 'creatures',
  items: 'items',
};

const MODE_HELP: Record<DisplayMode, string> = {
  hidden: 'Not drawn at all. For intermediate values that only exist to feed nodes below.',
  tileLayer:
    'Paints the tiles into the map. Layers stack in panel order: later non-empty cells cover earlier ones, empty cells let lower layers show.',
  ceiling:
    'Roofs the world over: every non-empty cell hangs as a block that many tiles above the ground. Only drawn in first-person, so the god camera can still see down into a covered world.',
  elevation:
    'Uses the field as 2.5D ground height, multiplied by the height slider. The last enabled elevation node wins.',
  markers:
    'Draws each point on top of the terrain — a glyph in ASCII, a cone in 2.5D — styled from a tile or a custom glyph and color.',
  prefabs:
    'Stamps a prefab from the library at every point, anchored on its centre cell. Voxels above ground stack into the world and block movement like any other tile.',
  creatures:
    'Spawns a creature from the library at every point near the player. Creatures move by their behaviour instead of being baked into the map.',
  items:
    'Floats an item from the library above every point: a thickened billboard or a cube, drawn from the item art and never blocking movement.',
};

export function displayModeTooltip(kind: ValueKind): TooltipContent {
  return {
    title: 'display',
    body: 'How this node is drawn into the world. Display never changes dataflow — hidden nodes still feed nodes wired to them.',
    options: displayModesForKind(kind).map((mode) => ({ name: MODE_LABELS[mode], meaning: MODE_HELP[mode] })),
  };
}

export function ceilingHeightTooltip(): TooltipContent {
  return {
    title: 'ceiling height',
    body: 'How many tiles above the ground the roof hangs. Keep it above head height or the player walks into her own ceiling, and no higher than the walls below it reach: a roof over a gap sits above the first-person view and reads as no roof at all.',
  };
}

export function prefabRotationTooltip(): TooltipContent {
  return {
    title: 'rotation',
    body: 'How each stamped copy is turned. Random rotation is a stable hash of the point, so the same seed always turns each copy the same way.',
    options: [
      { name: 'random', meaning: 'Each point picks one of the four quarter turns from its own position hash.' },
      { name: '0° / 90° / 180° / 270°', meaning: 'Every copy faces the same way.' },
    ],
  };
}

export function markerTileTooltip(): TooltipContent {
  return {
    title: 'marker style',
    body: 'What each point looks like in the world.',
    options: [
      {
        name: '(custom glyph)',
        meaning: 'Style markers with the glyph and color fields below, independent of the tileset.',
      },
      {
        name: 'tileset tiles',
        meaning: "Borrow the tile's symbol and color, so tile edits restyle these markers live.",
      },
    ],
  };
}
