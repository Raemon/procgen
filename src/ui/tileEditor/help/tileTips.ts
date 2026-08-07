import type { TileDef } from '../../../world/tiles/tileDef';
import type { TooltipContent } from '../../tooltips/tooltipContent';

export const TILE_ART_TIP: TooltipContent = {
  title: 'cube art',
  body: 'Opens the pixel editor for this tile. Six faces make the cube in the 3-D view; the flat views take their colour from whatever you paint.',
};

export const TILE_SYMBOL_TIP: TooltipContent = {
  title: 'ascii symbol',
  body: 'The single character an agent reads for this tile in the ASCII views. Click to pick one from the glyph table.',
};

export const TILE_NAME_TIP: TooltipContent = {
  title: 'tile name',
  body: 'How the tile is listed in every dropdown that references it. Renaming keeps all existing references — they point at the tile, not the text.',
};

export const ADD_TILE_TIP: TooltipContent = {
  title: 'add tile',
  body: 'Appends a blank walkable tile at the end of the list, ready to be named and painted.',
};

export function walkableTip(tile: TileDef): TooltipContent {
  return {
    title: tile.walkable ? 'walkable' : 'blocks movement',
    body: 'Whether players, agents and non-phasing creatures can stand on this tile. Click to flip it.',
  };
}

export function deleteTileTip(tile: TileDef): TooltipContent {
  return {
    title: `delete ${tile.name}`,
    body: 'Removes the tile from the library. Nodes still pointing at it fall back to empty.',
  };
}
