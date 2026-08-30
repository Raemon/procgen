import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import type { WorldsCamera } from '../worldsCamera';
import { VIEW_MODE_TIPS } from '../../panel/help/gameTips';

export const WORLDS_GRID_SIZE_TIP: TooltipContent = {
  title: 'grid size',
  body: 'How many world rolls sit side by side, and how many sit one under another. Each cell is the same pipeline at a different seed.',
};

export const WORLDS_COLUMNS_TIP: TooltipContent = {
  title: 'world columns',
  body: 'How many world rolls sit side by side. Each cell is the same pipeline at a different seed.',
};

export const WORLDS_ROWS_TIP: TooltipContent = {
  title: 'world rows',
  body: 'How many world rolls sit one under another. Each cell is the same pipeline at a different seed.',
};

export const WORLDS_ZOOM_TIP: TooltipContent = {
  title: 'zoom',
  body: 'How close every world in the grid is looked at. The ascii window and the 3-D god camera share this distance. Each step out halves it, down to a hundred and twenty-eighth of the near view.',
};

export const WORLDS_ZOOM_RESET_TIP: TooltipContent = {
  title: 'reset zoom',
  body: 'Puts every cell back at the near view the grid opens with.',
};

export const WORLDS_ZOOM_OUT_TIP: TooltipContent = {
  title: 'zoom further out',
  body: 'Halves the zoom, out to a hundred and twenty-eighth. Far out, the 3-D cell trades streamed tiles for a coarse map of the whole region.',
};

export const WORLDS_ZOOM_IN_TIP: TooltipContent = {
  title: 'zoom in',
  body: 'Doubles the zoom, back toward tile-by-tile detail around the spawn.',
};

export const WORLDS_CAMERA_TIPS: Readonly<Record<WorldsCamera, TooltipContent>> = {
  ascii: VIEW_MODE_TIPS['agent-god'],
  '3d-god': VIEW_MODE_TIPS['3d-god'],
};

export function selectSeedTip(seed: number, selected: boolean): TooltipContent {
  return selected
    ? {
        title: `seed ${seed}`,
        body: 'This is the seed the game view is showing.',
      }
    : {
        title: `seed ${seed}`,
        body: 'Puts this roll in the game view. The pipeline stays as it is; only the seed number changes.',
      };
}
