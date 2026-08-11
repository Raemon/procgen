import type { ReactNode } from 'react';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export interface LibraryEntry {
  key: string;
  name: string;
  icon: ReactNode;
  rowAdornment?: ReactNode;
  tip: TooltipContent;
  duplicate?: () => void;
  remove?: () => void;
  run?: () => void;
  running?: boolean;
}
