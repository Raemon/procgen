import type { ButtonHTMLAttributes } from 'react';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { classes } from './classes';

const BASE_CLASSES =
  'cursor-pointer rounded border px-2.5 py-[5px] text-xs disabled:cursor-default disabled:opacity-40';
const IDLE_CLASSES = 'border-btn-edge bg-btn text-ink hover:bg-btn-hover';
const ACTIVE_CLASSES = 'border-accent bg-btn-active text-accent';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tip?: TooltipContent;
}

export function Button({ active, tip, className, ...props }: ButtonProps) {
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
