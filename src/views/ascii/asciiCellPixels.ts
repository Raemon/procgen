import type { CanvasSize } from '../canvasSurface';

export const BASE_CELL_PX = 16;
export const MIN_CELL_PX = 3;
export const MAX_CELL_PX = 320;
export const MIN_ZOOM_SCALE = MIN_CELL_PX / BASE_CELL_PX;
export const MAX_ZOOM_SCALE = MAX_CELL_PX / BASE_CELL_PX;
export const GLYPH_LEGIBLE_CELL_PX = 7;

const MAX_CELLS_DRAWN = 250_000;

export function cellPixelsFor(zoomScale: number, size: CanvasSize): number {
  const floor = Math.max(MIN_CELL_PX, cellPixelsWithinDrawBudget(size));
  return Math.max(floor, Math.min(MAX_CELL_PX, BASE_CELL_PX * zoomScale));
}

function cellPixelsWithinDrawBudget(size: CanvasSize): number {
  return Math.sqrt((size.cssWidth * size.cssHeight) / MAX_CELLS_DRAWN);
}
