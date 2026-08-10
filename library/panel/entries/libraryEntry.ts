import type { ReactNode } from 'react';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';

export interface LibraryEntry {
  key: string;
  name: string;
  icon: ReactNode;
  tip: TooltipContent;
  duplicate?: () => void;
  remove?: () => void;
  run?: () => void;
  running?: boolean;
}
