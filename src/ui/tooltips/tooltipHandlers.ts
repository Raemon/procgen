import type { FocusEvent, MouseEvent } from 'react';
import type { TooltipContent } from './tooltipContent';
import { hideTooltip, showTooltip } from './tooltipState';

type AnchorEvent = MouseEvent<HTMLElement> | FocusEvent<HTMLElement>;

export function tooltipHandlers(content: TooltipContent | undefined) {
  if (!content) return {};
  const show = (event: AnchorEvent) =>
    showTooltip(content, event.currentTarget.getBoundingClientRect());
  return {
    onMouseEnter: show,
    onFocus: show,
    onMouseLeave: hideTooltip,
    onBlur: hideTooltip,
    onMouseDown: hideTooltip,
  };
}
