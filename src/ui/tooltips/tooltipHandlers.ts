import type { FocusEvent, MouseEvent } from 'react';
import { hideTooltipAndCancelPending, showTooltipOnHoverIntent } from './hoverIntent';
import type { TooltipContent } from './tooltipContent';

type AnchorEvent = MouseEvent<HTMLElement> | FocusEvent<HTMLElement>;

export function tooltipHandlers(content: TooltipContent | undefined) {
  if (!content) return {};
  const show = (event: AnchorEvent) =>
    showTooltipOnHoverIntent(content, event.currentTarget.getBoundingClientRect());
  return {
    onMouseEnter: show,
    onFocus: show,
    onMouseLeave: hideTooltipAndCancelPending,
    onBlur: hideTooltipAndCancelPending,
    onMouseDown: hideTooltipAndCancelPending,
  };
}
