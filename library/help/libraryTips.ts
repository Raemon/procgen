import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import type { LibraryFolder } from '../librarySelection';

export const FOLDER_TIPS: Readonly<Record<Exclude<LibraryFolder, 'world'>, TooltipContent>> = {
  tiles: {
    title: 'tiles',
    body: 'The materials every other asset is built from: symbol, walkability and cube art.',
  },
  items: {
    title: 'items',
    body: 'Pixel art on a transparent background, drawn as a thickened billboard or a floating cube, sized in inventory cells.',
  },
  pieces: {
    title: 'pieces',
    body: 'Voxel stamps — buildings, ruins, rock formations — painted layer by layer or captured straight out of the world view.',
  },
  cultures: {
    title: 'cultures',
    body: 'How a village builds: the tiles and role-bound pieces the assembler raises walls, roofs and floors from.',
  },
  creatures: {
    title: 'creatures',
    body: 'Things that move. Each one is a look plus a behavior, spawned into the world by any points node.',
  },
  characters: {
    title: 'characters',
    body: 'Creatures that carry things: the same rules plus an inventory grid of usable, taggable slots.',
  },
  groups: {
    title: 'node groups',
    body: 'Bookmarked groups of procgen nodes that function together, with the wiring between them already made. Stamp one into the pipeline, or save a pipeline folder here to reuse it later.',
  },
  pipeline: {
    title: 'pipeline',
    body: 'The nodes generating this world, running top to bottom. Drag ⠿ to reorder, and give adjacent nodes the same folder name to band them together.',
  },
};

export const WORLD_ROW_TIP: TooltipContent = {
  title: 'world',
  body: 'The settings the whole pipeline runs under: seed, daylight, saved presets and the randomize rolls.',
};

export function openFolderTip(folder: string, closedTip: TooltipContent): TooltipContent {
  return { title: `close ${folder}`, body: closedTip.body };
}

export function stampGroupTip(name: string): TooltipContent {
  return {
    title: `stamp ${name}`,
    body: 'Inserts this group at the end of the pipeline, renamed so its ids do not collide and filed under its own folder.',
  };
}

export function forgetGroupTip(name: string): TooltipContent {
  return {
    title: `forget ${name}`,
    body: 'Drops this saved group. Nodes already stamped from it stay exactly where they are.',
  };
}

export const ADD_ITEM_TIP: TooltipContent = {
  title: 'add item',
  body: 'Appends a blank item, ready to be named, painted and given a footprint in inventory cells.',
};

export const ADD_CULTURE_TIP: TooltipContent = {
  title: 'add culture',
  body: 'Appends a culture with nothing bound yet — choose its tiles and pieces to shape how its villages build.',
};

export const ADD_CREATURE_TIP: TooltipContent = {
  title: 'add creature',
  body: 'Appends a wandering creature, ready to be given a look, a speed and a behavior.',
};

export const ADD_CHARACTER_TIP: TooltipContent = {
  title: 'add character',
  body: 'Appends a creature that carries things: the same rules plus an inventory grid.',
};
