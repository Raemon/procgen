import { placeFloatingTip } from './placeFloatingTip';
import { renderTooltipContent, type TooltipContent } from './tooltipContentElements';

let tipElement: HTMLElement | null = null;

export function attachTooltip(target: HTMLElement, content: TooltipContent): void {
  target.addEventListener('mouseenter', () => showTooltip(target, content));
  target.addEventListener('focusin', () => showTooltip(target, content));
  target.addEventListener('mouseleave', hideTooltip);
  target.addEventListener('focusout', hideTooltip);
  target.addEventListener('mousedown', hideTooltip);
}

function showTooltip(target: HTMLElement, content: TooltipContent): void {
  const tip = ensureTipElement();
  tip.replaceChildren(...renderTooltipContent(content));
  tip.classList.remove('hidden');
  placeFloatingTip(tip, target.getBoundingClientRect());
}

export function hideTooltip(): void {
  tipElement?.classList.add('hidden');
}

function ensureTipElement(): HTMLElement {
  if (tipElement) return tipElement;
  tipElement = document.createElement('div');
  tipElement.className = 'floating-tip hidden';
  tipElement.setAttribute('role', 'tooltip');
  document.body.appendChild(tipElement);
  window.addEventListener('scroll', hideTooltip, true);
  return tipElement;
}
