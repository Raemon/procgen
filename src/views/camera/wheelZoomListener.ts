const PIXELS_PER_WHEEL_LINE = 16;
const PIXELS_PER_WHEEL_PAGE = 400;

export interface CursorPixels {
  x: number;
  y: number;
}

export function listenForWheelZoom(
  target: HTMLElement,
  onZoomPixels: (wheelPixelsY: number, cursor: CursorPixels) => void,
): void {
  target.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      onZoomPixels(wheelPixelsOf(event), { x: event.offsetX, y: event.offsetY });
    },
    { passive: false },
  );
}

function wheelPixelsOf(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * PIXELS_PER_WHEEL_LINE;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * PIXELS_PER_WHEEL_PAGE;
  return event.deltaY;
}
