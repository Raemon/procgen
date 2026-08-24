import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import type { LibraryFolder } from '../librarySelection';
import type { SavedWorld } from '../worlds/saved/savedWorld';

export const FOLDER_TIPS: Readonly<Record<LibraryFolder, TooltipContent>> = {
  worldSeeds: {
    title: 'world seeds',
    body: 'The recipes worlds grow from: the examples that ship with the editor and the ones you have made. A world seed is the pipeline of nodes that generates a world, seed number and daylight included, and the same seed always grows the same world. Selecting one opens it for editing; ▶ run grows it in the game panel.',
  },
  savedWorlds: {
    title: 'saved worlds',
    body: 'Worlds you have been in and kept: the seed frozen as it was, plus everything you did there — what you picked up, which fixtures you worked, where the crates ended up, where you were standing. ▶ run drops you back exactly where you left off.',
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
    body: 'Bookmarked groups of procgen nodes that function together, with the wiring between them already made. Edit one here like a world seed, stamp it into the running world, or send a folder band from a world seed back here to reuse it.',
  },
};

export function savedWorldTip(saved: SavedWorld, running: boolean): TooltipContent {
  const doneHere = [
    `${saved.takenItems.length} items taken`,
    `${saved.puzzles.on.length} fixtures worked`,
    `${saved.puzzles.crates.length} crates moved`,
  ].join(', ');
  return {
    title: running ? `${saved.name} — running` : saved.name,
    body: `${saved.description || `Grown from the world seed '${saved.seededBy}'.`} ${doneHere}; the player stands at (${saved.player.x},${saved.player.y}).`,
  };
}

export function worldSeedTip(name: string, description: string, running: boolean): TooltipContent {
  return { title: running ? `${name} — running` : name, body: description };
}

export function runWorldSeedTip(name: string, running: boolean): TooltipContent {
  return running
    ? {
        title: `${name} is running`,
        body: 'The game panel is showing the world this seed grew, so every edit here lands on screen as you make it.',
      }
    : {
        title: `run ${name}`,
        body: 'Grows this seed into the game panel. Whatever was running keeps every edit you made to it — world seeds are saved as you work.',
      };
}

export function copyWorldSeedTip(name: string): TooltipContent {
  return {
    title: `duplicate ${name}`,
    body: 'Files a copy of this world seed under a free name, so you can take it somewhere else without losing this one.',
  };
}

export function deleteWorldSeedTip(name: string): TooltipContent {
  return {
    title: `delete ${name}`,
    body: 'Takes this world off the library shelf. Assets it used are left alone.',
  };
}

export const SEND_BAND_TO_LIBRARY_TIP: TooltipContent = {
  title: 'send to the asset library',
  body: 'Files this band in the node groups folder as a group you can stamp into any world, and opens it there. Wiring inside the folder is kept; wiring to nodes outside it is left open for the next stamp to fill.',
};

export function openFolderTip(folder: string, closedTip: TooltipContent): TooltipContent {
  return { title: `close ${folder}`, body: closedTip.body };
}

export function stampGroupTip(name: string, runningWorld: string): TooltipContent {
  if (!runningWorld) {
    return {
      title: `stamp ${name}`,
      body: 'Stamping copies a group into the running world — press ▶ run on a world first.',
    };
  }
  return {
    title: `stamp ${name} into ${runningWorld}`,
    body: 'Inserts this group at the end of the running world, renamed so its ids do not collide and filed under its own folder band.',
  };
}

export function openGroupTip(name: string): TooltipContent {
  return {
    title: `open ${name}`,
    body: 'Opens the node group these nodes were filed under, in place of this detail view.',
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

export const ADD_CHARACTER_TIP: TooltipContent = {
  title: 'add character',
  body: 'Appends a creature that carries things: the same rules plus an inventory grid.',
};
