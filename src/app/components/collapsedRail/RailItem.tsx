import type { ReactNode } from 'react';
import { classes } from '../controls/classes';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';

export function RailStack({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  );
}

export function RailItem({
  tip,
  tint,
  dimmed,
  children,
}: {
  tip: TooltipContent;
  tint?: string;
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={classes(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border border-panel-edge bg-field text-[9px] leading-none',
        dimmed && 'opacity-40',
      )}
      style={tint ? { color: tint } : undefined}
      {...tooltipHandlers(tip)}
    >
      {children}
    </span>
  );
}
