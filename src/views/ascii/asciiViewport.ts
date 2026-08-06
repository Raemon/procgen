import type { CanvasSize } from '../canvasSurface';

export interface AsciiViewport {
  originX: number;
  originY: number;
  columns: number;
  rows: number;
}

export interface AsciiPixelViewport extends AsciiViewport {
  cellPx: number;
  subCellOffsetX: number;
  subCellOffsetY: number;
}

export function viewportCenteredOn(
  centerX: number,
  centerY: number,
  columns: number,
  rows: number,
): AsciiViewport {
  return {
    originX: centerX - Math.floor(columns / 2),
    originY: centerY - Math.floor(rows / 2),
    columns,
    rows,
  };
}

export function viewportCoveringCanvas(
  centerWorldX: number,
  centerWorldY: number,
  cellPx: number,
  size: CanvasSize,
): AsciiPixelViewport {
  const horizontal = axisWindow(centerWorldX, cellPx, size.cssWidth);
  const vertical = axisWindow(centerWorldY, cellPx, size.cssHeight);
  return {
    originX: horizontal.origin,
    originY: vertical.origin,
    columns: horizontal.cells,
    rows: vertical.cells,
    cellPx,
    subCellOffsetX: horizontal.subCellOffset,
    subCellOffsetY: vertical.subCellOffset,
  };
}

function axisWindow(centerWorld: number, cellPx: number, lengthPx: number) {
  const firstVisibleWorld = centerWorld - lengthPx / 2 / cellPx;
  const origin = Math.floor(firstVisibleWorld);
  return {
    origin,
    cells: Math.ceil(lengthPx / cellPx) + 1,
    subCellOffset: (origin - firstVisibleWorld) * cellPx,
  };
}
