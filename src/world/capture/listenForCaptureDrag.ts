import type { CaptureCell, CaptureTool } from './captureTool';

export type CellAtPixel = (offsetX: number, offsetY: number) => CaptureCell | null;

export function listenForCaptureDrag(
  target: HTMLElement,
  tool: CaptureTool,
  cellAtPixel: CellAtPixel,
): void {
  target.addEventListener('pointerdown', (event) => {
    const cell = tool.isActive() ? cellAtPixel(event.offsetX, event.offsetY) : null;
    if (!cell) return;
    target.setPointerCapture(event.pointerId);
    tool.begin(cell);
  });

  target.addEventListener('pointermove', (event) => {
    const cell = tool.isActive() ? cellAtPixel(event.offsetX, event.offsetY) : null;
    if (cell) tool.extendTo(cell);
  });

  const end = (): void => {
    if (tool.isActive()) tool.finish();
  };
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
}
