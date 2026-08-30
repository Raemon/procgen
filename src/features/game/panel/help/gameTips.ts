import type { RunningWorldRef } from '@/features/asset-library/worlds/running/runningWorld';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { PLAYABLE_PACES } from '@/features/asset-library/worlds/randomize/playableRoll';
import type { ViewMode } from '../viewMode';

export const GAME_VIEW_TIP: TooltipContent = {
  title: 'world',
  body: 'The generated world itself. Everything the panels on the left describe is drawn here; the pipeline re-runs and this redraws as you tweak.',
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
  character: {
    title: '2.5D Character',
    body: 'Walk the world in the body of a player, with the camera at ground level and elevation shaping what you can see.',
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
