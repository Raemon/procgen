const MIN_PANEL_WIDTH = 150;
const MAX_PANEL_WIDTH = 640;
const HANDLE_WIDTH = 6;

type PanelWidths = [number, number];

export function enablePanelResizing(app: HTMLElement, startWidths: PanelWidths): void {
  const widths: PanelWidths = [...startWidths];
  applyColumnWidths(app, widths);
  app.querySelectorAll<HTMLElement>('.panel-resizer').forEach((handle, index) => {
    handle.addEventListener('pointerdown', (down) =>
      beginHandleDrag(app, handle, down, widths, index),
    );
  });
}

function beginHandleDrag(
  app: HTMLElement,
  handle: HTMLElement,
  down: PointerEvent,
  widths: PanelWidths,
  index: number,
): void {
  down.preventDefault();
  handle.setPointerCapture(down.pointerId);
  handle.classList.add('dragging');
  const startX = down.clientX;
  const startWidth = widths[index] ?? MIN_PANEL_WIDTH;
  const onMove = (move: PointerEvent): void => {
    widths[index] = clampPanelWidth(startWidth + move.clientX - startX);
    applyColumnWidths(app, widths);
  };
  const onUp = (): void => {
    handle.classList.remove('dragging');
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
  };
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
}

function clampPanelWidth(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

function applyColumnWidths(app: HTMLElement, widths: PanelWidths): void {
  app.style.gridTemplateColumns = `${widths[0]}px ${HANDLE_WIDTH}px ${widths[1]}px ${HANDLE_WIDTH}px 1fr`;
}
