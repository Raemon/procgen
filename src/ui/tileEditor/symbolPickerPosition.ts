const MARGIN = 8;
const GAP = 4;

export interface PopupPosition {
  left: number;
  top: number;
}

export function symbolPickerPosition(anchor: DOMRect, popup: DOMRect): PopupPosition {
  return { left: horizontalPosition(anchor, popup.width), top: verticalPosition(anchor, popup.height) };
}

function horizontalPosition(anchor: DOMRect, popupWidth: number): number {
  return Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - popupWidth - MARGIN));
}

function verticalPosition(anchor: DOMRect, popupHeight: number): number {
  const below = anchor.bottom + GAP;
  const above = anchor.top - popupHeight - GAP;
  const fitsBelow = below + popupHeight <= window.innerHeight - MARGIN;
  return fitsBelow || above < MARGIN ? below : above;
}
