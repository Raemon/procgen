import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export const LIGHT_RADIUS_TIP: TooltipContent = {
  title: 'light radius',
  body: 'How far this casts light into the dark, in tiles. 0 emits nothing — in a world with no daylight that leaves it invisible until something else lights it. A character carrying a lit item casts its light wherever it walks.',
};

export const LIGHT_INK_TIP: TooltipContent = {
  title: 'light colour',
  body: 'The colour of the light cast, independent of the colour of the art itself: cold blue crystal, warm orange flame.',
};
