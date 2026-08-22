import type { ReactNode } from 'react';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export interface LibraryEntry {
  key: string;
  name: string;
  icon: ReactNode;
  rowAdornment?: ReactNode;
  tip: TooltipContent;
  rename?: (name: string) => void;
  insert?: () => void;
  duplicate?: () => void;
  remove?: () => void;
  run?: () => void;
  running?: boolean;
}
