import { behaviorLabel } from '../../../creatures/behaviorKinds';
import type { CreatureDef } from '../../../creatures/creatureDef';
import type { TooltipContent } from '../../tooltips/tooltipContent';

export const CREATURE_COLOR_TIP: TooltipContent = {
  title: 'body colour',
  body: 'The base colour of the cube and the ASCII glyph. Painting cube art overrides it face by face.',
};

export const CREATURE_NAME_TIP: TooltipContent = {
  title: 'creature name',
  body: 'How the creature is listed in the display dropdown of a points node — the only place a creature gets spawned from.',
};

export const CREATURE_ART_TIP: TooltipContent = {
  title: 'cube art',
  body: 'Opens the pixel editor for the six faces of this creature’s cube.',
};

export const ADD_CREATURE_TIP: TooltipContent = {
  title: 'add creature',
  body: 'Appends a new creature with default behavior, ready to be named, coloured and tuned.',
};

export function creatureBehaviorTip(creature: CreatureDef): TooltipContent {
  return {
    title: `behavior: ${behaviorLabel(creature.behavior)}`,
    body: 'Opens the behavior knobs — what it does, how fast it moves, how far it sees and how far it strays from where it spawned.',
  };
}

export function deleteCreatureTip(creature: CreatureDef): TooltipContent {
  return {
    title: `delete ${creature.name}`,
    body: 'Removes the creature from the library. Nodes bound to it stop spawning anything.',
  };
}
