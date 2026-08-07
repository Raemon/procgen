import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';
import type { ViewMode } from '../viewMode';

export const WORLD_VIEW_TIP: TooltipContent = {
  title: 'world',
  body: 'The generated world itself. Everything the panels on the left describe is drawn here; the pipeline re-runs and this redraws as you tweak.',
};

export const VIEW_MODE_TIPS: Readonly<Record<ViewMode, TooltipContent>> = {
  '3d-god': {
    title: '3-D God',
    body: 'Free camera over the voxel world. Drag to orbit, scroll to zoom — nothing to control but the view.',
    when: 'Judging terrain shape, prefab placement and the overall silhouette of a roll.',
  },
  'agent-god': {
    title: 'Agent God',
    body: 'The same overhead view rendered as ASCII — exactly the characters an agent reads over the API.',
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
};

export const CAPTURE_TIP: TooltipContent = {
  title: 'capture',
  body: 'Drag a rectangle over the world to lift that section — tiles, stacked prefab voxels and terrain height — into a new prefab in the library. Esc leaves capture mode.',
};

export const SIGHT_RANGE_TIP: TooltipContent = {
  title: 'sight',
  body: 'How far the character sees, in tiles: the fog and the ASCII window both end here. Widen it to plan around ground you would otherwise have to walk into; the tiles drawn and read grow with the square of the radius, so it costs frames here and tokens for an agent. Click the number to go back to the default 12. Agents set the same knob with set_sight_radius, or sight_radius_tiles on the API.',
  when: 'Scouting a route from a ridge, or comparing what a far-sighted agent would perceive against a default one.',
};

export const LIFE_TIP: TooltipContent = {
  title: 'life',
  body: 'Runs the creature simulation. Paused, creatures hold their positions; the world itself is unaffected either way.',
};
