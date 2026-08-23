import type { TileDef } from '../../tileDef';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

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

export const TILE_HEIGHT_TIP: TooltipContent = {
  title: 'height',
  body: 'How tall the tile stands in the 3-D view, in tiles. Only blocking tiles stand up — walkable tiles are drawn as floor whatever this says. Blockers default to 2 so a character cannot see over them, and never drop below 1.5 so no one appears to step through them.',
};

export const TILE_SHAPE_TIP: TooltipContent = {
  title: 'shape',
  body: 'Which solid the tile draws as in the 3-D view. A cube fills its cell and hides whatever it touches; a wall joins up with neighbouring blockers so runs of it stay solid; every other shape leaves part of the cell open and is turned by the facing stored with each voxel. Blocking tiles only draw as cube or wall.',
};

export function deleteTileTip(tile: TileDef): TooltipContent {
  return {
    title: `delete ${tile.name}`,
    body: 'Removes the tile from the tile assets. Nodes still pointing at it fall back to empty.',
  };
}

export const SCALED_ART_STRIP_TIP: TooltipContent = {
  title: 'scaled down copies',
  body: 'Every painted face is kept at half sizes all the way down to one pixel of its average color. The 3-D view draws whichever copy the tile is big enough on screen to need, and stops shading relief once it is drawing a scaled down one.',
};

export function scaledArtTip(side: number): TooltipContent {
  return {
    title: `${side}×${side}`,
    body:
      side === 1
        ? 'The whole face averaged into one pixel — what a tile too far away to cover a screen pixel is drawn as.'
        : `The copy drawn once a tile covers fewer than ${side * 2} screen pixels.`,
  };
}
