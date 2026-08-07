import type { ReactNode } from 'react';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { classes } from './classes';

export function KnobRow({
  label,
  tooltip,
  className,
  children,
}: {
  label: string;
  tooltip?: TooltipContent;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={classes(
        'mb-2 grid grid-cols-[76px_1fr_auto] items-center gap-2 text-xs',
        className,
      )}
      {...tooltipHandlers(tooltip)}
    >
      <label className="truncate text-ink-dim">{label}</label>
      {children}
    </div>
  );
}
