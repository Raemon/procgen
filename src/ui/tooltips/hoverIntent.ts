import type { TooltipContent } from './tooltipContent';
import { activeTooltip, hideTooltip, showTooltip } from './tooltipState';

const HOVER_DELAY_MS = 320;

let pending: ReturnType<typeof setTimeout> | null = null;

/** A tip waits out a deliberate hover, but once one is up the next follows the pointer at once. */
export function showTooltipOnHoverIntent(content: TooltipContent, anchor: DOMRect): void {
  cancelPendingTooltip();
  if (activeTooltip()) return showTooltip(content, anchor);
  pending = setTimeout(() => showTooltip(content, anchor), HOVER_DELAY_MS);
}

export function hideTooltipAndCancelPending(): void {
  cancelPendingTooltip();
  hideTooltip();
}

function cancelPendingTooltip(): void {
  if (pending !== null) clearTimeout(pending);
  pending = null;
}
