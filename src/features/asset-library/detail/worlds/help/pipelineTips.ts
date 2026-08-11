import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export const SEED_TIP: TooltipContent = {
  title: 'world seed',
  body: 'The one number every node draws its randomness from. Same seed and same nodes always generate the same world; change it and the shape of everything changes while the rules stay put.',
};

export const DAYLIGHT_TIP: TooltipContent = {
  title: 'daylight',
  body: 'How much light the sky gives this world. At 0 the world is pitch dark and only tiles, items and carried lights are visible — the setting an underground world wants. At 1 the sun is up everywhere.',
};

export const TIME_TIP: TooltipContent = {
  title: 'world time',
  body: 'The moment the world is shown at. The scale is logarithmic into the past, so the right half of the slider is the settled centuries — buildings, then villages, thinning away — and the left half is the volcanic aeons, where islands sink back under the sea. Only nodes that read time answer to it, and they recompute alone.',
};

export const ROLL_SEED_TIP: TooltipContent = {
  title: 'roll a new seed',
  body: 'Rerolls the world without touching the pipeline — the fastest way to see whether a setup produces good worlds in general or just got lucky once.',
};

export const CLEAR_PIPELINE_TIP: TooltipContent = {
  title: 'clear',
  body: 'Removes every node from this world and leaves it blank. Asks first; there is no undo for this one.',
};

export const RANDOMIZE_TIPS = {
  world: {
    title: 'roll a world',
    body: 'Throws the pipeline away and rolls a fresh combination of nodes from scratch.',
    when: 'Looking for a starting point, or for ideas you would not have wired by hand.',
  },
  sliders: {
    title: 'roll the sliders',
    body: 'Keeps the nodes and wiring exactly as they are and nudges every numeric knob.',
    when: 'The structure is right but the world feels off.',
  },
  nodes: {
    title: 'roll the nodes',
    body: 'Mutates the combination itself: swaps, adds, removes or rewires a node or two.',
    when: 'Exploring near something that already half works.',
  },
  undo: {
    title: 'undo the roll',
    body: 'Restores the pipeline exactly as it stood before the last roll.',
  },
} as const satisfies Record<string, TooltipContent>;

export const COLLAPSE_ALL_TIP: TooltipContent = {
  title: 'collapse all',
  body: 'Folds every node down to its icon row, so a long pipeline reads as a list of steps rather than a wall of knobs.',
};

export const EXPAND_ALL_TIP: TooltipContent = {
  title: 'expand all',
  body: 'Opens every node card back up.',
};

export const NODE_TYPE_FILTER_TIP: TooltipContent = {
  title: 'filter node types',
  body: 'Narrows the catalogue by name or category as you type. Enter adds the first match, Esc closes the menu.',
};

export const ADD_NODE_TIP: TooltipContent = {
  title: 'add node',
  body: 'Opens the catalogue of node types, grouped by what they produce. A new node lands at the end and wires itself to the nearest matching source.',
};
