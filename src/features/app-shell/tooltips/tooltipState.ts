import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';
import type { TooltipContent } from './tooltipContent';

export interface ActiveTooltip {
  content: TooltipContent;
  anchor: DOMRect;
}

let active: ActiveTooltip | null = null;
const changed = new ChangeNotifier();

export const subscribeToTooltip = changed.subscribe;

export function activeTooltip(): ActiveTooltip | null {
  return active;
}

export function showTooltip(content: TooltipContent, anchor: DOMRect): void {
  active = { content, anchor };
  changed.emit();
}

export function hideTooltip(): void {
  if (!active) return;
  active = null;
  changed.emit();
}
