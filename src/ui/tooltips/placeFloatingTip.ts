const GAP = 10;
const VIEWPORT_MARGIN = 8;

export function placeFloatingTip(tip: HTMLElement, target: DOMRect): void {
  const tipRect = tip.getBoundingClientRect();
  tip.style.left = `${horizontalPosition(target, tipRect.width)}px`;
  tip.style.top = `${verticalPosition(target, tipRect.height)}px`;
}

function horizontalPosition(target: DOMRect, tipWidth: number): number {
  const rightOfTarget = target.right + GAP;
  if (rightOfTarget + tipWidth <= window.innerWidth - VIEWPORT_MARGIN) return rightOfTarget;
  return Math.max(VIEWPORT_MARGIN, target.left - GAP - tipWidth);
}

function verticalPosition(target: DOMRect, tipHeight: number): number {
  const lowestAllowed = window.innerHeight - tipHeight - VIEWPORT_MARGIN;
  return Math.min(Math.max(target.top, VIEWPORT_MARGIN), lowestAllowed);
}
