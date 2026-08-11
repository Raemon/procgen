import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { CULTURE_PIECES_TIP, CULTURE_PROPORTIONS_TIP, CULTURE_TILES_TIP } from './help/cultureTips';

export const CULTURE_PANELS = ['none', 'tiles', 'proportions', 'pieces'] as const;

export type CulturePanel = (typeof CULTURE_PANELS)[number];

export interface CultureDrawer {
  panel: Exclude<CulturePanel, 'none'>;
  label: string;
  tip: TooltipContent;
}

export const CULTURE_DRAWERS: readonly CultureDrawer[] = [
  { panel: 'tiles', label: 'tiles', tip: CULTURE_TILES_TIP },
  { panel: 'proportions', label: 'proportions', tip: CULTURE_PROPORTIONS_TIP },
  { panel: 'pieces', label: 'pieces', tip: CULTURE_PIECES_TIP },
];
