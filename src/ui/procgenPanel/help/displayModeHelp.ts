import type { DisplayMode } from '../../../procgen/display/displayBinding';
import { displayModesForKind } from '../../../procgen/display/displayBinding';
import type { ValueKind } from '../../../procgen/values/chunkValues';
import type { TooltipContent } from '../../tooltips/tooltipContent';

export const MODE_LABELS: Record<DisplayMode, string> = {
  hidden: 'hidden',
  tileLayer: 'tile layer',
  elevation: 'elevation',
  markers: 'markers',
};

const MODE_HELP: Record<DisplayMode, string> = {
  hidden: 'Not drawn at all. For intermediate values that only exist to feed nodes below.',
  tileLayer:
    'Paints the tiles into the map. Layers stack in panel order: later non-empty cells cover earlier ones, empty cells let lower layers show.',
  elevation:
    'Uses the field as 2.5D ground height, multiplied by the height slider. The last enabled elevation node wins.',
  markers:
    'Draws each point on top of the terrain — a glyph in ASCII, a cone in 2.5D — styled from a tile or a custom glyph and color.',
};

export function displayModeTooltip(kind: ValueKind): TooltipContent {
  return {
    title: 'display',
    body: 'How this node is drawn into the world. Display never changes dataflow — hidden nodes still feed nodes wired to them.',
    options: displayModesForKind(kind).map((mode) => ({ name: MODE_LABELS[mode], meaning: MODE_HELP[mode] })),
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
