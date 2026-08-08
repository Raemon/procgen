import type { HoveredCell, HoveredTile } from './hoveredTile';

export type CellAtPixel = (offsetX: number, offsetY: number) => HoveredCell | null;

export function listenForTileHover(
  target: HTMLElement,
  hovered: HoveredTile,
  cellAtPixel: CellAtPixel,
): void {
  target.addEventListener('pointermove', (event) => {
    const cell = cellAtPixel(event.offsetX, event.offsetY);
    if (cell) hovered.hover(cell);
    else hovered.clear();
  });
  target.addEventListener('pointerleave', () => hovered.clear());
}
