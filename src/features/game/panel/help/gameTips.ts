import type { RunningWorldRef } from '@/features/asset-library/worlds/running/runningWorld';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { PLAYABLE_PACES } from '@/features/asset-library/worlds/randomize/playableRoll';
import type { ViewMode } from '../viewMode';

export const GAME_VIEW_TIP: TooltipContent = {
  title: 'world',
  body: 'The generated world itself. Everything the panels on the left describe is drawn here; the pipeline re-runs and this redraws as you tweak.',
};

export const COLLAPSE_WORLD_VIEW_TIP: TooltipContent = {
  title: 'collapse world view',
  body: 'Folds the world down to a rail and gives its width to the columns beside it. Click the rail to bring it back.',
};

export const EXPAND_WORLD_VIEW_TIP: TooltipContent = {
  title: 'expand world view',
  body: 'Reopens the world in whatever room the columns leave it.',
};

export const VIEW_MODE_TIPS: Readonly<Record<ViewMode, TooltipContent>> = {
  '3d-god': {
    title: '3-D God',
    body: 'Free camera over the voxel world. Drag to orbit, scroll to zoom — nothing to control but the view.',
    when: 'Judging terrain shape, piece placement and the overall silhouette of a roll.',
  },
  'agent-god': {
    title: 'Agent God',
    body: 'The same overhead view rendered as ASCII — exactly the characters an agent reads over the API. The wheel zooms it the way it zooms the 3-D view, by widening or narrowing the window of world one look hands you.',
    when: 'Checking that what a language model sees matches what you see.',
  },
  'top-down': {
    title: 'Top Down',
    body: 'The world in 3-D straight from above, north always up, walking as the player. You see the disc around you and no further: a wall or a ridge is drawn and everything behind it lies in shadow, and ground you have already walked past stays dimly lit from memory. Move by compass with W/A/S/D or the arrows; the wheel zooms.',
    when: 'Reading a room or a puzzle as a plan while still playing it blind — what a level looks like to someone inside it, without the first-person camera hiding the layout.',
  },
  'agent-top-down': {
    title: 'Agent Top Down',
    body: 'The top-down view as the ASCII window an agent receives: the same disc, the same shadows, and a second grid saying which tiles are in sight now and which are only remembered. The memory is per agent and lasts as long as it does.',
    when: 'Checking that an agent mapping a world by walking it sees what you see.',
  },
  character: {
    title: '2.5D Character',
    body: 'Walk the world in the body of a player, with the camera at ground level and elevation shaping what you can see. X tips your head up and Z tips it down, three steps either way.',
    when: 'Feeling out scale, walkability and whether a place is legible from inside it.',
  },
  'agent-character': {
    title: 'Agent Character',
    body: 'The character view as the ASCII window an agent receives while playing.',
    when: 'Debugging what an agent can and cannot perceive from where it stands.',
  },
  features: {
    title: 'Features',
    body: 'Every discrete thing the generators placed, on one annotated map — pan and zoom to survey it. Edges are drawn only where a generator truly derived one thing from another.',
    when: 'Auditing what a roll actually produced, and which node each placed thing came from.',
  },
};

export const REROLL_SEED_TIP: TooltipContent = {
  title: 'reroll this world',
  body: `Keeps every node and knob of the running world and rolls a new seed — the same rules laying out a fresh landscape, re-rolled until you would land somewhere with at least ${PLAYABLE_PACES} paces of walkable ground.`,
  when: 'You like this kind of world and want another take on it.',
};

export const RANDOMIZE_WORLD_TIP: TooltipContent = {
  title: 'roll a new world',
  body: `Rolls a fresh combination of nodes, re-rolling until you would land somewhere with at least ${PLAYABLE_PACES} paces of walkable ground. The roll runs as a world seed of its own, so the seed or save you rolled it from keeps the parameters it had. The same roll the world detail panel offers; undo lives there too.`,
  when: 'The current world is dull, or you want somewhere new to walk right away.',
};

export const CAPTURE_TIP: TooltipContent = {
  title: 'capture',
  body: 'Drag a rectangle over the world to lift that section — tiles, stacked piece voxels and terrain height — into a new piece asset. Esc leaves capture mode.',
};

export const SIGHT_RANGE_TIP: TooltipContent = {
  title: 'sight',
  body: 'How far the character sees, in tiles: the fog and the ASCII window both end here. Widen it to plan around ground you would otherwise have to walk into; the tiles drawn and read grow with the square of the radius, so it costs frames here and tokens for an agent. Click the number to go back to the default 12. Agents set the same knob with set_sight_radius, or sight_radius_tiles on the API.',
  when: 'Scouting a route from a ridge, or comparing what a far-sighted agent would perceive against a default one.',
};

export const ASCII_COLOR_TIP: TooltipContent = {
  title: 'color',
  body: 'Colored mode paints each glyph with the average color of its tile and draws walkable tiles at 35% opacity. White text is exactly the characters an agent reads. This panel only — agents always receive plain text.',
};

export const SOUND_TIP: TooltipContent = {
  title: 'sound',
  body: 'Plays the world: footsteps, jumps, crates scraping along the floor, a goal plate lighting, and a door opening once every goal on its circuit is filled. Off, the world is silent; the setting is remembered.',
};

export const VIGOR_TIP: TooltipContent = {
  title: 'vigor',
  body: 'How much harm the character you play can still take before it goes down, out of the vigor its creature definition gives it. Anything that chases you rakes at you the moment it catches you; C swings back at whatever stands within two tiles ahead, and a creature that has taken more harm than it has vigor is gone for good. Left alone for a few seconds the character mends a point at a time, and going down wakes it back at the spot the world starts you.',
};

export const LIFE_TIP: TooltipContent = {
  title: 'life',
  body: 'Runs the creature simulation. Paused, creatures hold their positions; the world itself is unaffected either way.',
};

export const SAVE_WORLD_TIP: TooltipContent = {
  title: 'save this world',
  body: 'Keeps the world on screen as a saved world: the seed frozen as it stands, plus where you are, what you have picked up off the ground, and which fixtures and crates you have moved. From then on playing writes itself back to that save.',
  when: 'You have got somewhere worth coming back to.',
};

export function runningWorldTip(running: RunningWorldRef | null): TooltipContent {
  if (!running) {
    return {
      title: 'no world running',
      body: 'Nothing is on screen. Press ▶ run on a world seed to grow one, or on a saved world to pick a run back up.',
    };
  }
  if (running.kind === 'saved') {
    return {
      title: `running: ${running.name}`,
      body: 'A saved world — everything you had done in it is applied, and playing on keeps writing back here. Click to open the save in the detail column.',
    };
  }
  return {
    title: `running: ${running.name}`,
    body: 'The world seed this panel is growing. Click to open it in the detail column, where its nodes are edited.',
  };
}
