import type { ButtonHTMLAttributes } from 'react';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { classes } from './classes';

const BASE_CLASSES =
  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border p-0.5 disabled:cursor-default disabled:opacity-40';
const IDLE_CLASSES = 'border-btn-edge bg-btn text-ink-dim hover:bg-btn-hover hover:text-ink';
const ACTIVE_CLASSES = 'border-accent bg-btn-active text-accent';

export function IconButton({
  active,
  tip,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; tip?: TooltipContent }) {
  return (
    <button
      type="button"
      aria-label={tip?.title}
      className={classes(BASE_CLASSES, active ? ACTIVE_CLASSES : IDLE_CLASSES, className)}
      {...props}
      {...tooltipHandlers(tip)}
    />
  );
}
