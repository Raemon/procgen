import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import type { LibraryFolder } from '../librarySelection';

export const FOLDER_TIPS: Readonly<Record<LibraryFolder, TooltipContent>> = {
  worlds: {
    title: 'worlds',
    body: 'Whole worlds: the one you are editing, the examples that ship with the editor, and the ones you have saved. A world is the pipeline of nodes that generates it, seed and daylight included.',
  },
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
    body: 'Bookmarked groups of procgen nodes that function together, with the wiring between them already made. Stamp one into the world you are editing, or send a folder band from that world back here to reuse it.',
  },
};

export const CURRENT_WORLD_TIP: TooltipContent = {
  title: 'this world',
  body: 'The world you are editing: its seed, its daylight, and the nodes generating it. Opens as the full pipeline in the detail column.',
};

export function savedWorldTip(name: string, description: string, saved: boolean): TooltipContent {
  return { title: saved ? `★ ${name}` : name, body: description };
}

export function loadWorldTip(name: string): TooltipContent {
  return {
    title: `load ${name}`,
    body: 'Replaces every node in the world you are editing with this one. Asks first; assets are left alone.',
  };
}

export function deleteWorldTip(name: string): TooltipContent {
  return {
    title: `delete ${name}`,
    body: 'Drops this saved world. The world you are editing is untouched.',
  };
}

export const SEND_BAND_TO_LIBRARY_TIP: TooltipContent = {
  title: 'send to the asset library',
  body: 'Files this band in the node groups folder as a group you can stamp into any world, and opens it there. Wiring inside the folder is kept; wiring to nodes outside it is left open for the next stamp to fill.',
};

export function openFolderTip(folder: string, closedTip: TooltipContent): TooltipContent {
  return { title: `close ${folder}`, body: closedTip.body };
}

export function stampGroupTip(name: string): TooltipContent {
  return {
    title: `stamp ${name}`,
    body: 'Inserts this group at the end of the world you are editing, renamed so its ids do not collide and filed under its own folder band.',
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
